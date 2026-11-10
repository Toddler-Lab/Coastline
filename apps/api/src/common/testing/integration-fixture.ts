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
    `TRUNCATE TABLE "audit_events", "payments", "booking_slots", "order_items",
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
}
