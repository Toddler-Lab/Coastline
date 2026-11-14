import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import {
  ErrorCode,
  PAYMENT_FAILED_MESSAGE,
  type BeachPointDetail,
  type HotelDetailDto,
  type TableAvailabilityDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_BEDS,
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { dhakaDateKey, dhakaHourToUtc } from '../../common/time/dhaka';
import { reseedTestDatabase } from '../catalogue/testing/test-database';
import {
  FOOD_IDS,
  createSunbedBooking,
  seedDeliveryVenues,
} from '../dining/delivery/testing/delivery-fixture';
import {
  RES_TABLES,
  RES_VENUES,
  dayKey as resDayKey,
  dhakaAt,
  seedReservationVenues,
} from '../dining/reservations/testing/reservation-fixtures';
import { DecliningPaymentProvider } from './testing/declining-payment.provider';

const describeDb = testDbReady() ? describe : describe.skip;
const API = '/api/v1';
const TIMEOUT = 30_000;

function day(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/**
 * A declined charge must leave nothing behind in any of the four services: no
 * confirmed booking, no held inventory, no payment row and no audit event. The
 * client sees 422 PAYMENT_FAILED with the "not charged" message.
 */
describeDb('declined payments', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const provider = new DecliningPaymentProvider();

  beforeAll(async () => {
    app = await createTestApp({ paymentProvider: provider });
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    provider.charges.length = 0;
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());

  function expectPaymentFailed(res: request.Response): void {
    expect(res.status).toBe(422);
    expect(res.body.error).toMatchObject({
      code: ErrorCode.PAYMENT_FAILED,
      message: PAYMENT_FAILED_MESSAGE,
      details: null,
    });
    expect(provider.charges).toHaveLength(1);
  }

  async function expectNothingRecorded(): Promise<void> {
    expect(await prisma.payment.count()).toBe(0);
    expect(await prisma.auditEvent.count()).toBe(0);
  }

  it('sunbed order: no order, no booked hours, beds still free', async () => {
    const date = day(1);
    const startsAt = dhakaHourToUtc(date, 10).toISOString();
    const res = await http()
      .post(`${API}/orders`)
      .set(auth(TEST_USERS.tourist))
      .send({
        items: [
          { sunbedId: TEST_BEDS.kol001, startsAt, hours: 2 },
          { sunbedId: TEST_BEDS.kol002, startsAt, hours: 2 },
        ],
        paymentMethod: 'BKASH',
      });
    expectPaymentFailed(res);
    expect(provider.charges[0]).toMatchObject({ amountMinor: 40000, method: 'BKASH' });

    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.orderItem.count()).toBe(0);
    expect(await prisma.bookingSlot.count()).toBe(0);
    await expectNothingRecorded();

    const detail = (await http().get(`${API}/beach-points/KOL?date=${date}`).expect(200)).body
      .data as BeachPointDetail;
    for (const id of [TEST_BEDS.kol001, TEST_BEDS.kol002]) {
      expect(detail.sunbeds.find((bed) => bed.id === id)?.bookedSlots).toEqual([]);
    }
  });

  it('hotel booking: no order, no room nights, rooms still available', async () => {
    const hotel = (await http().get(`${API}/hotels/sayeman-beach-resort`).expect(200)).body
      .data as HotelDetailDto;
    const res = await http()
      .post(`${API}/hotels/bookings`)
      .set(auth(TEST_USERS.tourist))
      .send({
        hotelId: hotel.id,
        roomTypeId: hotel.roomTypes[0].id,
        checkInDate: day(3),
        checkOutDate: day(5),
        guestsCount: 2,
        paymentMethod: 'CARD',
      });
    expectPaymentFailed(res);

    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.hotelBooking.count()).toBe(0);
    expect(await prisma.hotelRoomNight.count()).toBe(0);
    await expectNothingRecorded();

    const after = (
      await http()
        .get(`${API}/hotels/sayeman-beach-resort?checkInDate=${day(3)}&checkOutDate=${day(5)}`)
        .expect(200)
    ).body.data as HotelDetailDto;
    expect(after.roomTypes[0].availableRooms).toBe(hotel.roomTypes[0].availableRooms);
  });

  it('table reservation with a deposit: no reservation, table-hours still free', async () => {
    await seedReservationVenues(prisma);
    const res = await http()
      .post(`${API}/dining/reservations`)
      .set(auth(TEST_USERS.tourist))
      .send({
        tableId: RES_TABLES.mainT1.id,
        startsAt: dhakaAt(2, 12),
        hours: 2,
        partySize: 3,
        paymentMethod: 'NAGAD',
      });
    expectPaymentFailed(res);

    expect(await prisma.tableReservation.count()).toBe(0);
    expect(await prisma.tableSlot.count()).toBe(0);
    await expectNothingRecorded();

    const availability = (
      await http()
        .get(`${API}/dining/venues/${RES_VENUES.main.code}/availability?date=${resDayKey(2)}`)
        .expect(200)
    ).body.data as TableAvailabilityDto;
    const table = availability.tables.find((t) => t.id === RES_TABLES.mainT1.id)!;
    expect(table.slots.every((slot) => slot.available)).toBe(true);
  });

  it('food order: no order, no lines, the sunbed booking is untouched', async () => {
    await seedDeliveryVenues(prisma);
    const bed = await createSunbedBooking(prisma, { touristId: TEST_USERS.tourist });
    const res = await http()
      .post(`${API}/dining/food-orders`)
      .set(auth(TEST_USERS.tourist))
      .send({
        orderItemId: bed.orderItemId,
        venueId: FOOD_IDS.kolVenue,
        lines: [{ menuItemId: FOOD_IDS.kolTea, quantity: 2 }],
        paymentMethod: 'BKASH',
      });
    expectPaymentFailed(res);

    expect(await prisma.foodOrder.count()).toBe(0);
    expect(await prisma.foodOrderItem.count()).toBe(0);
    await expectNothingRecorded();
    const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: bed.orderItemId } });
    expect(item.status).toBe('RESERVED');
  });
});
