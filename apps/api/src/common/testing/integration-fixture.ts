import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { configureApplication } from '../../app.setup';
import { PrismaService } from '../prisma/prisma.service';

export const TEST_USERS = {
  admin: '00000000-0000-4000-8000-000000000001',
  tourist: '00000000-0000-4000-8000-000000000002',
  otherTourist: '00000000-0000-4000-8000-000000000003',
} as const;

export const TEST_POINTS = {
  kolatoli: '10000000-0000-4000-8000-000000000001',
  sugandha: '10000000-0000-4000-8000-000000000002',
} as const;

export const TEST_BEDS = {
  kol001: '20000000-0000-4000-8000-000000000001',
  kol002: '20000000-0000-4000-8000-000000000002',
  kol003: '20000000-0000-4000-8000-000000000003',
  kol004: '20000000-0000-4000-8000-000000000004',
  sug001: '20000000-0000-4000-8000-000000000005',
  sug002: '20000000-0000-4000-8000-000000000006',
} as const;

export function testDbReady(): boolean {
  return process.env.COASTLINE_TEST_DB_READY === '1';
}

export function auth(userId: string): Record<string, string> {
  return { 'x-demo-user-id': userId };
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApplication(app);
  await app.init();
  return app;
}

export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "audit_events", "payments", "food_order_items", "food_orders",
      "table_slots", "table_reservations", "dining_tables", "menu_items",
      "menu_categories", "dining_venues", "booking_slots", "hotel_room_nights",
      "order_items", "hotel_bookings", "hotel_rooms", "room_types", "hotels",
      "orders", "sunbeds", "beach_points", "users" RESTART IDENTITY CASCADE`,
  );
}

/** Minimal deterministic catalogue used by API specs. */
export async function seedTestCatalogue(prisma: PrismaService): Promise<void> {
  await resetDatabase(prisma);

  await prisma.user.createMany({
    data: [
      { id: TEST_USERS.admin, name: 'Test Admin', email: 'admin@test.example', role: 'ADMIN' },
      {
        id: TEST_USERS.tourist,
        name: 'Test Tourist',
        email: 'tourist@test.example',
        role: 'TOURIST',
      },
      {
        id: TEST_USERS.otherTourist,
        name: 'Other Tourist',
        email: 'other@test.example',
        role: 'TOURIST',
      },
    ],
  });

  await prisma.beachPoint.createMany({
    data: [
      {
        id: TEST_POINTS.kolatoli,
        code: 'KOL',
        name: 'Kolatoli',
        latitude: 21.4150,
        longitude: 91.9835,
        openHour: 8,
        closeHour: 18,
        defaultHourlyPriceMinor: 10000,
        sortOrder: 1,
      },
      {
        id: TEST_POINTS.sugandha,
        code: 'SUG',
        name: 'Sugandha',
        latitude: 21.4212,
        longitude: 91.9775,
        openHour: 9,
        closeHour: 17,
        defaultHourlyPriceMinor: 12000,
        sortOrder: 2,
      },
    ],
  });

  await prisma.sunbed.createMany({
    data: [
      {
        id: TEST_BEDS.kol001,
        beachPointId: TEST_POINTS.kolatoli,
        seq: 1,
        code: 'KOL-001',
        hourlyPriceMinor: 10000,
      },
      {
        id: TEST_BEDS.kol002,
        beachPointId: TEST_POINTS.kolatoli,
        seq: 2,
        code: 'KOL-002',
        hourlyPriceMinor: 10000,
      },
      {
        id: TEST_BEDS.kol003,
        beachPointId: TEST_POINTS.kolatoli,
        seq: 3,
        code: 'KOL-003',
        hourlyPriceMinor: 12000,
      },
      {
        id: TEST_BEDS.kol004,
        beachPointId: TEST_POINTS.kolatoli,
        seq: 4,
        code: 'KOL-004',
        hourlyPriceMinor: 10000,
        status: 'OUT_OF_SERVICE',
      },
      {
        id: TEST_BEDS.sug001,
        beachPointId: TEST_POINTS.sugandha,
        seq: 1,
        code: 'SUG-001',
        hourlyPriceMinor: 12000,
      },
      {
        id: TEST_BEDS.sug002,
        beachPointId: TEST_POINTS.sugandha,
        seq: 2,
        code: 'SUG-002',
        hourlyPriceMinor: 12000,
      },
    ],
  });

  const hotel = await prisma.hotel.create({
    data: {
      slug: 'sayeman-beach-resort',
      name: 'Sayeman Beach Resort',
      banglaName: 'সায়মন বিচ রিসোর্ট',
      zone: 'KOLATOLI',
      address: 'Marine Drive Road, Kolatoli Beach, Cox’s Bazar',
      latitude: 21.4143,
      longitude: 91.9843,
      starRating: 5,
      featuredImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      galleryImages: ['https://images.unsplash.com/photo-1582719508461-905c673771fd'],
      description: 'Iconic heritage luxury property situated directly on Kolatoli beachfront.',
      phone: '+880 1755-691917',
      email: 'reservation@sayemanresort.com',
      amenities: ['Beachfront Infinity Pool', '100% Generator Backup'],
      nearestBeachCode: 'KOL',
      distanceMeters: 50,
      isFeatured: true,
    },
  });

  const rt = await prisma.roomType.create({
    data: {
      hotelId: hotel.id,
      code: 'SAY-DLX-SEA',
      name: 'Deluxe Sea View Room',
      description: 'Spacious king-bed bedroom with balcony.',
      maxGuests: 2,
      bedConfig: '1 King Bed',
      basePriceMinor: 1250000,
      amenities: ['Sea View Balcony', 'King Bed'],
      images: [],
      sortOrder: 0,
    },
  });

  await prisma.hotelRoom.createMany({
    data: [
      { hotelId: hotel.id, roomTypeId: rt.id, roomNumber: '301', status: 'AVAILABLE' },
      { hotelId: hotel.id, roomTypeId: rt.id, roomNumber: '302', status: 'AVAILABLE' },
    ],
  });

  for (let i = 2; i <= 10; i++) {
    await prisma.hotel.create({
      data: {
        slug: `hotel-demo-${i}`,
        name: `Hotel Demo ${i}`,
        zone: 'SUGANDHA',
        address: 'Hotel-Motel Zone',
        latitude: 21.425,
        longitude: 91.977,
        starRating: 4,
        featuredImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        description: 'Demo coastal stay.',
        phone: '+880 1700-000000',
        nearestBeachCode: 'SUG',
        distanceMeters: 200,
      },
    });
  }
}
