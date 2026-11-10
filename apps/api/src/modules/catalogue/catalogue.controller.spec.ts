import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// Must load before the fixture pulls in AppModule; see the module comment.
import './testing/test-bootstrap';
import type { BeachPointDetail, BeachPointSummary } from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_BEDS,
  TEST_POINTS,
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { reseedTestDatabase } from './testing/test-database';
import { HOUR_MS, dhakaDateKey, dhakaHourToUtc } from '../../common/time/dhaka';

const describeDb = testDbReady() ? describe : describe.skip;
const TEST_TIMEOUT = 30_000;
const API = '/api/v1';

/** Dhaka date key `offset` days from today. */
function dayKey(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

interface OccupyOptions {
  publicRef: string;
  touristId: string;
  sunbedId: string;
  sunbedCode: string;
  startAt: Date;
  hours?: number;
  pointCode?: string;
  pointName?: string;
  itemStatus?: 'RESERVED' | 'CHECKED_IN' | 'CANCELLED';
  slotsActive?: boolean;
}

/** Writes an order/item/slot directly; orders API is owned by another slice. */
async function occupy(prisma: PrismaService, options: OccupyOptions): Promise<void> {
  const hours = options.hours ?? 1;
  const totalMinor = 10_000 * hours;
  const order = await prisma.order.create({
    data: {
      publicRef: options.publicRef,
      touristId: options.touristId,
      subtotalMinor: totalMinor,
      totalMinor,
    },
  });
  const item = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      sunbedId: options.sunbedId,
      beachPointCode: options.pointCode ?? 'KOL',
      beachPointName: options.pointName ?? 'Kolatoli',
      sunbedCode: options.sunbedCode,
      startAt: options.startAt,
      endAt: new Date(options.startAt.getTime() + hours * HOUR_MS),
      unitPriceMinor: 10_000,
      totalMinor,
      status: options.itemStatus ?? 'RESERVED',
    },
  });

  for (let index = 0; index < hours; index += 1) {
    await prisma.bookingSlot.create({
      data: {
        orderItemId: item.id,
        sunbedId: options.sunbedId,
        slotStart: new Date(options.startAt.getTime() + index * HOUR_MS),
        isActive: options.slotsActive ?? true,
      },
    });
  }
}

