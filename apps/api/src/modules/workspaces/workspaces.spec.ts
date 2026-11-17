import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type {
  AdminFoodOrderDto,
  AdminOrderListDto,
  AdminReservationDto,
  DeskLookupDto,
  DiningAdminVenueDto,
  SessionUser,
} from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_BEDS,
  TEST_DESTINATION,
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { reseedTestDatabase } from '../catalogue/testing/test-database';
import { HOUR_MS, dhakaDateKey, dhakaHourToUtc } from '../../common/time/dhaka';

const describeDb = testDbReady() ? describe : describe.skip;
const TIMEOUT = 30_000;
const API = '/api/v1';

const OTHER_DESTINATION = '40000000-0000-4000-8000-000000000009';
const USERS = {
  owner: '00000000-0000-4000-8000-0000000000a1',
  staff: '00000000-0000-4000-8000-0000000000a2',
  otherOwner: '00000000-0000-4000-8000-0000000000a3',
  desk: '00000000-0000-4000-8000-0000000000a4',
  otherDesk: '00000000-0000-4000-8000-0000000000a5',
};
const PROVIDER_A = '50000000-0000-4000-8000-0000000000a1';
const PROVIDER_B = '50000000-0000-4000-8000-0000000000a2';
const VENUE_A = '60000000-0000-4000-8000-0000000000a1';
const VENUE_B = '60000000-0000-4000-8000-0000000000a2';
const ITEM_A = '61000000-0000-4000-8000-0000000000a1';

