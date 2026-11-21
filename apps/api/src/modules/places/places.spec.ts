import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type {
  BeachPointSummary,
  DestinationDetailDto,
  DestinationSummaryDto,
  DiningVenueSummary,
  HotelSummaryDto,
  SpotDetailDto,
} from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_DESTINATION,
  TEST_SPOTS,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { reseedTestDatabase } from '../catalogue/testing/test-database';
import { resolveDestinationSlug, resolveSpotSlug } from './places.service';

const describeDb = testDbReady() ? describe : describe.skip;
const TIMEOUT = 30_000;
const API = '/api/v1';
const HIDDEN_DESTINATION = '40000000-0000-4000-8000-000000000002';
const HOUR = 60 * 60 * 1000;

describeDb('Places API', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    await prisma.destination.create({
      data: {
        id: HIDDEN_DESTINATION,
        slug: 'hidden-place',
        name: 'Hidden Place',
        tagline: 'Not public',
        latitude: 22,
        longitude: 91,
        isActive: false,
      },
    });
    await prisma.spot.create({
      data: {
        destinationId: TEST_DESTINATION,
        slug: 'closed-spot',
        name: 'Closed Spot',
        kind: 'OTHER',
        latitude: 21.4,
        longitude: 91.9,
        isActive: false,
      },
    });
    await prisma.emergencyContact.create({
      data: {
        destinationId: TEST_DESTINATION,
        label: 'National emergency',
        phone: '999',
        kind: 'NATIONAL',
      },
    });
    const now = Date.now();
    await prisma.spotAlert.createMany({
      data: [
        {
          destinationId: TEST_DESTINATION,
          kind: 'NOTICE',
          severity: 'INFO',
          title: 'Destination notice',
          startsAt: new Date(now - HOUR),
        },
        {
          destinationId: TEST_DESTINATION,
          spotId: TEST_SPOTS.kolatoli,
          kind: 'SEA',
          severity: 'CAUTION',
          title: 'Rough sea at Kolatoli',
          startsAt: new Date(now - HOUR),
          endsAt: new Date(now + HOUR),
        },
        {
          destinationId: TEST_DESTINATION,
          kind: 'EVENT',
          severity: 'DANGER',
          title: 'Expired alert',
          startsAt: new Date(now - 3 * HOUR),
          endsAt: new Date(now - HOUR),
        },
      ],
    });
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  it('lists only active destinations with service counts and the top active alert', async () => {
    const response = await request(app.getHttpServer()).get(`${API}/destinations`).expect(200);
    const data = response.body.data as DestinationSummaryDto[];

    expect(data.map((destination) => destination.slug)).toEqual(['coxs-bazar']);
    expect(data[0].spotCount).toBe(2);
    expect(data[0].services).toEqual({ stay: 10, food: 0, sunbeds: 2 });
    expect(data[0].topAlert?.title).toBe('Rough sea at Kolatoli');
  });

  it('returns a destination with spots, contacts and active alerts only', async () => {
    const response = await request(app.getHttpServer())
      .get(`${API}/destinations/coxs-bazar`)
      .expect(200);
    const data = response.body.data as DestinationDetailDto;

    expect(data.spots.map((spot) => spot.slug)).toEqual(['kolatoli', 'sugandha']);
    expect(data.spots[0].beachPointCode).toBe('KOL');
    expect(data.spots[0].services.stay).toBe(1);
    expect(data.emergencyContacts).toEqual([
      { label: 'National emergency', labelBn: null, phone: '999', kind: 'NATIONAL' },
    ]);
    expect(data.alerts.map((alert) => alert.title)).toEqual([
      'Rough sea at Kolatoli',
      'Destination notice',
    ]);
  });

  it('returns a spot hub with its own and destination-wide alerts', async () => {
    const kolatoli = await request(app.getHttpServer())
      .get(`${API}/destinations/coxs-bazar/spots/kolatoli`)
      .expect(200);
    const sugandha = await request(app.getHttpServer())
      .get(`${API}/destinations/coxs-bazar/spots/sugandha`)
      .expect(200);

    expect((kolatoli.body.data as SpotDetailDto).alerts).toHaveLength(2);
    expect((sugandha.body.data as SpotDetailDto).alerts.map((alert) => alert.title)).toEqual([
      'Destination notice',
    ]);
    expect((kolatoli.body.data as SpotDetailDto).destination.slug).toBe('coxs-bazar');
  });

  it('resolves destination and spot slug aliases', async () => {
    expect(resolveDestinationSlug('coxs')).toBe('coxs-bazar');
    expect(resolveDestinationSlug('coxs-bazar')).toBe('coxs-bazar');
    expect(resolveDestinationSlug('sylhet')).toBe('sylhet');

    expect(resolveSpotSlug('coxs-bazar', 'inani')).toBe('inani-coral-beach');
    expect(resolveSpotSlug('coxs-bazar', 'laboni')).toBe('laboni-beach');
    expect(resolveSpotSlug('coxs-bazar', 'sugandha')).toBe('sugandha-beach');
    expect(resolveSpotSlug('coxs-bazar', 'kolatoli')).toBe('kolatoli-beach');
    expect(resolveSpotSlug('coxs-bazar', 'teknaf')).toBe('teknaf-beach');
    expect(resolveSpotSlug('coxs-bazar', 'saintmartin')).toBe('inani-coral-beach');
    expect(resolveSpotSlug('coxs-bazar', 'marine')).toBe('himchari');

    expect(resolveSpotSlug('coxs', 'kolatoli')).toBe('kolatoli-beach');

    expect(resolveSpotSlug('rangamati', 'kaptai')).toBe('kaptai-lake');
    expect(resolveSpotSlug('rangamati', 'hanging')).toBe('hanging-bridge');
    expect(resolveSpotSlug('rangamati', 'rajban')).toBe('rajban-vihara');

    expect(resolveSpotSlug('coxs-bazar', 'unknown-spot')).toBe('unknown-spot');
  });

  it('resolves destination alias /destinations/coxs and spot aliases via API', async () => {
    const dest = await request(app.getHttpServer()).get(`${API}/destinations/coxs`).expect(200);
    expect((dest.body.data as DestinationDetailDto).slug).toBe('coxs-bazar');

    const spotViaDestAlias = await request(app.getHttpServer())
      .get(`${API}/destinations/coxs/spots/kolatoli`)
      .expect(200);
    expect((spotViaDestAlias.body.data as SpotDetailDto).slug).toBe('kolatoli');

    const saintmartin = await request(app.getHttpServer())
      .get(`${API}/destinations/coxs-bazar/spots/saintmartin`)
      .expect(200);
    expect(saintmartin.body.data).toBeDefined();

    const marine = await request(app.getHttpServer())
      .get(`${API}/destinations/coxs-bazar/spots/marine`)
      .expect(200);
    expect(marine.body.data).toBeDefined();
  });

  it('answers 404 for hidden or unknown places and malformed slugs', async () => {
    const server = app.getHttpServer();
    await request(server).get(`${API}/destinations/hidden-place`).expect(404);
    await request(server).get(`${API}/destinations/coxs-bazar/spots/closed-spot`).expect(404);
    await request(server).get(`${API}/destinations/nowhere`).expect(404);
    await request(server).get(`${API}/destinations/NOT_A_SLUG`).expect(404);
  });

  it('filters engines by destination and spot and reports their place', async () => {
    const server = app.getHttpServer();
    const points = (
      await request(server).get(`${API}/beach-points?destination=coxs-bazar`).expect(200)
    ).body.data as BeachPointSummary[];
    const none = (
      await request(server).get(`${API}/beach-points?destination=hidden-place`).expect(200)
    ).body.data as BeachPointSummary[];
    const hotels = (
      await request(server).get(`${API}/hotels?destination=coxs-bazar&spot=kolatoli`).expect(200)
    ).body.data as HotelSummaryDto[];
    const venues = (
      await request(server).get(`${API}/dining/venues?destination=hidden-place`).expect(200)
    ).body.data as DiningVenueSummary[];

    expect(points.map((point) => [point.code, point.spotSlug, point.destinationSlug])).toEqual([
      ['KOL', 'kolatoli', 'coxs-bazar'],
      ['SUG', 'sugandha', 'coxs-bazar'],
    ]);
    expect(none).toEqual([]);
    expect(hotels.map((hotel) => hotel.slug)).toEqual(['sayeman-beach-resort']);
    expect(hotels[0].spotSlug).toBe('kolatoli');
    expect(venues).toEqual([]);
  });

  it('hides a destination and everything in it when it is deactivated', async () => {
    await prisma.destination.update({ where: { id: TEST_DESTINATION }, data: { isActive: false } });
    const server = app.getHttpServer();

    expect((await request(server).get(`${API}/destinations`).expect(200)).body.data).toEqual([]);
    expect((await request(server).get(`${API}/beach-points`).expect(200)).body.data).toEqual([]);
    expect((await request(server).get(`${API}/hotels`).expect(200)).body.data).toEqual([]);
  });
});
