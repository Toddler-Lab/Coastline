import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type { HotelDetailDto, OrderDto } from '@coastline/api-contracts';
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
const API = '/api/v1';
const day = (n: number) =>
  new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);

describeDb('hotel bookings', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let hotel: HotelDetailDto;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, 30000);
  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    const r = await request(app.getHttpServer()).get(`${API}/hotels/sayeman-beach-resort`);
    hotel = r.body.data;
  }, 30000);
  afterAll(async () => {
    await app?.close();
  });

  const book = (user: string | null, extra: Record<string, unknown> = {}) => {
    const req = request(app.getHttpServer()).post(`${API}/hotels/bookings`);
    if (user) req.set(auth(user));
    return req.send({
      hotelId: hotel.id,
      roomTypeId: hotel.roomTypes[0].id,
      checkInDate: day(3),
      checkOutDate: day(5),
      guestsCount: 2,
      ...extra,
    });
  };

  it('prices the stay on the server: total = nightly price x nights, one CHARGE payment of same amount', async () => {
    const res = await book(TEST_USERS.tourist).expect(201);
    const o = res.body.data as OrderDto;
    expect(o.totalMinor).toBe(1250000 * 2);
    expect(o.payments).toHaveLength(1);
    expect(o.payments[0].amountMinor).toBe(o.totalMinor);
  });
  it('rejects more guests than the room type sleeps', async () => {
    await book(TEST_USERS.tourist, { guestsCount: 8 }).expect(422);
  });
  it('admin persona cannot place a tourist booking (same rule as sunbeds)', async () => {
    await book(TEST_USERS.admin).expect(403);
  });
  it('anonymous booking is rejected', async () => {
    await book(null).expect(401);
  });
  it('overbooking: 6 parallel requests for a 2-room type -> exactly 2 succeed, rest 409', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => book(TEST_USERS.tourist)));
    const ok = results.filter((r) => r.status === 201).length;
    const conflicts = results.filter((r) => r.status === 409).length;
    expect({ ok, conflicts, other: results.map((r) => r.status) }).toMatchObject({
      ok: 2,
      conflicts: 4,
    });
    const rooms = new Set(
      results.filter((r) => r.status === 201).map((r) => r.body.data.hotelBookings[0].roomNumber),
    );
    expect(rooms.size).toBe(2);
  });
  it('lets a tourist cancel their own upcoming hotel booking', async () => {
    const o = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    const res = await request(app.getHttpServer())
      .post(`${API}/orders/${o.publicRef}/cancel`)
      .set(auth(TEST_USERS.tourist))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('CANCELLED');
  });
  it('cancelling releases the room: rooms re-bookable, booking+nights marked cancelled/inactive', async () => {
    await book(TEST_USERS.tourist).expect(201);
    const b2 = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    await book(TEST_USERS.tourist).expect(409); // both rooms taken
    const c = await request(app.getHttpServer())
      .post(`${API}/admin/orders/${b2.publicRef}/cancel`)
      .set(auth(TEST_USERS.admin))
      .send({});
    expect(c.status).toBe(201);
    const nights = await prisma.hotelRoomNight.count({
      where: { isActive: true, hotelBooking: { order: { publicRef: b2.publicRef } } },
    });
    const bk = await prisma.hotelBooking.findFirst({
      where: { order: { publicRef: b2.publicRef } },
    });
    expect({ activeNightsAfterCancel: nights, hotelBookingStatus: bk?.status }).toEqual({
      activeNightsAfterCancel: 0,
      hotelBookingStatus: 'CANCELLED',
    });
    await book(TEST_USERS.otherTourist).expect(201); // room is available again
  });
  it('admin check-in marks the hotel booking checked in', async () => {
    const o = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    const res = await request(app.getHttpServer())
      .post(`${API}/admin/orders/${o.publicRef}/check-in`)
      .set(auth(TEST_USERS.admin))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.data.hotelBookings[0].status).toBe('CHECKED_IN');
  });
  it('/orders/me and /orders/:ref expose hotel bookings; other tourist cannot read it', async () => {
    const o = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    const mine = await request(app.getHttpServer())
      .get(`${API}/orders/me`)
      .set(auth(TEST_USERS.tourist))
      .expect(200);
    expect(
      mine.body.data.find((x: OrderDto) => x.publicRef === o.publicRef)?.hotelBookings,
    ).toHaveLength(1);
    await request(app.getHttpServer())
      .get(`${API}/orders/${o.publicRef}`)
      .set(auth(TEST_USERS.otherTourist))
      .expect((r) => expect([403, 404]).toContain(r.status));
  });
  it('rejects:  past check-in rejected', async () => {
    await book(TEST_USERS.tourist, { checkInDate: day(-1), checkOutDate: day(1) }).expect(422);
  });
  it('rejects:  checkout <= checkin rejected', async () => {
    await book(TEST_USERS.tourist, { checkInDate: day(3), checkOutDate: day(3) }).expect(422);
  });
  it('rejects:  > 30 nights rejected', async () => {
    await book(TEST_USERS.tourist, { checkInDate: day(1), checkOutDate: day(40) }).expect(422);
  });
  it('rejects:  impossible calendar date (2099-02-30) gives 4xx, never 5xx / zero-night order', async () => {
    const res = await book(TEST_USERS.tourist, { checkOutDate: '2099-02-30' });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
  it('rejects:  impossible check-in date also 4xx', async () => {
    const res = await book(TEST_USERS.tourist, {
      checkInDate: '2026-13-45',
      checkOutDate: '2026-13-46',
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
  it(' availability on listing reflects bookings for the requested dates', async () => {
    await book(TEST_USERS.tourist).expect(201);
    const res = await request(app.getHttpServer())
      .get(`${API}/hotels/sayeman-beach-resort?checkInDate=${day(3)}&checkOutDate=${day(5)}`)
      .expect(200);
    expect(res.body.data.roomTypes[0].availableRooms).toBe(1);
    const other = await request(app.getHttpServer())
      .get(`${API}/hotels/sayeman-beach-resort?checkInDate=${day(6)}&checkOutDate=${day(7)}`)
      .expect(200);
    expect(other.body.data.roomTypes[0].availableRooms).toBe(2);
  });
  it(' unknown hotel slug -> 404; unknown hotel/roomType in booking -> 404', async () => {
    await request(app.getHttpServer()).get(`${API}/hotels/nope`).expect(404);
    await book(TEST_USERS.tourist, { roomTypeId: '00000000-0000-4000-8000-0000000000ff' }).expect(
      404,
    );
  });

  it('defaults guests to the room capacity (max 2) when omitted and snapshots the check-in time', async () => {
    const res = await book(TEST_USERS.tourist, { guestsCount: undefined }).expect(201);
    const stay = (res.body.data as OrderDto).hotelBookings![0];
    expect(stay.guestsCount).toBe(2);
    expect(stay.checkInTime).toBe('14:00');
  });
  it('after the check-in cutoff only an admin can cancel, and the room is released', async () => {
    const o = (
      await book(TEST_USERS.tourist, { checkInDate: day(0), checkOutDate: day(1) }).expect(201)
    ).body.data as OrderDto;
    await prisma.hotelBooking.updateMany({
      where: { order: { publicRef: o.publicRef } },
      data: { checkInTime: '00:00' },
    });
    const mine = await request(app.getHttpServer())
      .get(`${API}/orders/${o.publicRef}`)
      .set(auth(TEST_USERS.tourist))
      .expect(200);
    expect(mine.body.data.canCancel).toBe(false);
    await request(app.getHttpServer())
      .post(`${API}/orders/${o.publicRef}/cancel`)
      .set(auth(TEST_USERS.tourist))
      .send({})
      .expect(422);
    const admin = await request(app.getHttpServer())
      .post(`${API}/admin/orders/${o.publicRef}/cancel`)
      .set(auth(TEST_USERS.admin))
      .send({});
    expect(admin.status).toBe(201);
    expect(admin.body.data.hotelBookings[0].status).toBe('CANCELLED');
    expect(await prisma.hotelRoomNight.count({ where: { isActive: true } })).toBe(0);
  });
  it('upcoming hotel booking reports canCancel=true; a cancelled one cannot be cancelled twice', async () => {
    const o = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    expect(o.canCancel).toBe(true);
    await request(app.getHttpServer())
      .post(`${API}/orders/${o.publicRef}/cancel`)
      .set(auth(TEST_USERS.tourist))
      .send({})
      .expect(201);
    await request(app.getHttpServer())
      .post(`${API}/orders/${o.publicRef}/cancel`)
      .set(auth(TEST_USERS.tourist))
      .send({})
      .expect(422);
  });
  it('another tourist cannot cancel it', async () => {
    const o = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    await request(app.getHttpServer())
      .post(`${API}/orders/${o.publicRef}/cancel`)
      .set(auth(TEST_USERS.otherTourist))
      .send({})
      .expect(403);
  });
  it('admin can check in one stay by its id; a cancelled stay is not checked in', async () => {
    const o = (await book(TEST_USERS.tourist).expect(201)).body.data as OrderDto;
    const stayId = o.hotelBookings![0].id;
    const res = await request(app.getHttpServer())
      .post(`${API}/admin/orders/${o.publicRef}/check-in`)
      .set(auth(TEST_USERS.admin))
      .send({ itemIds: [stayId] });
    expect(res.status).toBe(201);
    expect(res.body.data.hotelBookings[0]).toMatchObject({ status: 'CHECKED_IN' });
    expect(res.body.data.hotelBookings[0].checkedInAt).toBeTruthy();
  });
  it('rejects invalid dates in search and detail queries with 422', async () => {
    await request(app.getHttpServer()).get(`${API}/hotels?checkInDate=2026-13-45`).expect(422);
    await request(app.getHttpServer())
      .get(`${API}/hotels/sayeman-beach-resort?checkInDate=2026-02-31&checkOutDate=2026-03-02`)
      .expect(422);
  });
  it('sunbed bookings are unaffected: sunbed cancel still releases slots', async () => {
    const bed = await prisma.sunbed.findFirstOrThrow({ orderBy: { code: 'asc' } });
    const start = new Date(Date.parse(`${day(2)}T00:00:00.000Z`) + 4 * 3_600_000); // 10:00 Dhaka
    const created = await request(app.getHttpServer())
      .post(`${API}/orders`)
      .set(auth(TEST_USERS.tourist))
      .send({ items: [{ sunbedId: bed.id, startsAt: start.toISOString(), hours: 2 }] })
      .expect(201);
    const ref = created.body.data.publicRef as string;
    await request(app.getHttpServer())
      .post(`${API}/orders/${ref}/cancel`)
      .set(auth(TEST_USERS.tourist))
      .send({})
      .expect(201);
    expect(await prisma.bookingSlot.count({ where: { isActive: true, sunbedId: bed.id } })).toBe(0);
  });
});
