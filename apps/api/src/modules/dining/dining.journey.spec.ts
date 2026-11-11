import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type {
  AdminFoodOrderDto,
  AdminReservationDto,
  DeliverableBedDto,
  DiningAdminOverviewDto,
  DiningVenueDetail,
  DiningVenueSummary,
  FoodOrderDto,
  FoodOrderListDto,
  ReservationDto,
  ReservationListDto,
  TableAvailabilityDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { dhakaDateKey } from '../../common/time/dhaka';
import { reseedTestDatabase } from '../catalogue/testing/test-database';
import {
  FOOD_IDS,
  KOL_PRICES,
  createSunbedBooking,
  seedDeliveryVenues,
} from './delivery/testing/delivery-fixture';
import {
  MAIN_DEPOSIT_MINOR,
  RES_TABLES,
  RES_VENUES,
  dayKey,
  seedReservationVenues,
  shiftReservation,
} from './reservations/testing/reservation-fixtures';

/**
 * Cross-stream journeys: catalogue (A) → reservations (B) / delivery (C) →
 * administration (D), through the public API only, against one database.
 */
const describeDb = testDbReady() ? describe : describe.skip;
const API = '/api/v1';
const TIMEOUT = 60_000;

describeDb('dining journeys across streams', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    await seedDeliveryVenues(prisma);
    await seedReservationVenues(prisma);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());
  const tourist = auth(TEST_USERS.tourist);
  const admin = auth(TEST_USERS.admin);

  const overview = async (date: string) => {
    const res = await http().get(`${API}/admin/dining/overview?date=${date}`).set(admin);
    expect(res.status).toBe(200);
    return res.body.data as DiningAdminOverviewDto;
  };

  it(
    'sunbed food delivery: discover → order to bed → kitchen → delivered',
    async () => {
      const bed = await createSunbedBooking(prisma, { touristId: TEST_USERS.tourist });

      // A: the Kolatoli kitchen is discoverable as a delivering venue.
      const list = await http().get(`${API}/dining/venues?delivers=true&beachPointCode=KOL`);
      expect(list.status).toBe(200);
      const codes = (list.body.data as DiningVenueSummary[]).map((v) => v.code);
      expect(codes).toContain('T-KOL-KITCHEN');
      const detail = (await http().get(`${API}/dining/venues/T-KOL-KITCHEN`)).body
        .data as DiningVenueDetail;
      expect(detail.id).toBe(FOOD_IDS.kolVenue);

      // C: the bed is deliverable and the order is priced server-side.
      const beds = (await http().get(`${API}/dining/delivery/beds`).set(tourist)).body
        .data as DeliverableBedDto[];
      expect(beds.map((b) => b.orderItemId)).toContain(bed.orderItemId);

      const placed = await http()
        .post(`${API}/dining/food-orders`)
        .set(tourist)
        .send({
          orderItemId: bed.orderItemId,
          venueId: detail.id,
          lines: [
            { menuItemId: FOOD_IDS.kolTea, quantity: 2 },
            { menuItemId: FOOD_IDS.kolFry, quantity: 1 },
          ],
          paymentMethod: 'MOCK',
        });
      expect(placed.status).toBe(201);
      const order = placed.body.data as FoodOrderDto;
      const expectedTotal = KOL_PRICES.tea * 2 + KOL_PRICES.fry;
      expect(order.totalMinor).toBe(expectedTotal);
      expect(order.status).toBe('PLACED');

      // D: overview sees one open order and its simulated revenue.
      const today = dhakaDateKey();
      expect(await overview(today)).toMatchObject({
        openFoodOrders: 1,
        foodRevenueMinor: expectedTotal,
      });

      // D/C: kitchen board lists it; advance it through every status.
      const board = (
        await http().get(`${API}/admin/dining/food-orders?venueCode=T-KOL-KITCHEN`).set(admin)
      ).body.data as AdminFoodOrderDto[];
      expect(board.map((o) => o.publicRef)).toContain(order.publicRef);

      for (const status of ['PREPARING', 'READY', 'DELIVERED'] as const) {
        const moved = await http()
          .post(`${API}/admin/dining/food-orders/${order.publicRef}/status`)
          .set(admin)
          .send({ status });
        expect(moved.status).toBe(201);
        expect((moved.body.data as AdminFoodOrderDto).status).toBe(status);
      }

      // Tourist sees the delivered order and can no longer cancel it.
      const mine = (await http().get(`${API}/dining/food-orders/me`).set(tourist)).body
        .data as FoodOrderListDto;
      const delivered = mine.orders.find((o) => o.publicRef === order.publicRef);
      expect(delivered).toMatchObject({ status: 'DELIVERED', canCancel: false });
      expect(delivered?.deliveredAt).not.toBeNull();
      const cancel = await http()
        .post(`${API}/dining/food-orders/${order.publicRef}/cancel`)
        .set(tourist)
        .send({});
      expect(cancel.status).toBe(409);

      // D: menu price change does not touch the placed order (snapshot).
      const patch = await http()
        .patch(`${API}/admin/dining/menu-items/${FOOD_IDS.kolTea}`)
        .set(admin)
        .send({ priceMinor: KOL_PRICES.tea * 3 });
      expect(patch.status).toBe(200);
      const after = (await http().get(`${API}/dining/food-orders/${order.publicRef}`).set(tourist))
        .body.data as FoodOrderDto;
      expect(after.totalMinor).toBe(expectedTotal);

      expect(await overview(today)).toMatchObject({
        openFoodOrders: 0,
        foodRevenueMinor: expectedTotal,
      });

      const audits = await prisma.auditEvent.count({
        where: {
          action: { in: ['food_order.placed', 'food_order.status_changed', 'menu_item.updated'] },
        },
      });
      expect(audits).toBe(5);
    },
    TIMEOUT,
  );

  it(
    'table reservation: availability → reserve with demo deposit → admin check-in',
    async () => {
      const date = dayKey(1);
      const availability = await http().get(
        `${API}/dining/venues/${RES_VENUES.main.code}/availability?date=${date}`,
      );
      expect(availability.status).toBe(200);
      const grid = availability.body.data as TableAvailabilityDto;
      const table = grid.tables.find((t) => t.id === RES_TABLES.mainT1.id);
      const slot = table?.slots.find((s) => s.available && s.hour === 19);
      expect(slot).toBeDefined();

      const created = await http().post(`${API}/dining/reservations`).set(tourist).send({
        tableId: RES_TABLES.mainT1.id,
        startsAt: slot!.startsAt,
        hours: 2,
        partySize: 3,
        paymentMethod: 'MOCK',
      });
      expect(created.status).toBe(201);
      const reservation = created.body.data as ReservationDto;
      expect(reservation.depositMinor).toBe(MAIN_DEPOSIT_MINOR);
      expect(reservation.payments.map((p) => p.amountMinor)).toContain(MAIN_DEPOSIT_MINOR);

      // The booked hours are no longer offered.
      const again = (
        await http().get(`${API}/dining/venues/${RES_VENUES.main.code}/availability?date=${date}`)
      ).body.data as TableAvailabilityDto;
      const hours = again.tables
        .find((t) => t.id === RES_TABLES.mainT1.id)!
        .slots.filter((s) => s.hour === 19 || s.hour === 20);
      expect(hours.every((s) => !s.available)).toBe(true);

      // Check-in is refused outside the window, accepted once the start is near.
      const early = await http()
        .post(`${API}/admin/dining/reservations/${reservation.publicRef}/check-in`)
        .set(admin);
      expect(early.status).toBe(422);

      await shiftReservation(prisma, reservation.publicRef, 10);
      const stored = await prisma.tableReservation.findUniqueOrThrow({
        where: { publicRef: reservation.publicRef },
      });
      const startDay = dhakaDateKey(stored.startAt);

      const desk = (
        await http().get(`${API}/admin/dining/reservations?date=${startDay}`).set(admin)
      ).body.data as AdminReservationDto[];
      expect(desk.map((r) => r.publicRef)).toContain(reservation.publicRef);
      expect((await overview(startDay)).reservationsToday).toBe(1);

      const checkIn = await http()
        .post(`${API}/admin/dining/reservations/${reservation.publicRef}/check-in`)
        .set(admin);
      expect(checkIn.status).toBe(201);
      expect((checkIn.body.data as AdminReservationDto).status).toBe('CHECKED_IN');

      const mine = (await http().get(`${API}/dining/reservations/me`).set(tourist)).body
        .data as ReservationListDto;
      expect(mine.reservations.find((r) => r.publicRef === reservation.publicRef)).toMatchObject({
        status: 'CHECKED_IN',
        canCancel: false,
      });
    },
    TIMEOUT,
  );
});
