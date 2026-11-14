import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import type { OrderDto, PaymentDto, PaymentMethodDto } from '@coastline/api-contracts';
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
const API = '/api/v1';
const TIMEOUT = 30_000;

function dayKey(offset: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** Every field a payment may expose; anything else (a credential above all) is a leak. */
const PAYMENT_FIELDS = [
  'amountMinor',
  'createdAt',
  'currency',
  'externalRef',
  'id',
  'method',
  'provider',
  'status',
  'type',
].sort();

describeDb('payments (sandbox adapter)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  const http = () => request(app.getHttpServer());
  const startsAt = () => dhakaHourToUtc(dayKey(1), 10).toISOString();
  const book = (body: Record<string, unknown>) =>
    http()
      .post(`${API}/orders`)
      .set(auth(TEST_USERS.tourist))
      .send({ items: [{ sunbedId: TEST_BEDS.kol001, startsAt: startsAt(), hours: 2 }], ...body });

  it('GET /payments/methods lists the checkout methods without signing in', async () => {
    const res = await http().get(`${API}/payments/methods`).expect(200);
    expect(res.body).toEqual({
      data: [
        { code: 'BKASH', label: 'bKash' },
        { code: 'NAGAD', label: 'Nagad' },
        { code: 'CARD', label: 'Card' },
      ] satisfies PaymentMethodDto[],
    });
  });

  it.each(['BKASH', 'NAGAD', 'CARD'] as const)(
    'records a %s charge with the server-chosen provider',
    async (method) => {
      const order = (await book({ paymentMethod: method }).expect(201)).body.data as OrderDto;
      expect(order.payments).toHaveLength(1);
      const payment = order.payments[0];
      expect(payment).toMatchObject({
        type: 'CHARGE',
        provider: 'SANDBOX',
        method,
        status: 'SUCCEEDED',
        amountMinor: order.totalMinor,
        externalRef: `SBX-${order.publicRef}`,
      });
      expect(Object.keys(payment).sort()).toEqual(PAYMENT_FIELDS);

      const row = await prisma.payment.findFirstOrThrow({ where: { orderId: order.id } });
      expect(row).toMatchObject({ provider: 'SANDBOX', method, status: 'SUCCEEDED' });
    },
  );

  it('accepts the legacy value MOCK and an absent method, storing method null', async () => {
    const legacy = (await book({ paymentMethod: 'MOCK' }).expect(201)).body.data as OrderDto;
    expect(legacy.payments[0]).toMatchObject({ provider: 'SANDBOX', method: null });

    await prisma.bookingSlot.updateMany({ data: { isActive: false } });
    const absent = (await book({}).expect(201)).body.data as OrderDto;
    expect(absent.payments[0]).toMatchObject({ provider: 'SANDBOX', method: null });
  });

  it('rejects an unknown method, a client-chosen provider and any credential field with 400', async () => {
    await book({ paymentMethod: 'PAYPAL' }).expect(400);
    await book({ paymentMethod: 'BKASH', provider: 'SANDBOX' }).expect(400);
    for (const field of ['cardNumber', 'cvv', 'pin', 'otp']) {
      await book({ paymentMethod: 'CARD', [field]: '4111111111111111' }).expect(400);
    }
    expect(await prisma.order.count()).toBe(0);
    expect(await prisma.payment.count()).toBe(0);
  });

  it('refunds by reversal to the charged method on cancellation', async () => {
    const order = (await book({ paymentMethod: 'NAGAD' }).expect(201)).body.data as OrderDto;
    const cancelled = (
      await http()
        .post(`${API}/orders/${order.publicRef}/cancel`)
        .set(auth(TEST_USERS.tourist))
        .send({})
        .expect(201)
    ).body.data as OrderDto;

    const refund = cancelled.payments.find((p: PaymentDto) => p.type === 'REFUND');
    expect(refund).toMatchObject({
      provider: 'SANDBOX',
      method: 'NAGAD',
      status: 'SUCCEEDED',
      amountMinor: order.totalMinor,
    });
    expect(refund?.externalRef).toMatch(new RegExp(`^SBX-REFUND-${order.publicRef}-\\d+$`));
    // The original charge is never edited.
    expect(cancelled.payments.find((p) => p.type === 'CHARGE')).toEqual(order.payments[0]);
  });
});
