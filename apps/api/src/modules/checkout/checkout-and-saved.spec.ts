import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type { CheckoutQuoteDto, OrderDto, SavedItemDto } from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_BEDS,
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { reseedTestDatabase } from '../catalogue/testing/test-database';
import { dhakaDateKey, dhakaHourToUtc } from '../../common/time/dhaka';

const describeDb = testDbReady() ? describe : describe.skip;
const TIMEOUT = 30_000;
const API = '/api/v1';

function dayKey(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

describeDb('checkout quote and saved items', () => {
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

  it('quotes sunbeds from database prices and matches what the booking charges', async () => {
    const server = app.getHttpServer();
    const startsAt = dhakaHourToUtc(dayKey(1), 10).toISOString();
    const body = {
      items: [
        { sunbedId: TEST_BEDS.kol001, startsAt, hours: 2 },
        { sunbedId: TEST_BEDS.kol003, startsAt, hours: 2 },
      ],
    };
    const quote = (
      await request(server)
        .post(`${API}/checkout/quote`)
        .set(auth(TEST_USERS.tourist))
        .send({ kind: 'sunbed', request: body })
        .expect(200)
    ).body.data as CheckoutQuoteDto;

    expect(quote.totalMinor).toBe(2 * 10000 + 2 * 12000);
    expect(quote.lines.map((line) => line.label)).toEqual(['Sunbed KOL-001', 'Sunbed KOL-003']);

    const order = (
      await request(server)
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send(body)
        .expect(201)
    ).body.data as OrderDto;
    expect(order.totalMinor).toBe(quote.totalMinor);
  });

  it('quotes a stay as nights times the room price', async () => {
    const hotel = await prisma.hotel.findUniqueOrThrow({
      where: { slug: 'sayeman-beach-resort' },
      include: { roomTypes: true },
    });
    const quote = (
      await request(app.getHttpServer())
        .post(`${API}/checkout/quote`)
        .set(auth(TEST_USERS.tourist))
        .send({
          kind: 'stay',
          request: {
            hotelId: hotel.id,
            roomTypeId: hotel.roomTypes[0].id,
            checkInDate: dayKey(2),
            checkOutDate: dayKey(5),
            guestsCount: 2,
          },
        })
        .expect(200)
    ).body.data as CheckoutQuoteDto;
    expect(quote.totalMinor).toBe(3 * 1250000);
  });

  it('refuses out-of-service beds, unknown fields and non-tourists', async () => {
    const server = app.getHttpServer();
    const startsAt = dhakaHourToUtc(dayKey(1), 10).toISOString();
    await request(server)
      .post(`${API}/checkout/quote`)
      .set(auth(TEST_USERS.tourist))
      .send({
        kind: 'sunbed',
        request: { items: [{ sunbedId: TEST_BEDS.kol004, startsAt, hours: 1 }] },
      })
      .expect(422);
    await request(server)
      .post(`${API}/checkout/quote`)
      .set(auth(TEST_USERS.tourist))
      .send({
        kind: 'sunbed',
        request: { items: [{ sunbedId: TEST_BEDS.kol001, startsAt, hours: 1 }], totalMinor: 1 },
      })
      .expect(400);
    await request(server)
      .post(`${API}/checkout/quote`)
      .set(auth(TEST_USERS.admin))
      .send({ kind: 'sunbed', request: { items: [] } })
      .expect(403);
  });

  it('saves, lists and removes items per visitor', async () => {
    const server = app.getHttpServer();
    const tourist = auth(TEST_USERS.tourist);
    await request(server)
      .post(`${API}/saved`)
      .set(tourist)
      .send({ type: 'HOTEL', key: 'sayeman-beach-resort' })
      .expect(201);
    await request(server)
      .post(`${API}/saved`)
      .set(tourist)
      .send({ type: 'SPOT', key: 'coxs-bazar/kolatoli' })
      .expect(201);
    await request(server)
      .post(`${API}/saved`)
      .set(tourist)
      .send({ type: 'HOTEL', key: 'no-such-hotel' })
      .expect(404);

    const mine = (await request(server).get(`${API}/saved`).set(tourist).expect(200)).body
      .data as SavedItemDto[];
    const theirs = (
      await request(server).get(`${API}/saved`).set(auth(TEST_USERS.otherTourist)).expect(200)
    ).body.data as SavedItemDto[];
    expect(mine.map((item) => item.href).sort()).toEqual([
      '/d/coxs-bazar/s/kolatoli',
      '/l/hotel-sayeman-beach-resort',
    ]);
    expect(theirs).toEqual([]);

    await request(server)
      .delete(`${API}/saved?type=HOTEL&key=sayeman-beach-resort`)
      .set(tourist)
      .expect(204);
    await prisma.spot.updateMany({ where: { slug: 'kolatoli' }, data: { isActive: false } });
    const after = (await request(server).get(`${API}/saved`).set(tourist).expect(200)).body
      .data as SavedItemDto[];
    expect(after).toEqual([]);
  });
});
