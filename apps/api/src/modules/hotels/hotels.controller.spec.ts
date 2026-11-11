import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type { HotelDetailDto, HotelSummaryDto, OrderDto } from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { dhakaDateKey } from '../../common/time/dhaka';
import { reseedTestDatabase } from '../catalogue/testing/test-database';

const describeDb = testDbReady() ? describe : describe.skip;
const TEST_TIMEOUT = 30_000;
const API = '/api/v1';

function dayKey(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

describeDb('hotels API', () => {
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

  it('lists verified Cox’s Bazar hotels with zone filters', async () => {
    const res = await request(app.getHttpServer())
      .get(`${API}/hotels`)
      .expect(200);

    const hotels = res.body.data as HotelSummaryDto[];
    expect(hotels.length).toBeGreaterThanOrEqual(10);
    const sayeman = hotels.find((h) => h.slug === 'sayeman-beach-resort');
    expect(sayeman).toBeDefined();
    expect(sayeman?.zone).toBe('KOLATOLI');
    expect(sayeman?.starRating).toBe(5);
  });

  it('fetches hotel details by slug with room types and amenities', async () => {
    const res = await request(app.getHttpServer())
      .get(`${API}/hotels/sayeman-beach-resort`)
      .expect(200);

    const hotel = res.body.data as HotelDetailDto;
    expect(hotel.slug).toBe('sayeman-beach-resort');
    expect(hotel.roomTypes.length).toBeGreaterThan(0);
    expect(hotel.amenities).toContain('Beachfront Infinity Pool');

    const deluxe = hotel.roomTypes.find((r) => r.code === 'SAY-DLX-SEA');
    expect(deluxe).toBeDefined();
    expect(deluxe?.sampleRoomNumber).toBeDefined();
  });

  it('allows a tourist to book a room and assigns an authentic room number', async () => {
    const checkInDate = dayKey(3);
    const checkOutDate = dayKey(5);

    const hotelRes = await request(app.getHttpServer())
      .get(`${API}/hotels/sayeman-beach-resort`)
      .expect(200);

    const hotel = hotelRes.body.data as HotelDetailDto;
    const roomType = hotel.roomTypes[0];

    const bookingRes = await request(app.getHttpServer())
      .post(`${API}/hotels/bookings`)
      .set(auth(TEST_USERS.tourist))
      .send({
        hotelId: hotel.id,
        roomTypeId: roomType.id,
        checkInDate,
        checkOutDate,
        guestsCount: 2,
      })
      .expect(201);

    const order = bookingRes.body.data as OrderDto;
    expect(order.publicRef).toMatch(/^HTL-/);
    expect(order.status).toBe('CONFIRMED');
    expect(order.hotelBookings).toBeDefined();
    expect(order.hotelBookings?.length).toBe(1);

    const stay = order.hotelBookings![0];
    expect(stay.hotelName).toBe('Sayeman Beach Resort');
    expect(stay.nights).toBe(2);
    expect(stay.roomNumber).toBeDefined();
    expect(order.ticket).toBeDefined();
  });
});
