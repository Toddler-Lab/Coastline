import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { TEST_BEDS, TEST_POINTS, TEST_USERS } from '../../../../common/testing/integration-fixture';
import { dhakaHourToUtc } from '../../../../common/time/dhaka';

/**
 * Stream D fixture: dining rows inserted directly with Prisma so the admin
 * specs do not depend on the reservation and delivery write paths. Run after
 * `reseedTestDatabase`, which provides users, beach points and sunbeds.
 */
export const ADMIN_FIXTURE = {
  activeVenue: 'FX-ACTIVE',
  inactiveVenue: 'FX-HIDDEN',
  townVenue: 'FX-TOWN',
} as const;

export interface AdminDiningFixture {
  activeVenueId: string;
  inactiveVenueId: string;
  availableItemId: string;
  unavailableItemId: string;
  orderedItemId: string;
  /** Food order rows placed today that the overview should count as revenue. */
  expected: {
    venueCount: number;
    reservationsToday: number;
    openFoodOrders: number;
    foodRevenueMinor: number;
  };
}

function shiftDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00.000Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export async function seedAdminDiningFixture(
  prisma: PrismaService,
  today: string,
): Promise<AdminDiningFixture> {
  const activeVenue = await prisma.diningVenue.create({
    data: {
      code: ADMIN_FIXTURE.activeVenue,
      name: 'Fixture Seafood',
      kind: 'SEAFOOD_KITCHEN',
      beachPointId: TEST_POINTS.sugandha,
      openHour: 10,
      closeHour: 22,
      reservationsEnabled: true,
      deliveryEnabled: true,
      reservationDepositMinor: 20000,
      sortOrder: 1,
    },
  });
  const inactiveVenue = await prisma.diningVenue.create({
    data: {
      code: ADMIN_FIXTURE.inactiveVenue,
      name: 'Fixture Closed Stall',
      kind: 'BEACH_STALL',
      beachPointId: TEST_POINTS.kolatoli,
      openHour: 8,
      closeHour: 18,
      isActive: false,
      sortOrder: 2,
    },
  });
  await prisma.diningVenue.create({
    data: {
      code: ADMIN_FIXTURE.townVenue,
      name: 'Fixture Town Kitchen',
      kind: 'RESTAURANT',
      openHour: 11,
      closeHour: 23,
      sortOrder: 3,
    },
  });

  const mains = await prisma.menuCategory.create({
    data: { venueId: activeVenue.id, name: 'Mains', sortOrder: 1 },
  });
  const ordered = await prisma.menuItem.create({
    data: {
      venueId: activeVenue.id,
      categoryId: mains.id,
      name: 'Grilled pomfret',
      priceMinor: 45000,
      sortOrder: 1,
    },
  });
  const available = await prisma.menuItem.create({
    data: {
      venueId: activeVenue.id,
      categoryId: mains.id,
      name: 'Prawn curry',
      priceMinor: 38000,
      sortOrder: 2,
    },
  });
  const unavailable = await prisma.menuItem.create({
    data: {
      venueId: activeVenue.id,
      categoryId: mains.id,
      name: 'Lobster platter',
      priceMinor: 150000,
      isAvailable: false,
      sortOrder: 3,
    },
  });
  const stallSnacks = await prisma.menuCategory.create({
    data: { venueId: inactiveVenue.id, name: 'Snacks' },
  });
  await prisma.menuItem.create({
    data: {
      venueId: inactiveVenue.id,
      categoryId: stallSnacks.id,
      name: 'Jhal muri',
      priceMinor: 3000,
    },
  });

  const table = await prisma.diningTable.create({
    data: { venueId: activeVenue.id, code: 'FX-ACTIVE-T01', seats: 4 },
  });

  const reservation = (ref: string, dateKey: string, hour: number, status: string) =>
    prisma.tableReservation.create({
      data: {
        publicRef: ref,
        touristId: TEST_USERS.tourist,
        venueId: activeVenue.id,
        tableId: table.id,
        venueCode: activeVenue.code,
        venueName: activeVenue.name,
        tableCode: table.code,
        partySize: 2,
        startAt: dhakaHourToUtc(dateKey, hour),
        endAt: dhakaHourToUtc(dateKey, hour + 1),
        status: status as 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED',
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
      },
    });
  // Today: two count (confirmed + checked-in), the cancelled one does not.
  await reservation('DR-FX-0001', today, 12, 'CONFIRMED');
  await reservation('DR-FX-0002', today, 19, 'CHECKED_IN');
  await reservation('DR-FX-0003', today, 13, 'CANCELLED');
  // Boundaries: 23:00 Dhaka today counts; 00:00 Dhaka tomorrow and yesterday do not.
  await reservation('DR-FX-0004', today, 23, 'CONFIRMED');
  await reservation('DR-FX-0005', shiftDays(today, 1), 0, 'CONFIRMED');
  await reservation('DR-FX-0006', shiftDays(today, -1), 21, 'CONFIRMED');

  // A sunbed booking line to deliver to.
  const order = await prisma.order.create({
    data: {
      publicRef: 'BK-FX-0001',
      touristId: TEST_USERS.tourist,
      subtotalMinor: 20000,
      totalMinor: 20000,
    },
  });
  const line = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      sunbedId: TEST_BEDS.sug001,
      beachPointCode: 'SUG',
      beachPointName: 'Sugandha',
      sunbedCode: 'SUG-001',
      startAt: dhakaHourToUtc(today, 10),
      endAt: dhakaHourToUtc(today, 12),
      unitPriceMinor: 10000,
      totalMinor: 20000,
      status: 'RESERVED',
    },
  });

  let seq = 0;
  const foodOrder = (status: string, placedAt: Date, quantity: number) => {
    seq += 1;
    const total = ordered.priceMinor * quantity;
    return prisma.foodOrder.create({
      data: {
        publicRef: `FO-FX-${String(seq).padStart(4, '0')}`,
        touristId: TEST_USERS.tourist,
        venueId: activeVenue.id,
        orderItemId: line.id,
        venueCode: activeVenue.code,
        venueName: activeVenue.name,
        sunbedCode: 'SUG-001',
        beachPointCode: 'SUG',
        beachPointName: 'Sugandha',
        status: status as 'PLACED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED',
        subtotalMinor: total,
        totalMinor: total,
        placedAt,
        items: {
          create: [
            {
              menuItemId: ordered.id,
              itemName: ordered.name,
              unitPriceMinor: ordered.priceMinor,
              quantity,
              totalMinor: total,
            },
          ],
        },
      },
    });
  };

  const todayNoon = dhakaHourToUtc(today, 11);
  await foodOrder('PLACED', todayNoon, 1); // open, 45 000
  await foodOrder('PREPARING', todayNoon, 2); // open, 90 000
  await foodOrder('DELIVERED', todayNoon, 1); // closed, 45 000
  await foodOrder('CANCELLED', todayNoon, 3); // excluded from revenue
  await foodOrder('READY', dhakaHourToUtc(shiftDays(today, -1), 15), 1); // open, yesterday

  return {
    activeVenueId: activeVenue.id,
    inactiveVenueId: inactiveVenue.id,
    availableItemId: available.id,
    unavailableItemId: unavailable.id,
    orderedItemId: ordered.id,
    expected: {
      venueCount: 2,
      reservationsToday: 3,
      openFoodOrders: 3,
      foodRevenueMinor: 45000 + 90000 + 45000,
    },
  };
}
