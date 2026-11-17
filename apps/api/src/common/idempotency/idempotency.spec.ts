import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../../modules/catalogue/testing/test-bootstrap';
import type {
  FoodOrderDto,
  HotelDetailDto,
  OrderDto,
  ReservationDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../prisma/prisma.service';
import {
  TEST_BEDS,
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../testing/integration-fixture';
import { dhakaDateKey, dhakaHourToUtc } from '../time/dhaka';
import { reseedTestDatabase } from '../../modules/catalogue/testing/test-database';
import {
  FOOD_IDS,
  createSunbedBooking,
  seedDeliveryVenues,
} from '../../modules/dining/delivery/testing/delivery-fixture';
import {
  RES_TABLES,
  dhakaAt,
  seedReservationVenues,
} from '../../modules/dining/reservations/testing/reservation-fixtures';

const describeDb = testDbReady() ? describe : describe.skip;
const API = '/api/v1';
const TIMEOUT = 30_000;

function day(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

describeDb('Idempotency-Key', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());

  const orderBody = (sunbedId: string = TEST_BEDS.kol001) => ({
    items: [{ sunbedId, startsAt: dhakaHourToUtc(day(1), 10).toISOString(), hours: 2 }],
    paymentMethod: 'BKASH',
  });

  const postOrder = (key: string | null, body: object, user: string = TEST_USERS.tourist) => {
    const req = http().post(`${API}/orders`).set(auth(user));
    if (key !== null) req.set('Idempotency-Key', key);
    return req.send(body);
  };

  describe('POST /orders', () => {
    it('same key and body returns the first response without a second booking or charge', async () => {
      const key = 'order-retry-0001';
      const first = await postOrder(key, orderBody()).expect(201);
      expect(first.headers['idempotent-replayed']).toBeUndefined();

      const second = await postOrder(key, orderBody()).expect(201);
      expect(second.headers['idempotent-replayed']).toBe('true');
      expect(second.body).toEqual(first.body);

      expect(await prisma.order.count()).toBe(1);
      expect(await prisma.payment.count()).toBe(1);
      expect(await prisma.bookingSlot.count()).toBe(2);
      expect((first.body.data as OrderDto).publicRef).toBeTruthy();
    });

    it('treats a reordered but equal body as the same request', async () => {
      const key = 'order-retry-0002';
      const body = orderBody();
      await postOrder(key, body).expect(201);
      const reordered = { paymentMethod: body.paymentMethod, items: body.items };
      const replay = await postOrder(key, reordered).expect(201);
      expect(replay.headers['idempotent-replayed']).toBe('true');
      expect(await prisma.order.count()).toBe(1);
    });

    it('same key with a different body returns 409 and creates nothing more', async () => {
      const key = 'order-retry-0003';
      await postOrder(key, orderBody(TEST_BEDS.kol001)).expect(201);

      const res = await postOrder(key, orderBody(TEST_BEDS.kol002)).expect(409);
      expect(res.body.error).toMatchObject({
        code: 'CONFLICT',
        message: 'This Idempotency-Key was already used with a different request.',
        details: { reason: 'IDEMPOTENCY_KEY_REUSED' },
      });
      expect(await prisma.order.count()).toBe(1);
      expect(await prisma.payment.count()).toBe(1);
    });

    it('concurrent duplicates create exactly one booking and one charge', async () => {
      const key = 'order-race-00000001';
      const responses = await Promise.all(
        Array.from({ length: 6 }, () => postOrder(key, orderBody())),
      );
      const statuses = responses.map((r) => r.status);
      expect(statuses.every((s) => s === 201 || s === 409)).toBe(true);

      const created = responses.filter((r) => r.status === 201);
      expect(created.length).toBeGreaterThanOrEqual(1);
      const refs = new Set(created.map((r) => (r.body.data as OrderDto).publicRef));
      expect(refs.size).toBe(1);
      for (const r of responses.filter((x) => x.status === 409)) {
        expect(r.body.error.details.reason).toBe('IDEMPOTENCY_KEY_IN_PROGRESS');
      }

      expect(await prisma.order.count()).toBe(1);
      expect(await prisma.payment.count()).toBe(1);
      expect(await prisma.idempotencyKey.count()).toBe(1);
    });

    it('scopes keys to the caller', async () => {
      const key = 'shared-key-0001';
      await postOrder(key, orderBody(TEST_BEDS.kol001), TEST_USERS.tourist).expect(201);
      const other = await postOrder(
        key,
        orderBody(TEST_BEDS.kol002),
        TEST_USERS.otherTourist,
      ).expect(201);
      expect(other.headers['idempotent-replayed']).toBeUndefined();
      expect(await prisma.order.count()).toBe(2);
    });

    it('replays a deterministic domain error, and keeps working without a key', async () => {
      const key = 'order-past-00001';
      const past = {
        items: [
          {
            sunbedId: TEST_BEDS.kol001,
            startsAt: dhakaHourToUtc(day(-1), 10).toISOString(),
            hours: 1,
          },
        ],
      };
      const first = await postOrder(key, past).expect(422);
      const replay = await postOrder(key, past).expect(422);
      expect(replay.headers['idempotent-replayed']).toBe('true');
      expect(replay.body.error.code).toBe(first.body.error.code);
      expect(replay.body.error.message).toBe(first.body.error.message);

      await postOrder(null, orderBody()).expect(201);
      expect(await prisma.idempotencyKey.count()).toBe(1);
    });

    it.each([
      ['too short', 'abc1234'],
      ['too long', 'k'.repeat(129)],
      ['a space', 'has space-1234'],
      ['a symbol', 'key*12345678'],
    ])('rejects a key with %s with 400 before doing anything', async (_label, key) => {
      const res = await postOrder(key, orderBody()).expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(await prisma.order.count()).toBe(0);
      expect(await prisma.idempotencyKey.count()).toBe(0);
    });

    it('accepts 8 and 128 character keys', async () => {
      await postOrder('a_b-C9d8', orderBody(TEST_BEDS.kol001)).expect(201);
      await postOrder('Z'.repeat(128), orderBody(TEST_BEDS.kol002)).expect(201);
    });
  });

  it('POST /hotels/bookings replays the first booking', async () => {
    const hotel = (await http().get(`${API}/hotels/sayeman-beach-resort`).expect(200)).body
      .data as HotelDetailDto;
    const body = {
      hotelId: hotel.id,
      roomTypeId: hotel.roomTypes[0].id,
      checkInDate: day(3),
      checkOutDate: day(5),
      guestsCount: 2,
      paymentMethod: 'CARD',
    };
    const send = () =>
      http()
        .post(`${API}/hotels/bookings`)
        .set(auth(TEST_USERS.tourist))
        .set('Idempotency-Key', 'hotel-retry-0001')
        .send(body);
    const first = (await send().expect(201)).body.data as OrderDto;
    const second = await send().expect(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect((second.body.data as OrderDto).publicRef).toBe(first.publicRef);
    expect(await prisma.hotelBooking.count()).toBe(1);
    expect(await prisma.payment.count()).toBe(1);
  });

  it('POST /dining/reservations replays the first reservation', async () => {
    await seedReservationVenues(prisma);
    const send = () =>
      http()
        .post(`${API}/dining/reservations`)
        .set(auth(TEST_USERS.tourist))
        .set('Idempotency-Key', 'table-retry-0001')
        .send({
          tableId: RES_TABLES.mainT1.id,
          startsAt: dhakaAt(2, 12),
          hours: 2,
          partySize: 3,
          paymentMethod: 'NAGAD',
        });
    const first = (await send().expect(201)).body.data as ReservationDto;
    const second = await send().expect(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect((second.body.data as ReservationDto).publicRef).toBe(first.publicRef);
    expect(await prisma.tableReservation.count()).toBe(1);
    expect(await prisma.payment.count()).toBe(1);
  });

  it('POST /dining/food-orders replays the first food order', async () => {
    await seedDeliveryVenues(prisma);
    const bed = await createSunbedBooking(prisma, { touristId: TEST_USERS.tourist });
    const send = () =>
      http()
        .post(`${API}/dining/food-orders`)
        .set(auth(TEST_USERS.tourist))
        .set('Idempotency-Key', 'food-retry-0001')
        .send({
          orderItemId: bed.orderItemId,
          venueId: FOOD_IDS.kolVenue,
          lines: [{ menuItemId: FOOD_IDS.kolTea, quantity: 2 }],
          paymentMethod: 'BKASH',
        });
    const first = (await send().expect(201)).body.data as FoodOrderDto;
    const second = await send().expect(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect((second.body.data as FoodOrderDto).publicRef).toBe(first.publicRef);
    expect(await prisma.foodOrder.count()).toBe(1);
    expect(await prisma.payment.count({ where: { foodOrderId: { not: null } } })).toBe(1);
  });
});