describeDb(
  'public catalogue API',
  () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
      app = await createTestApp();
      prisma = app.get(PrismaService);
    }, TEST_TIMEOUT);

    beforeEach(async () => {
      await reseedTestDatabase(prisma);
    }, TEST_TIMEOUT);

    afterAll(async () => {
      await app?.close();
    }, TEST_TIMEOUT);

    it(
      'summarises active points for a future day using each opening hour',
      async () => {
        const tomorrow = dayKey(1);

        const response = await request(app.getHttpServer())
          .get(`${API}/beach-points`)
          .query({ date: tomorrow })
          .expect(200);

        const points = response.body.data as BeachPointSummary[];
        expect(points.map((point) => point.code)).toEqual(['KOL', 'SUG']);

        const kolatoli = points[0];
        expect(kolatoli).toMatchObject({
          id: TEST_POINTS.kolatoli,
          totalBeds: 4,
          freeBeds: 3, // 4 beds minus 1 OUT_OF_SERVICE bed
          referenceSlotLabel: '08:00',
        });

        const sugandha = points[1];
        expect(sugandha).toMatchObject({
          id: TEST_POINTS.sugandha,
          totalBeds: 2,
          freeBeds: 2,
          referenceSlotLabel: '09:00',
        });
      },
      TEST_TIMEOUT,
    );

    it(
      'returns a point detail with full hourly grid and bed availability',
      async () => {
        const tomorrow = dayKey(1);
        const start = dhakaHourToUtc(tomorrow, 8);

        await occupy(prisma, {
          publicRef: 'SPEC-001',
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol001,
          sunbedCode: 'KOL-001',
          startAt: start,
          hours: 2,
        });

        const response = await request(app.getHttpServer())
          .get(`${API}/beach-points/KOL`)
          .set(auth(TEST_USERS.tourist))
          .query({ date: tomorrow })
          .expect(200);

        const detail = response.body.data as BeachPointDetail;
        expect(detail.date).toBe(tomorrow);
        expect(detail.totalBeds).toBe(4);
        expect(detail.slots).toHaveLength(10);
        expect(detail.slots[0]).toEqual({
          startsAt: dhakaHourToUtc(tomorrow, 8).toISOString(),
          hour: 8,
          label: '08:00',
        });
        expect(detail.slots.at(-1)).toMatchObject({ hour: 17, label: '17:00' });

        expect(detail.sunbeds.map((bed) => bed.code)).toEqual([
          'KOL-001',
          'KOL-002',
          'KOL-003',
          'KOL-004',
        ]);

        const first = detail.sunbeds[0];
        expect(first.bookedSlots).toEqual([
          start.toISOString(),
          new Date(start.getTime() + HOUR_MS).toISOString(),
        ]);
        expect(first.mineSlots).toEqual(first.bookedSlots);
        expect(first.freeSlots).toBe(8);

        const spare = detail.sunbeds[1];
        expect(spare.bookedSlots).toEqual([]);
        expect(spare.mineSlots).toEqual([]);
        expect(spare.freeSlots).toBe(10);

        const outOfService = detail.sunbeds.find((bed) => bed.code === 'KOL-004');
        expect(outOfService).toMatchObject({
          status: 'OUT_OF_SERVICE',
          freeSlots: 0,
          bookedSlots: [],
        });
      },
      TEST_TIMEOUT,
    );

    it(
      "does not report another tourist's slots as mine",
      async () => {
        const tomorrow = dayKey(1);

        await occupy(prisma, {
          publicRef: 'SPEC-003',
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol001,
          sunbedCode: 'KOL-001',
          startAt: dhakaHourToUtc(tomorrow, 9),
        });

        const response = await request(app.getHttpServer())
          .get(`${API}/beach-points/KOL`)
          .set(auth(TEST_USERS.otherTourist))
          .query({ date: tomorrow })
          .expect(200);

        const detail = response.body.data as BeachPointDetail;
        expect(detail.sunbeds[0].bookedSlots).toHaveLength(1);
        expect(detail.sunbeds[0].mineSlots).toEqual([]);
      },
      TEST_TIMEOUT,
    );

    it(
      'ignores cancelled items and inactive slot rows when counting occupancy',
      async () => {
        const tomorrow = dayKey(1);

        await occupy(prisma, {
          publicRef: 'SPEC-004',
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol002,
          sunbedCode: 'KOL-002',
          startAt: dhakaHourToUtc(tomorrow, 10),
          itemStatus: 'CANCELLED',
        });
        await occupy(prisma, {
          publicRef: 'SPEC-005',
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol003,
          sunbedCode: 'KOL-003',
          startAt: dhakaHourToUtc(tomorrow, 10),
          slotsActive: false,
        });

        const response = await request(app.getHttpServer())
          .get(`${API}/beach-points/KOL`)
          .set(auth(TEST_USERS.tourist))
          .query({ date: tomorrow })
          .expect(200);

        const detail = response.body.data as BeachPointDetail;
        for (const code of ['KOL-001', 'KOL-002', 'KOL-003']) {
          const bed = detail.sunbeds.find((row) => row.code === code);
          expect(bed?.bookedSlots).toEqual([]);
          expect(bed?.mineSlots).toEqual([]);
          expect(bed?.freeSlots).toBe(10);
        }
      },
      TEST_TIMEOUT,
    );

    it(
      'returns 404 for unknown and inactive points',
      async () => {
        await request(app.getHttpServer()).get(`${API}/beach-points/ZZZ`).expect(404);

        await prisma.beachPoint.update({
          where: { id: TEST_POINTS.sugandha },
          data: { isActive: false },
        });

        await request(app.getHttpServer()).get(`${API}/beach-points/SUG`).expect(404);

        const list = await request(app.getHttpServer()).get(`${API}/beach-points`).expect(200);
        expect((list.body.data as BeachPointSummary[]).map((point) => point.code)).toEqual(['KOL']);
      },
      TEST_TIMEOUT,
    );

    it(
      'rejects impossible and out-of-range dates with 400',
      async () => {
        const invalid = ['2026-02-30', '21-10-2026', dayKey(8), dayKey(-1)];

        for (const date of invalid) {
          const response = await request(app.getHttpServer())
            .get(`${API}/beach-points`)
            .query({ date })
            .expect(400);
          expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }

        await request(app.getHttpServer())
          .get(`${API}/beach-points/KOL`)
          .query({ date: 'not-a-date' })
          .expect(400);

        // The last allowed day is today + MAX_ADVANCE_DAYS.
        await request(app.getHttpServer())
          .get(`${API}/beach-points`)
          .query({ date: dayKey(7) })
          .expect(200);
      },
      TEST_TIMEOUT,
    );
  },
  TEST_TIMEOUT,
);
