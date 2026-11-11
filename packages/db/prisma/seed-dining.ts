/**
 * Dining demo catalogue: venues, menus and tables.
 *
 * Venues are upserted by code, categories by (venue, name), items by
 * (category, name) and tables by code, so re-running the seed is idempotent.
 * All prices are indicative demo prices in BDT poisha (minor units).
 */
import type { PrismaClient } from '../src/index';

type VenueKind = 'RESTAURANT' | 'SEAFOOD_KITCHEN' | 'BEACH_STALL';

interface MenuItemSeed {
  name: string;
  nameBn?: string;
  description?: string;
  priceMinor: number;
  isAvailable?: boolean;
}

interface CategorySeed {
  name: string;
  nameBn?: string;
  items: MenuItemSeed[];
}

interface VenueSeed {
  code: string;
  name: string;
  nameBn: string;
  kind: VenueKind;
  description: string;
  address?: string;
  contactPhone?: string;
  cuisineTags: string[];
  /** Beach point code the venue sits at or delivers to; omit for town venues. */
  beachPointCode?: string;
  openHour: number;
  closeHour: number;
  reservationsEnabled: boolean;
  deliveryEnabled: boolean;
  reservationDepositMinor: number;
  sortOrder: number;
  tableSeats: number[];
  menu: CategorySeed[];
}

const VENUES: VenueSeed[] = [
  {
    code: 'SUG-SEAFOOD',
    name: 'Sugandha Seafood Kitchen',
    nameBn: 'সুগন্ধা সি-ফুড কিচেন',
    kind: 'SEAFOOD_KITCHEN',
    description:
      'Open kitchen grilling the day’s catch a short walk from the Sugandha sunbed line.',
    address: 'Sugandha Point road, Cox’s Bazar (demo)',
    contactPhone: '+880 1700 000001',
    cuisineTags: ['Seafood', 'Grill'],
    beachPointCode: 'SUG',
    openHour: 11,
    closeHour: 22,
    reservationsEnabled: true,
    deliveryEnabled: true,
    reservationDepositMinor: 10000,
    sortOrder: 1,
    tableSeats: [2, 2, 4, 4, 6],
    menu: [
      {
        name: 'Grill & Fry',
        nameBn: 'গ্রিল ও ফ্রাই',
        items: [
          { name: 'Rupchanda (Pomfret) Grill', nameBn: 'রূপচাঁদা গ্রিল', priceMinor: 65000 },
          { name: 'Loitta Fry', nameBn: 'লইট্টা ফ্রাই', priceMinor: 22000 },
          { name: 'Tiger Prawn Grill', nameBn: 'বাগদা চিংড়ি গ্রিল', priceMinor: 120000 },
          { name: 'Crab Masala', nameBn: 'কাঁকড়া মাসালা', priceMinor: 90000, isAvailable: false },
        ],
      },
      {
        name: 'Rice & Sides',
        nameBn: 'ভাত ও সাইড',
        items: [
          { name: 'Steamed Rice', nameBn: 'সাদা ভাত', priceMinor: 4000 },
          { name: 'Shutki Bhorta', nameBn: 'শুটকি ভর্তা', priceMinor: 12000 },
        ],
      },
      {
        name: 'Drinks',
        nameBn: 'পানীয়',
        items: [
          { name: 'Fresh Coconut Water', nameBn: 'ডাবের পানি', priceMinor: 8000 },
          { name: 'Lemon Soda', nameBn: 'লেবু সোডা', priceMinor: 6000 },
        ],
      },
    ],
  },
  {
    code: 'KOL-KITKOT',
    name: 'Kolatoli Kitkot Stall',
    nameBn: 'কলাতলী কিটকট স্টল',
    kind: 'BEACH_STALL',
    description:
      'Licensed beach stall for snacks, tea and coconut, delivered along the sunbed line.',
    cuisineTags: ['Snacks', 'Tea'],
    beachPointCode: 'KOL',
    openHour: 8,
    closeHour: 18,
    reservationsEnabled: false,
    deliveryEnabled: true,
    reservationDepositMinor: 0,
    sortOrder: 2,
    tableSeats: [],
    menu: [
      {
        name: 'Snacks',
        nameBn: 'নাশতা',
        items: [
          { name: 'Jhal Muri', nameBn: 'ঝালমুড়ি', priceMinor: 3000 },
          { name: 'Fried Chotpoti', nameBn: 'ছোলার চটপটি', priceMinor: 6000 },
          { name: 'Singara (2 pcs)', nameBn: 'সিঙ্গারা', priceMinor: 4000 },
        ],
      },
      {
        name: 'Drinks',
        nameBn: 'পানীয়',
        items: [
          { name: 'Hot Milk Tea', nameBn: 'দুধ চা', priceMinor: 2000 },
          { name: 'Fresh Coconut Water', nameBn: 'ডাবের পানি', priceMinor: 8000 },
          { name: 'Bottled Water 500ml', nameBn: 'পানির বোতল', priceMinor: 2500 },
        ],
      },
    ],
  },
  {
    code: 'LAB-BENGALI',
    name: 'Laboni Bengali Table',
    nameBn: 'লাবণী বাঙালি টেবিল',
    kind: 'RESTAURANT',
    description: 'Home-style Bengali lunch and dinner minutes from the Laboni viewpoint.',
    address: 'Laboni Beach road, Cox’s Bazar (demo)',
    contactPhone: '+880 1700 000002',
    cuisineTags: ['Bengali', 'Family'],
    beachPointCode: 'LAB',
    openHour: 10,
    closeHour: 22,
    reservationsEnabled: true,
    deliveryEnabled: true,
    reservationDepositMinor: 0,
    sortOrder: 3,
    tableSeats: [2, 4, 4, 6],
    menu: [
      {
        name: 'Mains',
        nameBn: 'প্রধান খাবার',
        items: [
          { name: 'Beef Bhuna with Rice', nameBn: 'গরুর ভুনা ভাত', priceMinor: 38000 },
          { name: 'Chicken Roast with Polao', nameBn: 'পোলাও রোস্ট', priceMinor: 32000 },
          { name: 'Hilsa Curry with Rice', nameBn: 'ইলিশ ভাত', priceMinor: 55000 },
          { name: 'Vegetable Khichuri', nameBn: 'সবজি খিচুড়ি', priceMinor: 18000 },
        ],
      },
      {
        name: 'Sweets',
        nameBn: 'মিষ্টি',
        items: [{ name: 'Mishti Doi', nameBn: 'মিষ্টি দই', priceMinor: 8000 }],
      },
    ],
  },
  {
    code: 'TOWN-SHUTKI',
    name: 'Marine Drive Shutki House',
    nameBn: 'মেরিন ড্রাইভ শুটকি হাউজ',
    kind: 'RESTAURANT',
    description:
      'Town restaurant known for dried-fish dishes and coastal curries. Reservations only.',
    address: 'Marine Drive, Cox’s Bazar (demo)',
    contactPhone: '+880 1700 000003',
    cuisineTags: ['Shutki', 'Coastal'],
    openHour: 12,
    closeHour: 23,
    reservationsEnabled: true,
    deliveryEnabled: false,
    reservationDepositMinor: 0,
    sortOrder: 4,
    tableSeats: [2, 2, 4, 8],
    menu: [
      {
        name: 'Signature',
        nameBn: 'বিশেষ',
        items: [
          { name: 'Shutki Mix Platter', nameBn: 'শুটকি মিক্স', priceMinor: 42000 },
          { name: 'Coral Fish Curry', nameBn: 'কোরাল মাছের ঝোল', priceMinor: 60000 },
          { name: 'Lobster Thermidor (indicative)', nameBn: 'লবস্টার', priceMinor: 180000 },
        ],
      },
    ],
  },
];