describeDb('provider and desk workspaces', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tomorrow = new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    await prisma.destination.create({
      data: {
        id: OTHER_DESTINATION,
        slug: 'elsewhere',
        name: 'Elsewhere',
        tagline: 't',
        latitude: 24,
        longitude: 91,
      },
    });
    await prisma.user.createMany({
      data: [
        { id: USERS.owner, name: 'Owner', role: 'PROVIDER' },
        { id: USERS.staff, name: 'Staff', role: 'PROVIDER' },
        { id: USERS.otherOwner, name: 'Other Owner', role: 'PROVIDER' },
        { id: USERS.desk, name: 'Desk', role: 'DESK' },
        { id: USERS.otherDesk, name: 'Other Desk', role: 'DESK' },
      ],
    });
    await prisma.provider.createMany({
      data: [
        { id: PROVIDER_A, name: 'Provider A', destinationId: TEST_DESTINATION },
        { id: PROVIDER_B, name: 'Provider B', destinationId: TEST_DESTINATION },
      ],
    });
    await prisma.providerMember.createMany({
      data: [
        { providerId: PROVIDER_A, userId: USERS.owner, role: 'OWNER' },
        { providerId: PROVIDER_A, userId: USERS.staff, role: 'STAFF' },
        { providerId: PROVIDER_B, userId: USERS.otherOwner, role: 'OWNER' },
      ],
    });
    await prisma.deskAssignment.createMany({
      data: [
        { userId: USERS.desk, destinationId: TEST_DESTINATION },
        { userId: USERS.otherDesk, destinationId: OTHER_DESTINATION },
      ],
    });
    for (const [id, code, providerId] of [
      [VENUE_A, 'WS-A', PROVIDER_A],
      [VENUE_B, 'WS-B', PROVIDER_B],
    ] as const) {
      await prisma.diningVenue.create({
        data: {
          id,
          code,
          name: `Venue ${code}`,
          kind: 'RESTAURANT',
          destinationId: TEST_DESTINATION,
          providerId,
          openHour: 0,
          closeHour: 24,
          reservationsEnabled: true,
        },
      });
    }
    const category = await prisma.menuCategory.create({
      data: { venueId: VENUE_A, name: 'Mains' },
    });
    await prisma.menuItem.create({
      data: {
        id: ITEM_A,
        venueId: VENUE_A,
        categoryId: category.id,
        name: 'Rice',
        priceMinor: 5000,
      },
    });
    const table = await prisma.diningTable.create({
      data: { venueId: VENUE_B, code: 'WS-B-T1', seats: 4 },
    });
    const startAt = dhakaHourToUtc(tomorrow, 12);
    await prisma.tableReservation.create({
      data: {
        publicRef: 'RS-WSB-0001',
        touristId: TEST_USERS.tourist,
        venueId: VENUE_B,
        tableId: table.id,
        venueCode: 'WS-B',
        venueName: 'Venue WS-B',
        tableCode: 'WS-B-T1',
        partySize: 2,
        startAt,
        endAt: new Date(startAt.getTime() + HOUR_MS),
      },
    });
    const bedStart = dhakaHourToUtc(tomorrow, 10);
    await prisma.order.create({
      data: {
        publicRef: 'BK-WSDESK-0001',
        touristId: TEST_USERS.tourist,
        subtotalMinor: 10000,
        totalMinor: 10000,
        items: {
          create: {
            sunbedId: TEST_BEDS.kol001,
            beachPointCode: 'KOL',
            beachPointName: 'Kolatoli',
            sunbedCode: 'KOL-001',
            startAt: bedStart,
            endAt: new Date(bedStart.getTime() + HOUR_MS),
            unitPriceMinor: 10000,
            totalMinor: 10000,
          },
        },
      },
    });
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  it('refuses provider, desk and admin routes to a tourist', async () => {
    const server = app.getHttpServer();
    const tourist = auth(TEST_USERS.tourist);
    await request(server).get(`${API}/provider/venues`).set(tourist).expect(403);
    await request(server).get(`${API}/desk/arrivals`).set(tourist).expect(403);
    await request(server).get(`${API}/admin/overview`).set(tourist).expect(403);
    await request(server).get(`${API}/admin/overview`).set(auth(USERS.owner)).expect(403);
    await request(server).get(`${API}/provider/venues`).set(auth(USERS.desk)).expect(403);
  });

  it('reports memberships and desk destinations in the session', async () => {
    const server = app.getHttpServer();
    const owner = (await request(server).get(`${API}/session`).set(auth(USERS.owner)).expect(200))
      .body.data as SessionUser;
    const desk = (await request(server).get(`${API}/session`).set(auth(USERS.desk)).expect(200))
      .body.data as SessionUser;
    expect(owner.providers).toEqual([
      { providerId: PROVIDER_A, name: 'Provider A', role: 'OWNER' },
    ]);
    expect(desk.deskDestinations).toEqual(['coxs-bazar']);
  });

  it('shows a provider only their own venues and bookings', async () => {
    const server = app.getHttpServer();
    const venues = (
      await request(server).get(`${API}/provider/venues`).set(auth(USERS.owner)).expect(200)
    ).body.data as DiningAdminVenueDto[];
    const reservations = (
      await request(server)
        .get(`${API}/provider/reservations?date=${tomorrow}`)
        .set(auth(USERS.owner))
        .expect(200)
    ).body.data as AdminReservationDto[];
    const theirs = (
      await request(server)
        .get(`${API}/provider/reservations?date=${tomorrow}`)
        .set(auth(USERS.otherOwner))
        .expect(200)
    ).body.data as AdminReservationDto[];
    const kitchen = (
      await request(server).get(`${API}/provider/food-orders`).set(auth(USERS.owner)).expect(200)
    ).body.data as AdminFoodOrderDto[];

    expect(venues.map((venue) => venue.code)).toEqual(['WS-A']);
    expect(reservations).toEqual([]);
    expect(theirs.map((item) => item.publicRef)).toEqual(['RS-WSB-0001']);
    expect(kitchen).toEqual([]);
  });

  it('answers 404 for another provider’s records', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`${API}/provider/reservations/RS-WSB-0001/check-in`)
      .set(auth(USERS.owner))
      .expect(404);
    await request(server)
      .patch(`${API}/provider/venues/WS-B`)
      .set(auth(USERS.owner))
      .send({ openHour: 9 })
      .expect(404);
    await request(server)
      .patch(`${API}/provider/menu-items/${ITEM_A}`)
      .set(auth(USERS.otherOwner))
      .send({ isAvailable: false })
      .expect(404);
  });

  it('lets staff mark items sold out but not change prices or settings', async () => {
    const server = app.getHttpServer();
    const staff = auth(USERS.staff);
    await request(server)
      .patch(`${API}/provider/menu-items/${ITEM_A}`)
      .set(staff)
      .send({ isAvailable: false })
      .expect(200);
    await request(server)
      .patch(`${API}/provider/menu-items/${ITEM_A}`)
      .set(staff)
      .send({ priceMinor: 100 })
      .expect(403);
    await request(server)
      .patch(`${API}/provider/venues/WS-A`)
      .set(staff)
      .send({ openHour: 9 })
      .expect(403);
    await request(server)
      .patch(`${API}/provider/menu-items/${ITEM_A}`)
      .set(auth(USERS.owner))
      .send({ priceMinor: 6000 })
      .expect(200);

    const item = await prisma.menuItem.findUniqueOrThrow({ where: { id: ITEM_A } });
    expect(item).toMatchObject({ isAvailable: false, priceMinor: 6000 });
  });

  it('keeps desk staff inside their destination', async () => {
    const server = app.getHttpServer();
    const found = (
      await request(server)
        .post(`${API}/desk/lookup`)
        .set(auth(USERS.desk))
        .send({ query: 'bk-wsdesk-0001' })
        .expect(201)
    ).body.data as DeskLookupDto;
    expect(found.kind).toBe('order');

    await request(server)
      .post(`${API}/desk/lookup`)
      .set(auth(USERS.otherDesk))
      .send({ query: 'BK-WSDESK-0001' })
      .expect(404);
    await request(server)
      .post(`${API}/desk/bookings/BK-WSDESK-0001/check-in`)
      .set(auth(USERS.otherDesk))
      .expect(404);

    const arrivals = (
      await request(server)
        .get(`${API}/desk/arrivals?date=${tomorrow}`)
        .set(auth(USERS.otherDesk))
        .expect(200)
    ).body.data as AdminOrderListDto;
    const own = (
      await request(server)
        .get(`${API}/desk/arrivals?date=${tomorrow}`)
        .set(auth(USERS.desk))
        .expect(200)
    ).body.data as AdminOrderListDto;
    expect(arrivals.orders).toEqual([]);
    expect(own.orders.map((order) => order.publicRef)).toContain('BK-WSDESK-0001');
  });

  it('rejects a tampered ticket at the desk', async () => {
    await request(app.getHttpServer())
      .post(`${API}/desk/lookup`)
      .set(auth(USERS.desk))
      .send({ query: 'COASTLINE:BK-WSDESK-0001:forged' })
      .expect(422);
  });
});
