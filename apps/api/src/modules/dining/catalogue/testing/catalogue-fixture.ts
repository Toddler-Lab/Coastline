import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { TEST_POINTS } from '../../../../common/testing/integration-fixture';

/**
 * Deterministic dining catalogue for the stream A specs. Runs on top of
 * `seedTestCatalogue` (which truncates dining tables and seeds KOL + SUG).
 *
 * Venues (sort order, name):
 *   T-SUG-GRILL  SEAFOOD_KITCHEN  SUG  reserve+deliver  sort 1  cheapest available 4000
 *   T-KOL-STALL  BEACH_STALL      KOL  deliver only     sort 2  cheapest 2000 (1500 unavailable)
 *   T-B-TOWN     RESTAURANT       -    reserve only     sort 3  empty menu -> priceFrom null
 *   T-A-TOWN     RESTAURANT       -    neither          sort 3  name sorts before T-B-TOWN
 *   T-HIDDEN     RESTAURANT       SUG  inactive
 */
export const CATALOGUE_VENUES = {
  sugGrill: 'T-SUG-GRILL',
  kolStall: 'T-KOL-STALL',
  bTown: 'T-B-TOWN',
  aTown: 'T-A-TOWN',
  hidden: 'T-HIDDEN',
} as const;

export async function seedDiningCatalogue(prisma: PrismaService): Promise<void> {
  const sugGrill = await prisma.diningVenue.create({
    data: {
      code: CATALOGUE_VENUES.sugGrill,
      name: 'Test Sugandha Grill',
      nameBn: 'টেস্ট সুগন্ধা গ্রিল',
      kind: 'SEAFOOD_KITCHEN',
      description: 'Grill by the sunbed line.',
      address: 'Sugandha road (test)',
      contactPhone: '+880 1700 000099',
      imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de',
      cuisineTags: ['Seafood', 'Grill'],
      beachPointId: TEST_POINTS.sugandha,
      openHour: 11,
      closeHour: 22,
      reservationsEnabled: true,
      deliveryEnabled: true,
      reservationDepositMinor: 10000,
      sortOrder: 1,
    },
  });
  // Categories created out of display order to prove ordering comes from sort_order.
  const drinks = await prisma.menuCategory.create({
    data: { venueId: sugGrill.id, name: 'Drinks', nameBn: 'পানীয়', sortOrder: 2 },
  });
  const grill = await prisma.menuCategory.create({
    data: { venueId: sugGrill.id, name: 'Grill', nameBn: 'গ্রিল', sortOrder: 1 },
  });
  await prisma.menuItem.createMany({
    data: [
      {
        venueId: sugGrill.id,
        categoryId: grill.id,
        name: 'Crab Masala',
        priceMinor: 3000,
        isAvailable: false,
        sortOrder: 3,
      },
      {
        venueId: sugGrill.id,
        categoryId: grill.id,
        name: 'Pomfret Grill',
        nameBn: 'রূপচাঁদা গ্রিল',
        description: 'Whole fish, charcoal grilled.',
        priceMinor: 65000,
        sortOrder: 1,
      },
      {
        venueId: sugGrill.id,
        categoryId: grill.id,
        name: 'Loitta Fry',
        priceMinor: 22000,
        sortOrder: 2,
      },
      {
        venueId: sugGrill.id,
        categoryId: drinks.id,
        name: 'Steamed Rice',
        priceMinor: 4000,
        sortOrder: 1,
      },
    ],
  });

  const kolStall = await prisma.diningVenue.create({
    data: {
      code: CATALOGUE_VENUES.kolStall,
      name: 'Test Kolatoli Stall',
      kind: 'BEACH_STALL',
      cuisineTags: ['Snacks'],
      beachPointId: TEST_POINTS.kolatoli,
      openHour: 8,
      closeHour: 18,
      reservationsEnabled: false,
      deliveryEnabled: true,
      sortOrder: 2,
    },
  });
  const snacks = await prisma.menuCategory.create({
    data: { venueId: kolStall.id, name: 'Snacks', sortOrder: 1 },
  });
  await prisma.menuItem.createMany({
    data: [
      {
        venueId: kolStall.id,
        categoryId: snacks.id,
        name: 'Tea',
        priceMinor: 2000,
      },
      {
        venueId: kolStall.id,
        categoryId: snacks.id,
        name: 'Sold-out Muri',
        priceMinor: 1500,
        isAvailable: false,
      },
    ],
  });

  await prisma.diningVenue.createMany({
    data: [
      {
        code: CATALOGUE_VENUES.bTown,
        name: 'Test B Town Kitchen',
        kind: 'RESTAURANT',
        openHour: 12,
        closeHour: 23,
        reservationsEnabled: true,
        sortOrder: 3,
      },
      {
        code: CATALOGUE_VENUES.aTown,
        name: 'Test A Town Kitchen',
        kind: 'RESTAURANT',
        openHour: 12,
        closeHour: 23,
        sortOrder: 3,
      },
      {
        code: CATALOGUE_VENUES.hidden,
        name: 'Test Hidden Venue',
        kind: 'RESTAURANT',
        beachPointId: TEST_POINTS.sugandha,
        openHour: 10,
        closeHour: 20,
        reservationsEnabled: true,
        deliveryEnabled: true,
        sortOrder: 0,
        isActive: false,
      },
    ],
  });

  const hidden = await prisma.diningVenue.findUniqueOrThrow({
    where: { code: CATALOGUE_VENUES.hidden },
  });
  const hiddenCategory = await prisma.menuCategory.create({
    data: { venueId: hidden.id, name: 'Mains' },
  });
  await prisma.menuItem.create({
    data: { venueId: hidden.id, categoryId: hiddenCategory.id, name: 'Rice', priceMinor: 100 },
  });
}
