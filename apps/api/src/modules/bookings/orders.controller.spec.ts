import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type { AdminOrderDto, OrderDto } from '@coastline/api-contracts';
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

const describeDb = testDbReady() ? describe : describe.skip;
const TEST_TIMEOUT = 30_000;
const API = '/api/v1';

function dayKey(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

describeDb('orders API', () => {
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
    'allows a tourist to place a booking and creates confirmed order with ticket',
    async () => {
      const tomorrow = dayKey(1);
      const startsAt = dhakaHourToUtc(tomorrow, 10).toISOString();

      const response = await request(app.getHttpServer())
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send({
          items: [
            { sunbedId: TEST_BEDS.kol001, startsAt, hours: 2 },
            { sunbedId: TEST_BEDS.kol002, startsAt, hours: 2 },
          ],
          paymentMethod: 'MOCK',
        })
        .expect(201);

      const order = response.body.data as OrderDto;
      expect(order.status).toBe('CONFIRMED');
      expect(order.publicRef).toMatch(/^BK-\d{8}-[A-F0-9]{4}$/);
      expect(order.items).toHaveLength(2);
      expect(order.totalMinor).toBe(40_000); // 2 beds * 2 hours * 10,000
      expect(order.payments).toHaveLength(1);
      expect(order.payments[0].type).toBe('CHARGE');
      expect(order.ticket).not.toBeNull();
      expect(order.ticket?.payload).toContain(`COASTLINE:${order.publicRef}:`);

      // Verify booking slots in database
      const slots = await prisma.bookingSlot.findMany({
        where: { orderItem: { orderId: order.id } },
      });
      expect(slots).toHaveLength(4); // 2 beds * 2 slots
      expect(slots.every((s) => s.isActive)).toBe(true);
    },
    TEST_TIMEOUT,
  );

  it(
    'prevents double-booking and returns 409 conflict when a bed is already held',
    async () => {
      const tomorrow = dayKey(1);
      const startsAt = dhakaHourToUtc(tomorrow, 10).toISOString();

      // First booking
      await request(app.getHttpServer())
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send({
          items: [{ sunbedId: TEST_BEDS.kol001, startsAt, hours: 1 }],
          paymentMethod: 'MOCK',
        })
        .expect(201);

      // Second booking on the same bed and hour
      const conflictRes = await request(app.getHttpServer())
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send({
          items: [{ sunbedId: TEST_BEDS.kol001, startsAt, hours: 1 }],
          paymentMethod: 'MOCK',
        })
        .expect(409);

      expect(conflictRes.body.error.code).toBe('CONFLICT');
      expect(conflictRes.body.error.details.conflicts).toHaveLength(1);
      expect(conflictRes.body.error.details.conflicts[0].sunbedCode).toBe('KOL-001');
    },
    TEST_TIMEOUT,
  );

  it(
    'allows tourist to cancel an upcoming booking and frees the slots',
    async () => {
      const tomorrow = dayKey(1);
      const startsAt = dhakaHourToUtc(tomorrow, 12).toISOString();

      const created = await request(app.getHttpServer())
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send({
          items: [{ sunbedId: TEST_BEDS.kol001, startsAt, hours: 1 }],
        })
        .expect(201);

      const ref = (created.body.data as OrderDto).publicRef;

      const cancelled = await request(app.getHttpServer())
        .post(`${API}/orders/${ref}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({ reason: 'Trip rescheduled' })
        .expect(201);

      const order = cancelled.body.data as OrderDto;
      expect(order.status).toBe('CANCELLED');
      expect(order.cancelReason).toBe('Trip rescheduled');
      expect(order.ticket).toBeNull();
      expect(order.payments).toHaveLength(2); // 1 charge + 1 refund

      // Verify slots are deactivated
      const slots = await prisma.bookingSlot.findMany({
        where: { orderItem: { orderId: order.id } },
      });
      expect(slots.every((s) => !s.isActive)).toBe(true);

      // Another visitor can now book the same slot!
      await request(app.getHttpServer())
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send({
          items: [{ sunbedId: TEST_BEDS.kol001, startsAt, hours: 1 }],
        })
        .expect(201);
    },
    TEST_TIMEOUT,
  );

  it(
    'validates tickets and checks in guests via admin endpoints',
    async () => {
      const tomorrow = dayKey(1);
      const startsAt = dhakaHourToUtc(tomorrow, 11).toISOString();

      const created = await request(app.getHttpServer())
        .post(`${API}/orders`)
        .set(auth(TEST_USERS.tourist))
        .send({
          items: [{ sunbedId: TEST_BEDS.kol001, startsAt, hours: 1 }],
        })
        .expect(201);

      const order = created.body.data as OrderDto;
      const ticketPayload = order.ticket?.payload!;

      // Validate ticket as admin
      const validated = await request(app.getHttpServer())
        .post(`${API}/admin/tickets/validate`)
        .set(auth(TEST_USERS.admin))
        .send({ payload: ticketPayload })
        .expect(201);

      expect((validated.body.data as AdminOrderDto).publicRef).toBe(order.publicRef);

      // Check-in as admin
      const checkedIn = await request(app.getHttpServer())
        .post(`${API}/admin/orders/${order.publicRef}/check-in`)
        .set(auth(TEST_USERS.admin))
        .send({})
        .expect(201);

      const checkedOrder = checkedIn.body.data as AdminOrderDto;
      expect(checkedOrder.items[0].status).toBe('CHECKED_IN');
      expect(checkedOrder.items[0].checkedInAt).not.toBeNull();
    },
    TEST_TIMEOUT,
  );
});
