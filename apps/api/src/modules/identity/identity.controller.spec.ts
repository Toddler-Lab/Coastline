import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// Must load before the fixture pulls in AppModule; see the module comment.
import '../catalogue/testing/test-bootstrap';
import type { SessionUser } from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TEST_USERS,
  auth,
  createTestApp,
  testDbReady,
} from '../../common/testing/integration-fixture';
import { reseedTestDatabase } from '../catalogue/testing/test-database';

const describeDb = testDbReady() ? describe : describe.skip;
const TEST_TIMEOUT = 30_000;
const API = '/api/v1';

describeDb(
  'identity API',
  () => {
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

    it(
      'returns the resident actor and its database role',
      async () => {
        const tourist = await request(app.getHttpServer())
          .get(`${API}/session`)
          .set(auth(TEST_USERS.tourist))
          .expect(200);

        expect(tourist.body.data as SessionUser).toEqual({
          id: TEST_USERS.tourist,
          name: 'Test Tourist',
          email: 'tourist@test.example',
          role: 'TOURIST',
        });

        const admin = await request(app.getHttpServer())
          .get(`${API}/session`)
          .set(auth(TEST_USERS.admin))
          .expect(200);

        expect((admin.body.data as SessionUser).role).toBe('ADMIN');
      },
      TEST_TIMEOUT,
    );

    it(
      'never takes the role from client input',
      async () => {
        const response = await request(app.getHttpServer())
          .get(`${API}/session`)
          .set(auth(TEST_USERS.tourist))
          .set('x-demo-role', 'ADMIN')
          .set('x-role', 'ADMIN')
          .expect(200);

        expect((response.body.data as SessionUser).role).toBe('TOURIST');
      },
      TEST_TIMEOUT,
    );

    it(
      'rejects anonymous and unknown callers',
      async () => {
        const anonymous = await request(app.getHttpServer()).get(`${API}/session`).expect(401);
        expect(anonymous.body.error.code).toBe('UNAUTHENTICATED');

        await request(app.getHttpServer())
          .get(`${API}/session`)
          .set(auth('ffffffff-ffff-4fff-8fff-ffffffffffff'))
          .expect(401);

        await request(app.getHttpServer())
          .get(`${API}/session`)
          .set(auth('not-a-uuid'))
          .expect(401);
      },
      TEST_TIMEOUT,
    );

    it(
      'lists the active demo personas for the role switcher',
      async () => {
        const response = await request(app.getHttpServer()).get(`${API}/demo/users`).expect(200);

        const users = response.body.data as SessionUser[];
        const byId = new Map(users.map((user) => [user.id, user]));

        expect(users).toHaveLength(3);
        expect(byId.get(TEST_USERS.admin)?.role).toBe('ADMIN');
        expect(byId.get(TEST_USERS.tourist)?.role).toBe('TOURIST');
        expect(byId.get(TEST_USERS.otherTourist)?.role).toBe('TOURIST');
        expect([...byId.values()].every((user) => user.email !== null)).toBe(true);
      },
      TEST_TIMEOUT,
    );
  },
  TEST_TIMEOUT,
);
