import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../../catalogue/testing/test-bootstrap';
import type {
  AdminMenuItemDto,
  DiningAdminOverviewDto,
  DiningAdminVenueDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../../common/testing/integration-fixture';
import { dhakaDateKey } from '../../../common/time/dhaka';
import { AuditActions } from '../../audit/audit.actions';
import { reseedTestDatabase } from '../../catalogue/testing/test-database';
import {
  ADMIN_FIXTURE,
  seedAdminDiningFixture,
  type AdminDiningFixture,
} from './testing/dining-admin-fixture';

const describeDb = testDbReady() ? describe : describe.skip;
const API = '/api/v1';
// Reseed + fixture is ~40 sequential inserts; leave headroom on a loaded machine.
const TIMEOUT = 60_000;
const MISSING_ID = '00000000-0000-4000-8000-0000000000ff';

describeDb('dining administration (stream D)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fixture: AdminDiningFixture;
  const today = dhakaDateKey();

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    fixture = await seedAdminDiningFixture(prisma, today);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());
  const patchVenue = (code: string, body: object, user: string | null = TEST_USERS.admin) => {
    const req = http().patch(`${API}/admin/dining/venues/${code}`);
    if (user) req.set(auth(user));
    return req.send(body);
  };
  const patchItem = (id: string, body: object, user: string | null = TEST_USERS.admin) => {
    const req = http().patch(`${API}/admin/dining/menu-items/${id}`);
    if (user) req.set(auth(user));
    return req.send(body);
  };

  describe('permissions', () => {
    const routes: Array<[string, (user: string | null) => request.Test]> = [
      ['GET overview', (user) => withUser(http().get(`${API}/admin/dining/overview`), user)],
      ['GET venues', (user) => withUser(http().get(`${API}/admin/dining/venues`), user)],
      ['PATCH venue', (user) => patchVenue(ADMIN_FIXTURE.activeVenue, { openHour: 9 }, user)],
      ['PATCH menu item', (user) => patchItem(fixture.availableItemId, { priceMinor: 1 }, user)],
    ];

    function withUser(req: request.Test, user: string | null): request.Test {
      return user ? req.set(auth(user)) : req;
    }

    it.each(routes)('%s: anonymous 401, tourists 403, admin 200', async (_name, call) => {
      await call(null).expect(401);
      await call(TEST_USERS.tourist).expect(403);
      await call(TEST_USERS.otherTourist).expect(403);
      await call(TEST_USERS.admin).expect(200);
    });

    it('rejected callers leave no audit rows and change nothing', async () => {
      await patchVenue(ADMIN_FIXTURE.activeVenue, { isActive: false }, TEST_USERS.tourist).expect(
        403,
      );
      await patchItem(fixture.availableItemId, { priceMinor: 1 }, null).expect(401);
      expect(await prisma.auditEvent.count()).toBe(0);
      const venue = await prisma.diningVenue.findUniqueOrThrow({
        where: { code: ADMIN_FIXTURE.activeVenue },
      });
      expect(venue.isActive).toBe(true);
    });
  });

  describe('GET /admin/dining/overview', () => {
    it('counts fixture rows for the Dhaka day', async () => {
      const res = await http()
        .get(`${API}/admin/dining/overview?date=${today}`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      const overview = res.body.data as DiningAdminOverviewDto;
      expect(overview).toEqual({
        date: today,
        currency: 'BDT',
        ...fixture.expected,
      });
    });

    it('defaults to today in Dhaka', async () => {
      const res = await http()
        .get(`${API}/admin/dining/overview`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      expect(res.body.data).toMatchObject({ date: today, ...fixture.expected });
    });

    it('scopes reservations and revenue to the requested date; open orders stay live', async () => {
      const tomorrow = new Date(Date.parse(`${today}T00:00:00.000Z`) + 86_400_000)
        .toISOString()
        .slice(0, 10);
      const res = await http()
        .get(`${API}/admin/dining/overview?date=${tomorrow}`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      expect(res.body.data).toMatchObject({
        date: tomorrow,
        venueCount: 2,
        reservationsToday: 1,
        openFoodOrders: 3,
        foodRevenueMinor: 0,
      });
    });

    it('rejects malformed (400) and impossible (422) dates', async () => {
      await http()
        .get(`${API}/admin/dining/overview?date=tomorrow`)
        .set(auth(TEST_USERS.admin))
        .expect(400);
      await http()
        .get(`${API}/admin/dining/overview?date=2026-02-31`)
        .set(auth(TEST_USERS.admin))
        .expect(422);
    });
  });

  describe('GET /admin/dining/venues', () => {
    it('lists inactive venues and unavailable menu items in the DiningVenueDetail shape', async () => {
      const res = await http()
        .get(`${API}/admin/dining/venues`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      const venues = res.body.data as DiningAdminVenueDto[];
      expect(venues.map((venue) => venue.code)).toEqual([
        ADMIN_FIXTURE.activeVenue,
        ADMIN_FIXTURE.inactiveVenue,
        ADMIN_FIXTURE.townVenue,
      ]);

      const active = venues[0];
      expect(active).toMatchObject({
        isActive: true,
        kind: 'SEAFOOD_KITCHEN',
        beachPointCode: 'SUG',
        beachPointName: 'Sugandha',
        reservationDepositMinor: 20000,
        currency: 'BDT',
        // Cheapest *available* item; the unavailable lobster is ignored.
        priceFromMinor: 38000,
      });
      const items = active.menu.flatMap((category) => category.items);
      expect(items.map((item) => item.name)).toEqual([
        'Grilled pomfret',
        'Prawn curry',
        'Lobster platter',
      ]);
      expect(items.find((item) => item.id === fixture.unavailableItemId)).toMatchObject({
        isAvailable: false,
        sortOrder: 3,
        currency: 'BDT',
      });

      expect(venues[1]).toMatchObject({ isActive: false, beachPointCode: 'KOL' });
      expect(venues[2]).toMatchObject({
        beachPointCode: null,
        beachPointName: null,
        priceFromMinor: null,
        menu: [],
      });
    });
  });

  describe('PATCH /admin/dining/venues/:code', () => {
    it('updates settings, returns the admin detail and audits only changed fields', async () => {
      const res = await patchVenue(ADMIN_FIXTURE.activeVenue, {
        openHour: 9,
        closeHour: 23,
        reservationsEnabled: true, // unchanged
        deliveryEnabled: false,
        reservationDepositMinor: 0,
        description: '  Fresh catch daily.  ',
      })
        .set('x-request-id', 'req-venue-1')
        .expect(200);
      expect(res.body.data).toMatchObject({
        code: ADMIN_FIXTURE.activeVenue,
        openHour: 9,
        closeHour: 23,
        reservationsEnabled: true,
        deliveryEnabled: false,
        reservationDepositMinor: 0,
        description: 'Fresh catch daily.',
        isActive: true,
      });

      const events = await prisma.auditEvent.findMany();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        action: AuditActions.DINING_VENUE_UPDATED,
        entityType: 'dining_venue',
        entityId: fixture.activeVenueId,
        actorUserId: TEST_USERS.admin,
        requestId: 'req-venue-1',
        details: {
          code: ADMIN_FIXTURE.activeVenue,
          before: {
            openHour: 10,
            closeHour: 22,
            deliveryEnabled: true,
            reservationDepositMinor: 20000,
            description: null,
          },
          after: {
            openHour: 9,
            closeHour: 23,
            deliveryEnabled: false,
            reservationDepositMinor: 0,
            description: 'Fresh catch daily.',
          },
        },
      });
      expect(events[0].details).not.toHaveProperty('before.reservationsEnabled');
    });

    it('can deactivate and reactivate a venue; inactive venues remain editable', async () => {
      await patchVenue(ADMIN_FIXTURE.activeVenue, { isActive: false }).expect(200);
      expect(await prisma.diningVenue.count({ where: { isActive: true } })).toBe(1);
      const res = await patchVenue(ADMIN_FIXTURE.inactiveVenue, { isActive: true }).expect(200);
      expect(res.body.data.isActive).toBe(true);
      expect(
        await prisma.auditEvent.count({ where: { action: AuditActions.DINING_VENUE_UPDATED } }),
      ).toBe(2);
    });

    it('a request that changes nothing writes no audit row', async () => {
      await patchVenue(ADMIN_FIXTURE.activeVenue, { openHour: 10, isActive: true }).expect(200);
      expect(await prisma.auditEvent.count()).toBe(0);
    });

    it.each([
      ['openHour below 0', { openHour: -1 }],
      ['openHour above 23', { openHour: 24 }],
      ['closeHour above 24', { closeHour: 25 }],
      ['closeHour of 0', { closeHour: 0 }],
      ['close not after open', { openHour: 12, closeHour: 12 }],
      ['close before stored open', { closeHour: 9 }],
      ['open after stored close', { openHour: 22 }],
      ['fractional hour', { openHour: 9.5 }],
      ['negative deposit', { reservationDepositMinor: -1 }],
      ['fractional deposit', { reservationDepositMinor: 10.5 }],
      ['deposit above the cap', { reservationDepositMinor: 10_000_001 }],
      ['overlong description', { description: 'x'.repeat(1001) }],
    ])('rejects %s with 422 and leaves the venue unchanged', async (_name, body) => {
      const res = await patchVenue(ADMIN_FIXTURE.activeVenue, body).expect(422);
      expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
      const venue = await prisma.diningVenue.findUniqueOrThrow({
        where: { code: ADMIN_FIXTURE.activeVenue },
      });
      expect(venue).toMatchObject({
        openHour: 10,
        closeHour: 22,
        reservationDepositMinor: 20000,
        description: null,
      });
      expect(await prisma.auditEvent.count()).toBe(0);
    });

    it.each([
      ['wrong types', { openHour: '9' }],
      ['null for a required field', { isActive: null }],
      ['unknown field', { name: 'Renamed' }],
      ['client-supplied currency', { currency: 'USD' }],
    ])('rejects %s with 400', async (_name, body) => {
      await patchVenue(ADMIN_FIXTURE.activeVenue, body).expect(400);
    });

    it('unknown venue code is 404', async () => {
      await patchVenue('NOPE', { openHour: 9 }).expect(404);
    });
  });

  describe('PATCH /admin/dining/menu-items/:id', () => {
    it('updates the item, returns MenuItemDto and audits before/after', async () => {
      const res = await patchItem(fixture.availableItemId, {
        name: ' Prawn malai curry ',
        nameBn: 'চিংড়ি মালাই কারি',
        priceMinor: 42000,
        isAvailable: false,
        sortOrder: 5,
      }).expect(200);
      const item = res.body.data as AdminMenuItemDto;
      expect(item).toMatchObject({
        id: fixture.availableItemId,
        name: 'Prawn malai curry',
        nameBn: 'চিংড়ি মালাই কারি',
        priceMinor: 42000,
        currency: 'BDT',
        isAvailable: false,
        sortOrder: 5,
      });

      const event = await prisma.auditEvent.findFirstOrThrow({
        where: { action: AuditActions.MENU_ITEM_UPDATED },
      });
      expect(event).toMatchObject({
        entityType: 'menu_item',
        entityId: fixture.availableItemId,
        actorUserId: TEST_USERS.admin,
        details: {
          venueCode: ADMIN_FIXTURE.activeVenue,
          before: {
            name: 'Prawn curry',
            nameBn: null,
            priceMinor: 38000,
            isAvailable: true,
            sortOrder: 2,
          },
          after: {
            name: 'Prawn malai curry',
            nameBn: 'চিংড়ি মালাই কারি',
            priceMinor: 42000,
            isAvailable: false,
            sortOrder: 5,
          },
        },
      });
    });

    it('re-enabling an unavailable item shows it as available in the admin list', async () => {
      await patchItem(fixture.unavailableItemId, { isAvailable: true }).expect(200);
      const res = await http()
        .get(`${API}/admin/dining/venues`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      const item = (res.body.data as DiningAdminVenueDto[])
        .flatMap((venue) => venue.menu.flatMap((category) => category.items))
        .find((entry) => entry.id === fixture.unavailableItemId);
      expect(item?.isAvailable).toBe(true);
    });

    it('a price change never rewrites existing food orders (snapshots hold)', async () => {
      const before = await prisma.foodOrderItem.findMany({
        where: { menuItemId: fixture.orderedItemId },
        orderBy: { id: 'asc' },
      });
      const ordersBefore = await prisma.foodOrder.findMany({ orderBy: { id: 'asc' } });
      expect(before.length).toBeGreaterThan(0);

      await patchItem(fixture.orderedItemId, { priceMinor: 99000, name: 'Pomfret (large)' }).expect(
        200,
      );

      const after = await prisma.foodOrderItem.findMany({
        where: { menuItemId: fixture.orderedItemId },
        orderBy: { id: 'asc' },
      });
      expect(after).toEqual(before);
      expect(after.every((line) => line.unitPriceMinor === 45000)).toBe(true);
      expect(after.every((line) => line.itemName === 'Grilled pomfret')).toBe(true);
      expect(await prisma.foodOrder.findMany({ orderBy: { id: 'asc' } })).toEqual(ordersBefore);

      const overview = await http()
        .get(`${API}/admin/dining/overview?date=${today}`)
        .set(auth(TEST_USERS.admin))
        .expect(200);
      expect(overview.body.data.foodRevenueMinor).toBe(fixture.expected.foodRevenueMinor);
    });

    it.each([
      ['zero price', { priceMinor: 0 }],
      ['negative price', { priceMinor: -100 }],
      ['fractional price', { priceMinor: 100.5 }],
      ['price above the cap', { priceMinor: 10_000_001 }],
      ['empty name', { name: '   ' }],
      ['overlong name', { name: 'x'.repeat(121) }],
      ['overlong description', { description: 'x'.repeat(501) }],
      ['negative sort order', { sortOrder: -1 }],
    ])('rejects %s with 422 and leaves the item unchanged', async (_name, body) => {
      await patchItem(fixture.availableItemId, body).expect(422);
      const item = await prisma.menuItem.findUniqueOrThrow({
        where: { id: fixture.availableItemId },
      });
      expect(item).toMatchObject({ name: 'Prawn curry', priceMinor: 38000, sortOrder: 2 });
      expect(await prisma.auditEvent.count()).toBe(0);
    });

    it.each([
      ['string price', { priceMinor: '100' }],
      ['null name', { name: null }],
      ['client-supplied currency', { currency: 'USD' }],
      ['moving the item to another venue', { venueId: MISSING_ID }],
    ])('rejects %s with 400', async (_name, body) => {
      await patchItem(fixture.availableItemId, body).expect(400);
    });

    it('unknown or malformed id is 404', async () => {
      await patchItem(MISSING_ID, { priceMinor: 100 }).expect(404);
      await patchItem('not-a-uuid', { priceMinor: 100 }).expect(404);
    });
  });
});
