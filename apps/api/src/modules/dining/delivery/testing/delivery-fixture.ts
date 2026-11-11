import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { TEST_BEDS, TEST_POINTS } from '../../../../common/testing/integration-fixture';
import { HOUR_MS, dhakaHour } from '../../../../common/time/dhaka';

/**
 * Stream C test helpers. Builds on `seedTestCatalogue` (users, KOL/SUG beach
 * points, sunbeds). Time is controlled the way other specs do it: rows are
 * placed relative to the real clock rather than faking it.
 */

export const FOOD_IDS = {
  kolVenue: '30000000-0000-4000-8000-000000000001',
  sugVenue: '30000000-0000-4000-8000-000000000002',
  kolCategory: '31000000-0000-4000-8000-000000000001',
  sugCategory: '31000000-0000-4000-8000-000000000002',
  kolTea: '32000000-0000-4000-8000-000000000001',
  kolCoconut: '32000000-0000-4000-8000-000000000002',
  kolFry: '32000000-0000-4000-8000-000000000003',
  kolSoldOut: '32000000-0000-4000-8000-000000000004',
  sugPrawn: '32000000-0000-4000-8000-000000000005',
} as const;

export const KOL_PRICES = { tea: 3000, coconut: 8000, fry: 25000 } as const;

/** Start of the current UTC hour (= Dhaka hour, offset is whole hours). */
export function currentHourStart(now: Date = new Date()): Date {
  return new Date(Math.floor(now.getTime() / HOUR_MS) * HOUR_MS);
}

/** Opening hours that exclude the current Dhaka hour (DB requires close > open, <= 24). */
export function closedHoursNow(now: Date = new Date()): { openHour: number; closeHour: number } {
  const hour = dhakaHour(now);
  return hour < 23 ? { openHour: hour + 1, closeHour: 24 } : { openHour: 0, closeHour: 23 };
}

/**
 * Two delivery venues: one at Kolatoli (three available items, one sold out)
 * and one at Sugandha. Both open around the clock unless overridden.
 */
export async function seedDeliveryVenues(prisma: PrismaService): Promise<void> {
  await prisma.diningVenue.createMany({
    data: [
      {
        id: FOOD_IDS.kolVenue,
        code: 'T-KOL-KITCHEN',
        name: 'Kolatoli Test Kitchen',
        kind: 'BEACH_STALL',
        beachPointId: TEST_POINTS.kolatoli,
        openHour: 0,
        closeHour: 24,
        deliveryEnabled: true,
      },
      {
        id: FOOD_IDS.sugVenue,
        code: 'T-SUG-KITCHEN',
        name: 'Sugandha Test Kitchen',
        kind: 'SEAFOOD_KITCHEN',
        beachPointId: TEST_POINTS.sugandha,
        openHour: 0,
        closeHour: 24,
        deliveryEnabled: true,
      },
    ],
  });
  await prisma.menuCategory.createMany({
    data: [
      { id: FOOD_IDS.kolCategory, venueId: FOOD_IDS.kolVenue, name: 'Snacks' },
      { id: FOOD_IDS.sugCategory, venueId: FOOD_IDS.sugVenue, name: 'Seafood' },
    ],
  });
  const kol = { venueId: FOOD_IDS.kolVenue, categoryId: FOOD_IDS.kolCategory };
  await prisma.menuItem.createMany({
    data: [
      { id: FOOD_IDS.kolTea, ...kol, name: 'Lemon tea', priceMinor: KOL_PRICES.tea },
      { id: FOOD_IDS.kolCoconut, ...kol, name: 'Green coconut', priceMinor: KOL_PRICES.coconut },
      { id: FOOD_IDS.kolFry, ...kol, name: 'Loitta fry', priceMinor: KOL_PRICES.fry },
      { id: FOOD_IDS.kolSoldOut, ...kol, name: 'Crab curry', priceMinor: 60000, isAvailable: false },
      {
        id: FOOD_IDS.sugPrawn,
        venueId: FOOD_IDS.sugVenue,
        categoryId: FOOD_IDS.sugCategory,
        name: 'Tiger prawn',
        priceMinor: 90000,
      },
    ],
  });
}

let refCounter = 0;

/**
 * A sunbed booking line written directly (the booking API refuses past start
 * times, but delivery needs a booking that is running now).
 */
export async function createSunbedBooking(
  prisma: PrismaService,
  options: {
    touristId: string;
    sunbedId?: string;
    /** Hours relative to the current hour start; window is [from, to). */
    fromHour?: number;
    toHour?: number;
    itemStatus?: 'RESERVED' | 'CHECKED_IN' | 'CANCELLED';
    orderStatus?: 'CONFIRMED' | 'CANCELLED';
  },
): Promise<{ orderItemId: string; publicRef: string }> {
  const sunbedId = options.sunbedId ?? TEST_BEDS.kol001;
  const sunbed = await prisma.sunbed.findUniqueOrThrow({
    where: { id: sunbedId },
    include: { beachPoint: true },
  });
  const base = currentHourStart();
  const startAt = new Date(base.getTime() + (options.fromHour ?? -1) * HOUR_MS);
  const endAt = new Date(base.getTime() + (options.toHour ?? 2) * HOUR_MS);
  const hours = Math.round((endAt.getTime() - startAt.getTime()) / HOUR_MS);
  const total = sunbed.hourlyPriceMinor * hours;
  refCounter += 1;
  const publicRef = `BK-FOODTEST-${String(refCounter).padStart(4, '0')}`;

  const order = await prisma.order.create({
    data: {
      publicRef,
      touristId: options.touristId,
      status: options.orderStatus ?? 'CONFIRMED',
      subtotalMinor: total,
      totalMinor: total,
      items: {
        create: {
          sunbedId: sunbed.id,
          beachPointCode: sunbed.beachPoint.code,
          beachPointName: sunbed.beachPoint.name,
          sunbedCode: sunbed.code,
          startAt,
          endAt,
          unitPriceMinor: sunbed.hourlyPriceMinor,
          totalMinor: total,
          status: options.itemStatus ?? 'RESERVED',
        },
      },
    },
    include: { items: true },
  });
  return { orderItemId: order.items[0].id, publicRef };
}
