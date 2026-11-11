import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../../catalogue/testing/test-bootstrap';
import {
  MAX_FOOD_ITEM_QUANTITY,
  MAX_FOOD_ORDER_LINES,
  type AdminFoodOrderDto,
  type DeliverableBedDto,
  type FoodOrderDto,
  type FoodOrderListDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  TEST_BEDS,
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../../common/testing/integration-fixture';
import { dhakaDateKey } from '../../../common/time/dhaka';
import { reseedTestDatabase } from '../../catalogue/testing/test-database';
import {
  FOOD_IDS,
  KOL_PRICES,
  closedHoursNow,
  createSunbedBooking,
  seedDeliveryVenues,
} from './testing/delivery-fixture';

const describeDb = testDbReady() ? describe : describe.skip;
const API = '/api/v1';
const TIMEOUT = 30_000;

describeDb('sunbed food delivery', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let bedId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    await seedDeliveryVenues(prisma);
    bedId = (await createSunbedBooking(prisma, { touristId: TEST_USERS.tourist })).orderItemId;
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());

  const place = (user: string | null, body: Record<string, unknown> = {}) => {
    const req = http().post(`${API}/dining/food-orders`);
    if (user) req.set(auth(user));
    return req.send({
      orderItemId: bedId,
      venueId: FOOD_IDS.kolVenue,
      lines: [
        { menuItemId: FOOD_IDS.kolTea, quantity: 2 },
        { menuItemId: FOOD_IDS.kolFry, quantity: 1 },
      ],
      ...body,
    });
  };

  const placeOk = async (body: Record<string, unknown> = {}) =>
    (await place(TEST_USERS.tourist, body).expect(201)).body.data as FoodOrderDto;

  const setStatus = (ref: string, status: string, user: string = TEST_USERS.admin, reason?: string) =>
    http()
      .post(`${API}/admin/dining/food-orders/${ref}/status`)
      .set(auth(user))
      .send(reason ? { status, reason } : { status });

  const auditFor = (entityId: string) =>
    prisma.auditEvent.findMany({ where: { entityId }, orderBy: { createdAt: 'asc' } });

  /* Deliverable beds -------------------------------------------------------- */

  describe('GET /dining/delivery/beds', () => {
    it('lists only the tourist’s own running, non-cancelled sunbed bookings', async () => {
      await createSunbedBooking(prisma, {
        touristId: TEST_USERS.tourist,
        sunbedId: TEST_BEDS.kol002,
        fromHour: 3,
        toHour: 5,
      }); // future
      await createSunbedBooking(prisma, {
        touristId: TEST_USERS.tourist,
        sunbedId: TEST_BEDS.kol003,
        orderStatus: 'CANCELLED',
        itemStatus: 'CANCELLED',
      });
      const checkedIn = await createSunbedBooking(prisma, {
        touristId: TEST_USERS.tourist,
        sunbedId: TEST_BEDS.sug001,
        itemStatus: 'CHECKED_IN',
      });
      await createSunbedBooking(prisma, {
        touristId: TEST_USERS.otherTourist,
        sunbedId: TEST_BEDS.sug002,
      });

      const res = await http()
        .get(`${API}/dining/delivery/beds`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      const beds = res.body.data as DeliverableBedDto[];
      expect(beds.map((b) => b.orderItemId).sort()).toEqual(
        [bedId, checkedIn.orderItemId].sort(),
      );
      const kol = beds.find((b) => b.orderItemId === bedId)!;
      expect(kol).toMatchObject({
        sunbedCode: 'KOL-001',
        beachPointCode: 'KOL',
        beachPointName: 'Kolatoli',
        status: 'RESERVED',
      });
    });

    it('requires a tourist persona', async () => {
      await http().get(`${API}/dining/delivery/beds`).expect(401);
      await http().get(`${API}/dining/delivery/beds`).set(auth(TEST_USERS.admin)).expect(403);
    });
  });

  /* Placing an order ------------------------------------------------------- */

  describe('POST /dining/food-orders', () => {
    it('prices on the server, snapshots names, takes one mock charge and audits', async () => {
      const order = await placeOk({ note: '  Extra lemon  ' });
      const expected = KOL_PRICES.tea * 2 + KOL_PRICES.fry;

      expect(order.publicRef).toMatch(/^FO-\d{8}-[0-9A-F]{4}$/);
      expect(order.publicRef.slice(3, 11)).toBe(dhakaDateKey().replace(/-/g, ''));
      expect(order).toMatchObject({
        status: 'PLACED',
        venue: { code: 'T-KOL-KITCHEN', name: 'Kolatoli Test Kitchen' },
        delivery: { sunbedCode: 'KOL-001', beachPointCode: 'KOL', beachPointName: 'Kolatoli' },
        subtotalMinor: expected,
        totalMinor: expected,
        currency: 'BDT',
        note: 'Extra lemon',
        canCancel: true,
        preparingAt: null,
        cancelledAt: null,
      });
      expect(order.lines).toHaveLength(2);
      expect(order.lines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            menuItemId: FOOD_IDS.kolTea,
            name: 'Lemon tea',
            unitPriceMinor: KOL_PRICES.tea,
            quantity: 2,
            totalMinor: KOL_PRICES.tea * 2,
          }),
          expect.objectContaining({ menuItemId: FOOD_IDS.kolFry, totalMinor: KOL_PRICES.fry }),
        ]),
      );
      expect(order.payments).toHaveLength(1);
      expect(order.payments[0]).toMatchObject({
        type: 'CHARGE',
        provider: 'MOCK',
        status: 'SUCCEEDED',
        amountMinor: expected,
        externalRef: `MOCK-${order.publicRef}`,
      });

      const audit = await auditFor(order.id);
      expect(audit.map((a) => a.action)).toEqual(['food_order.placed']);
      expect(audit[0].actorUserId).toBe(TEST_USERS.tourist);
    });

    it('snapshots survive later menu edits', async () => {
      const order = await placeOk();
      await prisma.menuItem.update({
        where: { id: FOOD_IDS.kolTea },
        data: { name: 'Renamed tea', priceMinor: 99900 },
      });
      const res = await http()
        .get(`${API}/dining/food-orders/${order.publicRef}`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      const tea = (res.body.data as FoodOrderDto).lines.find(
        (l) => l.menuItemId === FOOD_IDS.kolTea,
      )!;
      expect(tea).toMatchObject({ name: 'Lemon tea', unitPriceMinor: KOL_PRICES.tea });
    });

    it('rejects a client-sent price and never stores it', async () => {
      await place(TEST_USERS.tourist, {
        lines: [{ menuItemId: FOOD_IDS.kolTea, quantity: 1, unitPriceMinor: 1 }],
      }).expect(400);
      await place(TEST_USERS.tourist, { totalMinor: 1 }).expect(400);
      expect(await prisma.foodOrder.count()).toBe(0);
    });

    it.each([
      ['no lines', []],
      [
        'too many lines',
        Array.from({ length: MAX_FOOD_ORDER_LINES + 1 }, () => ({
          menuItemId: FOOD_IDS.kolTea,
          quantity: 1,
        })),
      ],
      ['quantity 0', [{ menuItemId: FOOD_IDS.kolTea, quantity: 0 }]],
      ['negative quantity', [{ menuItemId: FOOD_IDS.kolTea, quantity: -2 }]],
      [
        'quantity above the limit',
        [{ menuItemId: FOOD_IDS.kolTea, quantity: MAX_FOOD_ITEM_QUANTITY + 1 }],
      ],
      [
        'duplicate menu item',
        [
          { menuItemId: FOOD_IDS.kolTea, quantity: 1 },
          { menuItemId: FOOD_IDS.kolTea, quantity: 2 },
        ],
      ],
      ['item from another venue', [{ menuItemId: FOOD_IDS.sugPrawn, quantity: 1 }]],
      ['unknown item', [{ menuItemId: '32000000-0000-4000-8000-0000000000ff', quantity: 1 }]],
      ['unavailable item', [{ menuItemId: FOOD_IDS.kolSoldOut, quantity: 1 }]],
    ])('422 for %s', async (_label, lines) => {
      const res = await place(TEST_USERS.tourist, { lines }).expect(422);
      expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
      expect(await prisma.foodOrder.count()).toBe(0);
      expect(await prisma.payment.count({ where: { foodOrderId: { not: null } } })).toBe(0);
    });

    it('accepts the maximum quantity', async () => {
      const order = await placeOk({
        lines: [{ menuItemId: FOOD_IDS.kolCoconut, quantity: MAX_FOOD_ITEM_QUANTITY }],
      });
      expect(order.totalMinor).toBe(KOL_PRICES.coconut * MAX_FOOD_ITEM_QUANTITY);
    });

    it('400 for a malformed body', async () => {
      await place(TEST_USERS.tourist, { lines: [{ menuItemId: 'nope', quantity: 1 }] }).expect(400);
      await place(TEST_USERS.tourist, {
        lines: [{ menuItemId: FOOD_IDS.kolTea, quantity: 1.5 }],
      }).expect(400);
      await place(TEST_USERS.tourist, { orderItemId: 'x' }).expect(400);
    });

    describe('delivery eligibility', () => {
      it('404 for another tourist’s sunbed booking', async () => {
        const other = await createSunbedBooking(prisma, {
          touristId: TEST_USERS.otherTourist,
          sunbedId: TEST_BEDS.kol002,
        });
        await place(TEST_USERS.tourist, { orderItemId: other.orderItemId }).expect(404);
      });

      it('404 for an unknown booking line', async () => {
        await place(TEST_USERS.tourist, {
          orderItemId: '40000000-0000-4000-8000-000000000000',
        }).expect(404);
      });

      it('422 when the bed window has not started', async () => {
        const future = await createSunbedBooking(prisma, {
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol002,
          fromHour: 2,
          toHour: 4,
        });
        await place(TEST_USERS.tourist, { orderItemId: future.orderItemId }).expect(422);
      });

      it('422 when the bed window has ended', async () => {
        const past = await createSunbedBooking(prisma, {
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol002,
          fromHour: -3,
          toHour: 0,
        });
        await place(TEST_USERS.tourist, { orderItemId: past.orderItemId }).expect(422);
      });

      it('422 for a cancelled sunbed booking', async () => {
        const cancelled = await createSunbedBooking(prisma, {
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol002,
          orderStatus: 'CANCELLED',
          itemStatus: 'CANCELLED',
        });
        await place(TEST_USERS.tourist, { orderItemId: cancelled.orderItemId }).expect(422);
      });

      it('accepts a checked-in bed', async () => {
        const checkedIn = await createSunbedBooking(prisma, {
          touristId: TEST_USERS.tourist,
          sunbedId: TEST_BEDS.kol002,
          itemStatus: 'CHECKED_IN',
        });
        const order = await placeOk({ orderItemId: checkedIn.orderItemId });
        expect(order.delivery.sunbedCode).toBe('KOL-002');
      });

      it('422 when the venue is at another beach point', async () => {
        await place(TEST_USERS.tourist, {
          venueId: FOOD_IDS.sugVenue,
          lines: [{ menuItemId: FOOD_IDS.sugPrawn, quantity: 1 }],
        }).expect(422);
      });

      it('422 when the venue does not deliver', async () => {
        await prisma.diningVenue.update({
          where: { id: FOOD_IDS.kolVenue },
          data: { deliveryEnabled: false },
        });
        await place(TEST_USERS.tourist).expect(422);
      });

      it('422 when the venue is closed now (Asia/Dhaka hours)', async () => {
        await prisma.diningVenue.update({
          where: { id: FOOD_IDS.kolVenue },
          data: closedHoursNow(),
        });
        const res = await place(TEST_USERS.tourist).expect(422);
        expect(res.body.error.message).toMatch(/closed/i);
      });

      it('404 for an inactive venue', async () => {
        await prisma.diningVenue.update({
          where: { id: FOOD_IDS.kolVenue },
          data: { isActive: false },
        });
        await place(TEST_USERS.tourist).expect(404);
      });
    });

    it('rejects anonymous (401) and admin (403) callers', async () => {
      await place(null).expect(401);
      await place(TEST_USERS.admin).expect(403);
      expect(await prisma.foodOrder.count()).toBe(0);
    });
  });

  /* Reading ---------------------------------------------------------------- */

  describe('reading orders', () => {
    it('owner and admin can read; another tourist gets 404', async () => {
      const order = await placeOk();
      const path = `${API}/dining/food-orders/${order.publicRef}`;
      await http().get(path).set(auth(TEST_USERS.tourist)).expect(200);
      await http().get(path).set(auth(TEST_USERS.admin)).expect(200);
      await http().get(path).set(auth(TEST_USERS.otherTourist)).expect(404);
      await http().get(path).expect(401);
      await http().get(`${API}/dining/food-orders/FO-NOPE`).set(auth(TEST_USERS.tourist)).expect(404);
    });

    it('/me lists only the caller’s orders', async () => {
      const order = await placeOk();
      const mine = await http()
        .get(`${API}/dining/food-orders/me`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      expect((mine.body.data as FoodOrderListDto).orders.map((o) => o.publicRef)).toEqual([
        order.publicRef,
      ]);
      const theirs = await http()
        .get(`${API}/dining/food-orders/me`)
        .set(auth(TEST_USERS.otherTourist))
        .expect(200);
      expect((theirs.body.data as FoodOrderListDto).orders).toEqual([]);
      await http().get(`${API}/dining/food-orders/me`).set(auth(TEST_USERS.admin)).expect(403);
    });
  });

  /* Tourist cancel --------------------------------------------------------- */

  describe('POST /dining/food-orders/:ref/cancel', () => {
    it('cancels a PLACED order with a mock refund by reversal and an audit row', async () => {
      const order = await placeOk();
      const res = await http()
        .post(`${API}/dining/food-orders/${order.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({ reason: 'Changed my mind' })
        .expect(201);
      const cancelled = res.body.data as FoodOrderDto;
      expect(cancelled).toMatchObject({
        status: 'CANCELLED',
        cancelReason: 'Changed my mind',
        canCancel: false,
      });
      expect(cancelled.cancelledAt).not.toBeNull();
      expect(cancelled.payments.map((p) => [p.type, p.amountMinor])).toEqual([
        ['CHARGE', order.totalMinor],
        ['REFUND', order.totalMinor],
      ]);
      const row = await prisma.foodOrder.findUniqueOrThrow({ where: { id: order.id } });
      expect(row.cancelledById).toBe(TEST_USERS.tourist);

      const audit = await auditFor(order.id);
      expect(audit.map((a) => a.action)).toEqual(['food_order.placed', 'food_order.cancelled']);

      // Second attempt is an illegal transition.
      await http()
        .post(`${API}/dining/food-orders/${order.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(409);
      expect(await prisma.payment.count({ where: { foodOrderId: order.id } })).toBe(2);
    });

    it('409 once the kitchen has started', async () => {
      const order = await placeOk();
      await setStatus(order.publicRef, 'PREPARING').expect(201);
      await http()
        .post(`${API}/dining/food-orders/${order.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(409);
      const read = await http()
        .get(`${API}/dining/food-orders/${order.publicRef}`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      expect(read.body.data.canCancel).toBe(false);
    });

    it('another tourist gets 404; admin must use the kitchen route', async () => {
      const order = await placeOk();
      const path = `${API}/dining/food-orders/${order.publicRef}/cancel`;
      await http().post(path).set(auth(TEST_USERS.otherTourist)).send({}).expect(404);
      await http().post(path).set(auth(TEST_USERS.admin)).send({}).expect(403);
      await http().post(path).send({}).expect(401);
      const row = await prisma.foodOrder.findUniqueOrThrow({ where: { id: order.id } });
      expect(row.status).toBe('PLACED');
    });
  });

  /* Kitchen ---------------------------------------------------------------- */

  describe('admin kitchen', () => {
    it('walks the full chain, stamping each timestamp and auditing every move', async () => {
      const order = await placeOk();
      const steps = ['PREPARING', 'READY', 'DELIVERED'] as const;
      let latest: AdminFoodOrderDto | undefined;
      for (const status of steps) {
        const res = await setStatus(order.publicRef, status).expect(201);
        latest = res.body.data as AdminFoodOrderDto;
        expect(latest.status).toBe(status);
      }
      expect(latest).toMatchObject({
        tourist: { id: TEST_USERS.tourist, name: 'Test Tourist' },
        canCancel: false,
        cancelledAt: null,
      });
      expect(latest!.preparingAt).not.toBeNull();
      expect(latest!.readyAt).not.toBeNull();
      expect(latest!.deliveredAt).not.toBeNull();
      expect(Date.parse(latest!.preparingAt!)).toBeLessThanOrEqual(Date.parse(latest!.readyAt!));
      expect(Date.parse(latest!.readyAt!)).toBeLessThanOrEqual(Date.parse(latest!.deliveredAt!));
      expect(latest!.payments).toHaveLength(1);

      const audit = await auditFor(order.id);
      expect(audit.map((a) => a.action)).toEqual([
        'food_order.placed',
        'food_order.status_changed',
        'food_order.status_changed',
        'food_order.status_changed',
      ]);
      expect(audit[1].actorUserId).toBe(TEST_USERS.admin);
      expect(audit[3].details).toMatchObject({ from: 'READY', to: 'DELIVERED' });
    });

    it.each([
      [[], 'READY'],
      [[], 'DELIVERED'],
      [['PREPARING'], 'PREPARING'],
      [['PREPARING'], 'CANCELLED'],
      [['PREPARING'], 'DELIVERED'],
      [['PREPARING', 'READY'], 'CANCELLED'],
      [['PREPARING', 'READY', 'DELIVERED'], 'READY'],
      [['CANCELLED'], 'PREPARING'],
    ])('409 for illegal move after %j to %s', async (path, target) => {
      const order = await placeOk();
      for (const status of path) {
        await setStatus(order.publicRef, status).expect(201);
      }
      const before = await auditFor(order.id);
      await setStatus(order.publicRef, target).expect(409);
      expect(await auditFor(order.id)).toHaveLength(before.length);
    });

    it('400 for PLACED or an unknown status; 404 for an unknown ref', async () => {
      const order = await placeOk();
      await setStatus(order.publicRef, 'PLACED').expect(400);
      await setStatus(order.publicRef, 'EATEN').expect(400);
      await setStatus('FO-NOPE', 'PREPARING').expect(404);
    });

    it('kitchen routes are ADMIN only', async () => {
      const order = await placeOk();
      await setStatus(order.publicRef, 'PREPARING', TEST_USERS.tourist).expect(403);
      await http().get(`${API}/admin/dining/food-orders`).set(auth(TEST_USERS.tourist)).expect(403);
      await http().get(`${API}/admin/dining/food-orders`).expect(401);
    });

    it('admin cancel from PLACED refunds and audits food_order.cancelled', async () => {
      const order = await placeOk();
      const res = await setStatus(order.publicRef, 'CANCELLED', TEST_USERS.admin, 'Out of fish').expect(201);
      const cancelled = res.body.data as AdminFoodOrderDto;
      expect(cancelled).toMatchObject({ status: 'CANCELLED', cancelReason: 'Out of fish' });
      expect(cancelled.payments.map((p) => p.type)).toEqual(['CHARGE', 'REFUND']);
      expect(cancelled.payments[1].amountMinor).toBe(order.totalMinor);
      const row = await prisma.foodOrder.findUniqueOrThrow({ where: { id: order.id } });
      expect(row.cancelledById).toBe(TEST_USERS.admin);
      const audit = await auditFor(order.id);
      expect(audit.map((a) => a.action)).toEqual(['food_order.placed', 'food_order.cancelled']);
    });

    it('two racing status changes: exactly one wins, the other gets 409', async () => {
      const order = await placeOk();
      const results = await Promise.all([
        setStatus(order.publicRef, 'PREPARING'),
        setStatus(order.publicRef, 'PREPARING'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      const audit = await auditFor(order.id);
      expect(audit.filter((a) => a.action === 'food_order.status_changed')).toHaveLength(1);
    });

    it('racing tourist cancel and kitchen start: exactly one wins, at most one refund', async () => {
      const order = await placeOk();
      const results = await Promise.all([
        http()
          .post(`${API}/dining/food-orders/${order.publicRef}/cancel`)
          .set(auth(TEST_USERS.tourist))
          .send({}),
        setStatus(order.publicRef, 'PREPARING'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      const row = await prisma.foodOrder.findUniqueOrThrow({ where: { id: order.id } });
      const refunds = await prisma.payment.count({
        where: { foodOrderId: order.id, type: 'REFUND' },
      });
      expect(refunds).toBe(row.status === 'CANCELLED' ? 1 : 0);
    });

    it('filters by venue, status and Dhaka date', async () => {
      const first = await placeOk();
      const second = await placeOk({
        lines: [{ menuItemId: FOOD_IDS.kolCoconut, quantity: 1 }],
      });
      await setStatus(second.publicRef, 'PREPARING').expect(201);

      const list = async (query: string) =>
        (
          (
            await http()
              .get(`${API}/admin/dining/food-orders${query}`)
              .set(auth(TEST_USERS.admin))
              .expect(200)
          ).body.data as AdminFoodOrderDto[]
        ).map((o) => o.publicRef);

      expect((await list('')).sort()).toEqual([first.publicRef, second.publicRef].sort());
      expect(await list('?status=PREPARING')).toEqual([second.publicRef]);
      expect(await list('?venueCode=t-kol-kitchen&status=PLACED')).toEqual([first.publicRef]);
      expect(await list('?venueCode=T-SUG-KITCHEN')).toEqual([]);
      expect((await list(`?date=${dhakaDateKey()}`)).length).toBe(2);
      expect(await list('?date=2020-01-01')).toEqual([]);

      await http()
        .get(`${API}/admin/dining/food-orders?date=2026-13-45`)
        .set(auth(TEST_USERS.admin))
        .expect(422);
      await http()
        .get(`${API}/admin/dining/food-orders?status=EATEN`)
        .set(auth(TEST_USERS.admin))
        .expect(400);
    });
  });
});
