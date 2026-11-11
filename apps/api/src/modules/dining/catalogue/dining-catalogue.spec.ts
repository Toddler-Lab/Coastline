import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../../catalogue/testing/test-bootstrap';
import type { DiningVenueDetail, DiningVenueSummary } from '@coastline/api-contracts';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../../common/testing/integration-fixture';
import { reseedTestDatabase } from '../../catalogue/testing/test-database';
import { CATALOGUE_VENUES, seedDiningCatalogue } from './testing/catalogue-fixture';

const describeDb = testDbReady() ? describe : describe.skip;
const TIMEOUT = 30_000;
const API = '/api/v1';

describeDb('dining catalogue API', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
    await seedDiningCatalogue(prisma);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  async function list(query = ''): Promise<DiningVenueSummary[]> {
    const res = await request(app.getHttpServer()).get(`${API}/dining/venues${query}`).expect(200);
    return res.body.data as DiningVenueSummary[];
  }

  describe('GET /dining/venues', () => {
    it('lists active venues anonymously, ordered by sort order then name', async () => {
      const venues = await list();
      expect(venues.map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.sugGrill,
        CATALOGUE_VENUES.kolStall,
        CATALOGUE_VENUES.aTown,
        CATALOGUE_VENUES.bTown,
      ]);
      expect(venues.some((v) => v.code === CATALOGUE_VENUES.hidden)).toBe(false);
    });

    it('serializes the summary shape with beach point labels', async () => {
      const venues = await list();
      const grill = venues.find((v) => v.code === CATALOGUE_VENUES.sugGrill)!;
      expect(grill).toMatchObject({
        name: 'Test Sugandha Grill',
        nameBn: 'টেস্ট সুগন্ধা গ্রিল',
        kind: 'SEAFOOD_KITCHEN',
        cuisineTags: ['Seafood', 'Grill'],
        beachPointCode: 'SUG',
        beachPointName: 'Sugandha',
        openHour: 11,
        closeHour: 22,
        reservationsEnabled: true,
        deliveryEnabled: true,
        currency: 'BDT',
      });
      expect(grill).not.toHaveProperty('menu');
      expect(grill).not.toHaveProperty('vendorUserId');
      expect(grill).not.toHaveProperty('isActive');

      const town = venues.find((v) => v.code === CATALOGUE_VENUES.aTown)!;
      expect(town.beachPointCode).toBeNull();
      expect(town.beachPointName).toBeNull();
    });

    it('computes priceFromMinor from the cheapest available item only', async () => {
      const venues = await list();
      const byCode = new Map(venues.map((v) => [v.code, v]));
      // 3000 Crab Masala is unavailable, so the cheapest is 4000.
      expect(byCode.get(CATALOGUE_VENUES.sugGrill)?.priceFromMinor).toBe(4000);
      // 1500 Sold-out Muri is unavailable.
      expect(byCode.get(CATALOGUE_VENUES.kolStall)?.priceFromMinor).toBe(2000);
      expect(byCode.get(CATALOGUE_VENUES.bTown)?.priceFromMinor).toBeNull();
    });

    it('filters by kind', async () => {
      expect((await list('?kind=RESTAURANT')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.aTown,
        CATALOGUE_VENUES.bTown,
      ]);
      expect((await list('?kind=BEACH_STALL')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.kolStall,
      ]);
    });

    it('filters by beach point code, case-insensitively, and returns [] for an unknown point', async () => {
      expect((await list('?beachPointCode=SUG')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.sugGrill,
      ]);
      expect((await list('?beachPointCode=kol')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.kolStall,
      ]);
      expect(await list('?beachPointCode=NOPE')).toEqual([]);
    });

    it('filters by reservable and delivers', async () => {
      expect((await list('?reservable=true')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.sugGrill,
        CATALOGUE_VENUES.bTown,
      ]);
      expect((await list('?reservable=false')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.kolStall,
        CATALOGUE_VENUES.aTown,
      ]);
      expect((await list('?delivers=true')).map((v) => v.code)).toEqual([
        CATALOGUE_VENUES.sugGrill,
        CATALOGUE_VENUES.kolStall,
      ]);
      expect(
        (await list('?delivers=true&reservable=true&beachPointCode=SUG')).map((v) => v.code),
      ).toEqual([CATALOGUE_VENUES.sugGrill]);
    });

    it('rejects an unknown kind with 422', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API}/dining/venues?kind=FOOD_TRUCK`)
        .expect(422);
      expect(res.body.error.code).toBe('UNPROCESSABLE_ENTITY');
    });

    it.each(['yes', '1', 'TRUE', ''])('rejects reservable=%j with 422', async (value) => {
      await request(app.getHttpServer())
        .get(`${API}/dining/venues?reservable=${value}`)
        .expect(422);
    });

    it.each(['no', '0'])('rejects delivers=%j with 422', async (value) => {
      await request(app.getHttpServer()).get(`${API}/dining/venues?delivers=${value}`).expect(422);
    });

    it('rejects a malformed beach point code with 422', async () => {
      await request(app.getHttpServer())
        .get(`${API}/dining/venues?beachPointCode=${encodeURIComponent('SUG;DROP')}`)
        .expect(422);
    });

    it('rejects unknown query keys with 400', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API}/dining/venues?includeInactive=true`)
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns the same catalogue for tourist and admin personas', async () => {
      const anonymous = await list();
      for (const userId of [TEST_USERS.tourist, TEST_USERS.admin]) {
        const res = await request(app.getHttpServer())
          .get(`${API}/dining/venues`)
          .set(auth(userId))
          .expect(200);
        expect((res.body.data as DiningVenueSummary[]).map((v) => v.code)).toEqual(
          anonymous.map((v) => v.code),
        );
      }
    });
  });

  describe('GET /dining/venues/:code', () => {
    it('returns the venue detail with menu categories and items in sort order', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API}/dining/venues/${CATALOGUE_VENUES.sugGrill}`)
        .expect(200);
      const venue = res.body.data as DiningVenueDetail;

      expect(venue).toMatchObject({
        code: CATALOGUE_VENUES.sugGrill,
        address: 'Sugandha road (test)',
        contactPhone: '+880 1700 000099',
        reservationDepositMinor: 10000,
        priceFromMinor: 4000,
        beachPointCode: 'SUG',
      });
      expect(venue.menu.map((c) => c.name)).toEqual(['Grill', 'Drinks']);
      expect(venue.menu[0].sortOrder).toBe(1);

      const grill = venue.menu[0];
      expect(grill.items.map((i) => i.name)).toEqual([
        'Pomfret Grill',
        'Loitta Fry',
        'Crab Masala',
      ]);
      expect(grill.items[0]).toEqual({
        id: expect.any(String),
        categoryId: grill.id,
        name: 'Pomfret Grill',
        nameBn: 'রূপচাঁদা গ্রিল',
        description: 'Whole fish, charcoal grilled.',
        priceMinor: 65000,
        currency: 'BDT',
        isAvailable: true,
        imageUrl: null,
      });
    });

    it('includes unavailable items flagged isAvailable:false', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API}/dining/venues/${CATALOGUE_VENUES.sugGrill}`)
        .expect(200);
      const venue = res.body.data as DiningVenueDetail;
      const crab = venue.menu.flatMap((c) => c.items).find((i) => i.name === 'Crab Masala');
      expect(crab?.isAvailable).toBe(false);
      expect(crab?.priceMinor).toBe(3000);
    });

    it('returns an empty menu and null priceFrom for a venue without items', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API}/dining/venues/${CATALOGUE_VENUES.bTown}`)
        .expect(200);
      const venue = res.body.data as DiningVenueDetail;
      expect(venue.menu).toEqual([]);
      expect(venue.priceFromMinor).toBeNull();
      expect(venue.reservationDepositMinor).toBe(0);
    });

    it('accepts a lower-case venue code', async () => {
      await request(app.getHttpServer())
        .get(`${API}/dining/venues/${CATALOGUE_VENUES.kolStall.toLowerCase()}`)
        .expect(200);
    });

    it('returns 404 for an inactive venue', async () => {
      const res = await request(app.getHttpServer())
        .get(`${API}/dining/venues/${CATALOGUE_VENUES.hidden}`)
        .expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 for an unknown or malformed code', async () => {
      await request(app.getHttpServer()).get(`${API}/dining/venues/NO-SUCH-VENUE`).expect(404);
      await request(app.getHttpServer())
        .get(`${API}/dining/venues/${encodeURIComponent('bad code!')}`)
        .expect(404);
    });

    it('hides a venue as soon as it is deactivated', async () => {
      await prisma.diningVenue.update({
        where: { code: CATALOGUE_VENUES.kolStall },
        data: { isActive: false },
      });
      await request(app.getHttpServer())
        .get(`${API}/dining/venues/${CATALOGUE_VENUES.kolStall}`)
        .expect(404);
      expect((await list()).some((v) => v.code === CATALOGUE_VENUES.kolStall)).toBe(false);
    });
  });
});