export async function seedDining(
  prisma: PrismaClient,
  beachPointIds: Map<string, string>,
): Promise<void> {
  for (const venue of VENUES) {
    const beachPointId = venue.beachPointCode ? beachPointIds.get(venue.beachPointCode) : undefined;
    if (venue.beachPointCode && !beachPointId) {
      throw new Error(`Seed beach point not found: ${venue.beachPointCode}`);
    }

    const data = {
      name: venue.name,
      nameBn: venue.nameBn,
      kind: venue.kind,
      description: venue.description,
      address: venue.address ?? null,
      contactPhone: venue.contactPhone ?? null,
      cuisineTags: venue.cuisineTags,
      beachPointId: beachPointId ?? null,
      openHour: venue.openHour,
      closeHour: venue.closeHour,
      reservationsEnabled: venue.reservationsEnabled,
      deliveryEnabled: venue.deliveryEnabled,
      reservationDepositMinor: venue.reservationDepositMinor,
      sortOrder: venue.sortOrder,
      isActive: true,
    };
    const record = await prisma.diningVenue.upsert({
      where: { code: venue.code },
      update: data,
      create: { code: venue.code, ...data },
    });

    for (const [categoryIndex, category] of venue.menu.entries()) {
      const categoryRecord = await prisma.menuCategory.upsert({
        where: { venueId_name: { venueId: record.id, name: category.name } },
        update: { nameBn: category.nameBn ?? null, sortOrder: categoryIndex },
        create: {
          venueId: record.id,
          name: category.name,
          nameBn: category.nameBn ?? null,
          sortOrder: categoryIndex,
        },
      });

      for (const [itemIndex, item] of category.items.entries()) {
        const itemData = {
          nameBn: item.nameBn ?? null,
          description: item.description ?? null,
          priceMinor: item.priceMinor,
          isAvailable: item.isAvailable ?? true,
          sortOrder: itemIndex,
        };
        const existing = await prisma.menuItem.findFirst({
          where: { categoryId: categoryRecord.id, name: item.name },
          select: { id: true },
        });
        if (existing) {
          await prisma.menuItem.update({ where: { id: existing.id }, data: itemData });
        } else {
          await prisma.menuItem.create({
            data: {
              venueId: record.id,
              categoryId: categoryRecord.id,
              name: item.name,
              ...itemData,
            },
          });
        }
      }
    }

    for (const [index, seats] of venue.tableSeats.entries()) {
      const code = `${venue.code}-T${String(index + 1).padStart(2, '0')}`;
      await prisma.diningTable.upsert({
        where: { code },
        update: { venueId: record.id, seats },
        create: { venueId: record.id, code, seats },
      });
    }
  }
}
