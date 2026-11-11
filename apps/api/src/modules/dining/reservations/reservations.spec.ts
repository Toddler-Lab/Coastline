import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../../catalogue/testing/test-bootstrap';
import type {
  AdminReservationDto,
  ReservationDto,
  TableAvailabilityDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../../common/testing/integration-fixture';
import { AuditActions } from '../../audit/audit.actions';
import { reseedTestDatabase } from '../../catalogue/testing/test-database';
import {
  MAIN_DEPOSIT_MINOR,
  RES_TABLES,
  RES_VENUES,
  dayKey,
  dhakaAt,
  seedReservationVenues,
  shiftReservation,
} from './testing/reservation-fixtures';

const describeDb = testDbReady() ? describe : describe.skip;
const API = '/api/v1';
const TIMEOUT = 30_000;

describeDb('dining table reservations', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    await seedReservationVenues(prisma);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());

  const reserve = (user: string | null, extra: Record<string, unknown> = {}) => {
    const req = http().post(`${API}/dining/reservations`);
    if (user) req.set(auth(user));
    return req.send({
      tableId: RES_TABLES.mainT1.id,
      startsAt: dhakaAt(2, 12),
      hours: 2,
      partySize: 3,
      ...extra,
    });
  };

  const placed = async (extra: Record<string, unknown> = {}, user: string = TEST_USERS.tourist) =>
    (await reserve(user, extra).expect(201)).body.data as ReservationDto;

  const availability = (code: string, date?: string) =>
    http().get(
      `${API}/dining/venues/${code}/availability${date === undefined ? '' : `?date=${date}`}`,
    );

  /* Availability ------------------------------------------------------------ */

  describe('availability', () => {
    it('lists every active table with one slot per opening hour, deposit from the venue', async () => {
      const res = await availability(RES_VENUES.main.code, dayKey(2)).expect(200);
      const data = res.body.data as TableAvailabilityDto;
      expect(data).toMatchObject({
        venueCode: RES_VENUES.main.code,
        date: dayKey(2),
        openHour: 8,
        closeHour: 22,
        depositMinor: MAIN_DEPOSIT_MINOR,
        currency: 'BDT',
      });
      expect(data.tables.map((t) => t.code)).toEqual([
        RES_TABLES.mainT1.code,
        RES_TABLES.mainT2.code,
      ]);
      const slots = data.tables[0].slots;
      expect(slots).toHaveLength(14);
      expect(slots[0]).toEqual({
        startsAt: dhakaAt(2, 8),
        hour: 8,
        label: '08:00',
        available: true,
      });
      expect(slots.at(-1)?.label).toBe('21:00');
      expect(slots.every((s) => s.available)).toBe(true);
    });

    it('marks reserved hours unavailable on that table only, and frees them on cancel', async () => {
      const r = await placed();
      let data = (await availability(RES_VENUES.main.code, dayKey(2)).expect(200)).body
        .data as TableAvailabilityDto;
      const taken = (code: string) =>
        data.tables
          .find((t) => t.code === code)!
          .slots.filter((s) => !s.available)
          .map((s) => s.label);
      expect(taken(RES_TABLES.mainT1.code)).toEqual(['12:00', '13:00']);
      expect(taken(RES_TABLES.mainT2.code)).toEqual([]);

      await http()
        .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(201);
      data = (await availability(RES_VENUES.main.code, dayKey(2)).expect(200)).body.data;
      expect(taken(RES_TABLES.mainT1.code)).toEqual([]);
    });

    it('marks hours that have already started today as unavailable', async () => {
      const now = Date.now();
      const data = (await availability(RES_VENUES.free.code).expect(200)).body
        .data as TableAvailabilityDto;
      expect(data.date).toBe(dayKey(0));
      const slots = data.tables[0].slots;
      expect(slots).toHaveLength(24);
      expect(slots[0].available).toBe(false); // 00:00 today has always started
      for (const slot of slots) {
        // Allow the request round-trip: a slot within a second of now may flip.
        if (Math.abs(Date.parse(slot.startsAt) - now) < 5_000) continue;
        expect(slot.available).toBe(Date.parse(slot.startsAt) > now);
      }
    });

    it('rejects malformed, impossible, past and beyond-window dates with 422', async () => {
      await availability(RES_VENUES.main.code, 'tomorrow').expect(422);
      await availability(RES_VENUES.main.code, '2026-02-30').expect(422);
      await availability(RES_VENUES.main.code, dayKey(-1)).expect(422);
      await availability(RES_VENUES.main.code, dayKey(8)).expect(422);
      await availability(RES_VENUES.main.code, dayKey(7)).expect(200);
    });

    it('404 for unknown or inactive venues, 422 when reservations are disabled', async () => {
      await availability('NOPE').expect(404);
      await availability(RES_VENUES.inactive.code).expect(404);
      await availability(RES_VENUES.noRes.code).expect(422);
    });
  });

  /* Create ------------------------------------------------------------------ */

  describe('create', () => {
    it('snapshots names, deposit and currency, takes one mock deposit and audits', async () => {
      const res = await reserve(TEST_USERS.tourist, { note: '  window seat  ' })
        .set('x-request-id', 'req-res-1')
        .expect(201);
      const r = res.body.data as ReservationDto;
      expect(r.publicRef).toMatch(new RegExp(`^RS-${dayKey(2).replace(/-/g, '')}-[0-9A-F]{4}$`));
      expect(r).toMatchObject({
        status: 'CONFIRMED',
        venue: { code: RES_VENUES.main.code, name: 'Test Grill House' },
        table: { code: RES_TABLES.mainT1.code },
        partySize: 3,
        startAt: dhakaAt(2, 12),
        endAt: dhakaAt(2, 14),
        phase: 'UPCOMING',
        depositMinor: MAIN_DEPOSIT_MINOR,
        currency: 'BDT',
        note: 'window seat',
        canCancel: true,
        cancelledAt: null,
        checkedInAt: null,
      });
      expect(r.payments).toHaveLength(1);
      expect(r.payments[0]).toMatchObject({
        type: 'CHARGE',
        provider: 'MOCK',
        amountMinor: MAIN_DEPOSIT_MINOR,
        externalRef: `MOCK-${r.publicRef}`,
      });
      expect(r.ticket?.code).toBe(r.publicRef);
      expect(r.ticket?.payload).toMatch(new RegExp(`^COASTLINE:${r.publicRef}:[0-9A-F]{16}$`));

      const slots = await prisma.tableSlot.findMany({
        where: { reservationId: r.id },
        orderBy: { slotStart: 'asc' },
      });
      expect(slots.map((s) => [s.slotStart.toISOString(), s.isActive])).toEqual([
        [dhakaAt(2, 12), true],
        [dhakaAt(2, 13), true],
      ]);

      const audit = await prisma.auditEvent.findMany({ where: { entityId: r.id } });
      expect(audit).toHaveLength(1);
      expect(audit[0]).toMatchObject({
        action: AuditActions.RESERVATION_PLACED,
        actorUserId: TEST_USERS.tourist,
        entityType: 'table_reservation',
        requestId: 'req-res-1',
      });
    });

    it('takes no payment when the venue deposit is zero', async () => {
      const r = await placed({ tableId: RES_TABLES.freeT1.id, startsAt: dhakaAt(1, 23), hours: 1 });
      expect(r.depositMinor).toBe(0);
      expect(r.payments).toEqual([]);
      expect(await prisma.payment.count({ where: { reservationId: r.id } })).toBe(0);
    });

    it('rejects client-sent deposit or tourist fields with 400 (never trusted)', async () => {
      await reserve(TEST_USERS.tourist, { depositMinor: 0 }).expect(400);
      await reserve(TEST_USERS.tourist, { touristId: TEST_USERS.otherTourist }).expect(400);
    });

    it('rejects a malformed body with 400', async () => {
      await reserve(TEST_USERS.tourist, { tableId: 'not-a-uuid' }).expect(400);
      await reserve(TEST_USERS.tourist, { startsAt: 'later' }).expect(400);
      await reserve(TEST_USERS.tourist, { hours: 1.5 }).expect(400);
      await reserve(TEST_USERS.tourist, { paymentMethod: 'CARD' }).expect(400);
    });

    it.each([
      [
        'not on the hour',
        { startsAt: new Date(Date.parse(dhakaAt(2, 12)) + 30 * 60_000).toISOString() },
      ],
      ['in the past', { startsAt: dhakaAt(-1, 12) }],
      ['beyond the advance window', { startsAt: dhakaAt(8, 12) }],
      ['zero hours', { hours: 0 }],
      ['more than the maximum hours', { hours: 4 }],
      ['zero party size', { partySize: 0 }],
      ['party larger than the table', { partySize: 5 }],
      ['starting before opening', { startsAt: dhakaAt(2, 7) }],
      ['running past closing', { startsAt: dhakaAt(2, 21), hours: 2 }],
      ['an inactive table', { tableId: RES_TABLES.mainRetired.id }],
      ['a venue without reservations', { tableId: RES_TABLES.noResT1.id }],
    ])('422 for %s', async (_label, extra) => {
      await reserve(TEST_USERS.tourist, extra).expect(422);
    });

    it('404 for an unknown table or a table at an inactive venue', async () => {
      await reserve(TEST_USERS.tourist, {
        tableId: '31000000-0000-4000-8000-0000000000ff',
      }).expect(404);
      await reserve(TEST_USERS.tourist, { tableId: RES_TABLES.inactiveT1.id }).expect(404);
    });

    it('anonymous gets 401 and an admin persona gets 403', async () => {
      await reserve(null).expect(401);
      await reserve(TEST_USERS.admin).expect(403);
      expect(await prisma.tableReservation.count()).toBe(0);
    });

    it('409 SLOT_TAKEN when any requested hour on the table is already reserved', async () => {
      await placed();
      const res = await reserve(TEST_USERS.otherTourist, { startsAt: dhakaAt(2, 13), hours: 1 });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatchObject({
        code: 'CONFLICT',
        details: { reason: 'SLOT_TAKEN', tableCode: RES_TABLES.mainT1.code },
      });
      // Same hour on another table, and adjacent hours on the same table, are fine.
      await placed({ tableId: RES_TABLES.mainT2.id, partySize: 2 }, TEST_USERS.otherTourist);
      await placed({ startsAt: dhakaAt(2, 14), hours: 1 }, TEST_USERS.otherTourist);
    });

    it('race: two parallel creates for the same table-hour give exactly one 201 and one 409', async () => {
      const results = await Promise.all([
        reserve(TEST_USERS.tourist, { hours: 1 }),
        reserve(TEST_USERS.otherTourist, { hours: 1 }),
      ]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409]);
      expect(await prisma.tableReservation.count()).toBe(1);
      expect(await prisma.tableSlot.count({ where: { isActive: true } })).toBe(1);
      expect(await prisma.payment.count()).toBe(1);
    });

    it('race: overlapping windows across many parallel creates never double-book an hour', async () => {
      const results = await Promise.all(
        [10, 11, 12, 11, 10, 12].map((hour, i) =>
          reserve(i % 2 ? TEST_USERS.tourist : TEST_USERS.otherTourist, {
            startsAt: dhakaAt(3, hour),
            hours: 2,
          }),
        ),
      );
      expect(results.every((r) => r.status === 201 || r.status === 409)).toBe(true);
      expect(results.filter((r) => r.status === 201).length).toBeGreaterThanOrEqual(1);
      const active = await prisma.tableSlot.findMany({ where: { isActive: true } });
      const keys = active.map((s) => `${s.tableId}|${s.slotStart.toISOString()}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  /* Read -------------------------------------------------------------------- */

  describe('read', () => {
    it('owner and admin can read; another tourist gets 404; anonymous 401', async () => {
      const r = await placed();
      await http()
        .get(`${API}/dining/reservations/${r.publicRef}`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      await http()
        .get(`${API}/dining/reservations/${r.publicRef}`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      await http()
        .get(`${API}/dining/reservations/${r.publicRef}`)
        .set(auth(TEST_USERS.otherTourist))
        .expect(404);
      await http().get(`${API}/dining/reservations/${r.publicRef}`).expect(401);
      await http()
        .get(`${API}/dining/reservations/RS-00000000-FFFF`)
        .set(auth(TEST_USERS.tourist))
        .expect(404);
    });

    it('/reservations/me lists only the caller’s reservations', async () => {
      const mine = await placed();
      await placed({ tableId: RES_TABLES.mainT2.id, partySize: 2 }, TEST_USERS.otherTourist);
      const res = await http()
        .get(`${API}/dining/reservations/me`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      expect(res.body.data.reservations.map((x: ReservationDto) => x.publicRef)).toEqual([
        mine.publicRef,
      ]);
      await http().get(`${API}/dining/reservations/me`).expect(401);
    });
  });

  /* Cancel ------------------------------------------------------------------ */

  describe('tourist cancel', () => {
    it('cancels, releases the slots, refunds the deposit by reversal and audits', async () => {
      const r = await placed();
      const res = await http()
        .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({ reason: 'Plans changed' })
        .expect(201);
      const c = res.body.data as ReservationDto;
      expect(c).toMatchObject({
        status: 'CANCELLED',
        phase: 'CANCELLED',
        cancelReason: 'Plans changed',
        canCancel: false,
        ticket: null,
      });
      expect(c.payments.map((p) => [p.type, p.amountMinor])).toEqual([
        ['CHARGE', MAIN_DEPOSIT_MINOR],
        ['REFUND', MAIN_DEPOSIT_MINOR],
      ]);
      expect(await prisma.tableSlot.count({ where: { reservationId: r.id, isActive: true } })).toBe(
        0,
      );
      // Rows are kept: slots deactivated, never deleted.
      expect(await prisma.tableSlot.count({ where: { reservationId: r.id } })).toBe(2);
      const audit = await prisma.auditEvent.findFirst({
        where: { entityId: r.id, action: AuditActions.RESERVATION_CANCELLED },
      });
      expect(audit).toMatchObject({ actorUserId: TEST_USERS.tourist });
    });

    it('released hours can be rebooked by someone else', async () => {
      const r = await placed();
      await reserve(TEST_USERS.otherTourist).expect(409);
      await http()
        .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(201);
      await reserve(TEST_USERS.otherTourist).expect(201);
    });

    it('a second cancel is a 409 and does not refund twice', async () => {
      const r = await placed();
      const cancel = () =>
        http()
          .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
          .set(auth(TEST_USERS.tourist))
          .send({});
      await cancel().expect(201);
      await cancel().expect(409);
      expect(await prisma.payment.count({ where: { reservationId: r.id, type: 'REFUND' } })).toBe(
        1,
      );
    });

    it('parallel cancels refund exactly once', async () => {
      const r = await placed();
      const results = await Promise.all(
        [0, 1].map(() =>
          http()
            .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
            .set(auth(TEST_USERS.tourist))
            .send({}),
        ),
      );
      expect(results.map((x) => x.status).sort()).toEqual([201, 409]);
      expect(await prisma.payment.count({ where: { reservationId: r.id, type: 'REFUND' } })).toBe(
        1,
      );
    });

    it('another tourist gets 403, an admin on the tourist route gets 403, anonymous 401', async () => {
      const r = await placed();
      const url = `${API}/dining/reservations/${r.publicRef}/cancel`;
      await http().post(url).set(auth(TEST_USERS.otherTourist)).send({}).expect(403);
      await http().post(url).set(auth(TEST_USERS.admin)).send({}).expect(403);
      await http().post(url).send({}).expect(401);
      await http()
        .post(`${API}/dining/reservations/RS-00000000-FFFF/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(404);
    });

    it('inside the 60-minute cutoff the tourist cannot cancel but an admin can (with refund)', async () => {
      const r = await placed();
      await shiftReservation(prisma, r.publicRef, 45);
      const read = await http()
        .get(`${API}/dining/reservations/${r.publicRef}`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      expect(read.body.data).toMatchObject({ canCancel: false, phase: 'UPCOMING' });
      await http()
        .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(422);

      const admin = await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.admin))
        .send({ reason: 'Kitchen closed' })
        .expect(201);
      const a = admin.body.data as AdminReservationDto;
      expect(a).toMatchObject({
        status: 'CANCELLED',
        cancelReason: 'Kitchen closed',
        tourist: { id: TEST_USERS.tourist, name: 'Test Tourist' },
      });
      expect(a.payments.filter((p) => p.type === 'REFUND')).toHaveLength(1);
      expect(await prisma.tableSlot.count({ where: { reservationId: r.id, isActive: true } })).toBe(
        0,
      );
      const audit = await prisma.auditEvent.findFirst({
        where: { entityId: r.id, action: AuditActions.RESERVATION_CANCELLED },
      });
      expect(audit?.actorUserId).toBe(TEST_USERS.admin);
    });

    it('just outside the cutoff the tourist can still cancel', async () => {
      const r = await placed();
      await shiftReservation(prisma, r.publicRef, 75);
      await http()
        .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(201);
    });
  });

  /* Admin ------------------------------------------------------------------- */

  describe('admin', () => {
    it('admin endpoints reject tourists (403) and anonymous (401)', async () => {
      const r = await placed();
      await http()
        .get(`${API}/admin/dining/reservations`)
        .set(auth(TEST_USERS.tourist))
        .expect(403);
      await http().get(`${API}/admin/dining/reservations`).expect(401);
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/check-in`)
        .set(auth(TEST_USERS.tourist))
        .expect(403);
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(403);
    });

    it('lists with date, venue and status filters and includes the tourist', async () => {
      const a = await placed();
      const b = await placed(
        { tableId: RES_TABLES.freeT1.id, startsAt: dhakaAt(3, 9), hours: 1 },
        TEST_USERS.otherTourist,
      );
      const list = async (qs: string) =>
        (
          await http()
            .get(`${API}/admin/dining/reservations${qs}`)
            .set(auth(TEST_USERS.admin))
            .expect(200)
        ).body.data as AdminReservationDto[];

      expect((await list('')).map((x) => x.publicRef).sort()).toEqual(
        [a.publicRef, b.publicRef].sort(),
      );
      expect((await list(`?date=${dayKey(2)}`)).map((x) => x.publicRef)).toEqual([a.publicRef]);
      expect((await list(`?venueCode=${RES_VENUES.free.code.toLowerCase()}`))[0]).toMatchObject({
        publicRef: b.publicRef,
        tourist: { id: TEST_USERS.otherTourist, email: 'other@test.example' },
      });
      expect(await list('?status=CANCELLED')).toEqual([]);
      await http()
        .get(`${API}/admin/dining/reservations?date=2026-02-30`)
        .set(auth(TEST_USERS.admin))
        .expect(422);
      await http()
        .get(`${API}/admin/dining/reservations?status=NOPE`)
        .set(auth(TEST_USERS.admin))
        .expect(400);
    });

    it('check-in is refused before the 30-minute window opens', async () => {
      const r = await placed();
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(422);
      await shiftReservation(prisma, r.publicRef, 40);
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(422);
    });

    it('check-in inside the window moves CONFIRMED to CHECKED_IN and audits', async () => {
      const r = await placed();
      await shiftReservation(prisma, r.publicRef, 20);
      const res = await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .set('x-request-id', 'req-checkin')
        .expect(201);
      const a = res.body.data as AdminReservationDto;
      expect(a.status).toBe('CHECKED_IN');
      expect(a.checkedInAt).toBeTruthy();
      expect(a.canCancel).toBe(false);
      expect(a.ticket).toBeNull();
      const audit = await prisma.auditEvent.findFirst({
        where: { entityId: r.id, action: AuditActions.RESERVATION_CHECKED_IN },
      });
      expect(audit).toMatchObject({ actorUserId: TEST_USERS.admin, requestId: 'req-checkin' });

      // Checked-in reservations can be neither checked in again nor cancelled.
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(409);
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.admin))
        .send({})
        .expect(409);
    });

    it('check-in works while the reservation is running and closes when it ends', async () => {
      const running = await placed();
      await shiftReservation(prisma, running.publicRef, -30);
      const read = await http()
        .get(`${API}/dining/reservations/${running.publicRef}`)
        .set(auth(TEST_USERS.tourist))
        .expect(200);
      expect(read.body.data.phase).toBe('ACTIVE');
      await http()
        .post(`${API}/admin/dining/reservations/${running.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(201);

      const ended = await placed({ tableId: RES_TABLES.mainT2.id, partySize: 2 });
      await shiftReservation(prisma, ended.publicRef, -180);
      await http()
        .post(`${API}/admin/dining/reservations/${ended.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(422);
    });

    it('a cancelled reservation cannot be checked in; unknown refs are 404', async () => {
      const r = await placed();
      await http()
        .post(`${API}/dining/reservations/${r.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(201);
      await http()
        .post(`${API}/admin/dining/reservations/${r.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(409);
      await http()
        .post(`${API}/admin/dining/reservations/RS-00000000-FFFF/check-in`)
        .set(auth(TEST_USERS.admin))
        .expect(404);
    });
  });
});
