import { describe, expect, it, vi } from 'vitest';
import { ErrorCode, PAYMENT_FAILED_MESSAGE } from '@coastline/api-contracts';
import { HttpException } from '@nestjs/common';
import { createPaymentProvider } from './payments.module';
import { PaymentsService, resolvePaymentMethod } from './payments.service';
import { SandboxPaymentProvider } from './sandbox-payment.provider';
import { DecliningPaymentProvider } from './testing/declining-payment.provider';

const request = {
  amountMinor: 20000,
  currency: 'BDT',
  method: 'BKASH' as const,
  reference: 'BK-20261114-AB12',
  idempotencyKey: 'charge:BK-20261114-AB12',
};

describe('SandboxPaymentProvider', () => {
  const provider = new SandboxPaymentProvider();

  it('approves a charge immediately with an SBX- reference', async () => {
    await expect(provider.charge(request)).resolves.toEqual({
      status: 'SUCCEEDED',
      externalRef: 'SBX-BK-20261114-AB12',
    });
  });

  it('approves a refund immediately with an SBX-REFUND- reference', async () => {
    await expect(provider.refund(request)).resolves.toEqual({
      status: 'SUCCEEDED',
      externalRef: 'SBX-REFUND-BK-20261114-AB12',
    });
  });

  it('returns the same result for a retried request', async () => {
    expect(await provider.charge(request)).toEqual(await provider.charge(request));
  });

  it('records itself as SANDBOX', () => {
    expect(provider.name).toBe('SANDBOX');
  });
});

describe('createPaymentProvider', () => {
  it('builds the sandbox adapter by default and by name', () => {
    expect(createPaymentProvider(undefined)).toBeInstanceOf(SandboxPaymentProvider);
    expect(createPaymentProvider('sandbox')).toBeInstanceOf(SandboxPaymentProvider);
    expect(createPaymentProvider(' Sandbox ')).toBeInstanceOf(SandboxPaymentProvider);
  });

  it('refuses an unknown provider', () => {
    expect(() => createPaymentProvider('stripe')).toThrow(/Unknown PAYMENT_PROVIDER/);
  });
});

describe('resolvePaymentMethod', () => {
  it('keeps real methods and maps the legacy forms to null', () => {
    expect(resolvePaymentMethod('BKASH')).toBe('BKASH');
    expect(resolvePaymentMethod('NAGAD')).toBe('NAGAD');
    expect(resolvePaymentMethod('CARD')).toBe('CARD');
    expect(resolvePaymentMethod('MOCK')).toBeNull();
    expect(resolvePaymentMethod(undefined)).toBeNull();
  });
});

describe('PaymentsService', () => {
  const tx = () => ({
    payment: {
      create: vi.fn(async ({ data }) => ({ id: 'pay-1', ...data })),
      findFirst: vi.fn(async () => ({ method: 'NAGAD' })),
    },
  });

  it('records an approved charge with the provider, method and reference', async () => {
    const client = tx();
    const service = new PaymentsService(new SandboxPaymentProvider());
    const row = await service.charge(client as never, {
      target: { orderId: 'order-1' },
      amountMinor: 20000,
      currency: 'BDT',
      method: 'CARD',
      reference: 'BK-1',
    });
    expect(client.payment.create).toHaveBeenCalledWith({
      data: {
        orderId: 'order-1',
        type: 'CHARGE',
        provider: 'SANDBOX',
        method: 'CARD',
        status: 'SUCCEEDED',
        amountMinor: 20000,
        currency: 'BDT',
        externalRef: 'SBX-BK-1',
      },
    });
    expect(row).toMatchObject({ provider: 'SANDBOX', externalRef: 'SBX-BK-1' });
  });

  it('refunds to the method of the latest charge', async () => {
    const client = tx();
    const service = new PaymentsService(new SandboxPaymentProvider());
    await service.refund(client as never, {
      target: { foodOrderId: 'fo-1' },
      amountMinor: 5000,
      currency: 'BDT',
      reference: 'FO-1',
    });
    expect(client.payment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { foodOrderId: 'fo-1', type: 'CHARGE', status: 'SUCCEEDED' } }),
    );
    expect(client.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        foodOrderId: 'fo-1',
        type: 'REFUND',
        method: 'NAGAD',
        externalRef: 'SBX-REFUND-FO-1',
      }),
    });
  });

  it('throws PAYMENT_FAILED (422) on a declined charge and writes nothing', async () => {
    const client = tx();
    const service = new PaymentsService(new DecliningPaymentProvider());
    const error = await service
      .charge(client as never, {
        target: { orderId: 'order-1' },
        amountMinor: 20000,
        currency: 'BDT',
        method: 'BKASH',
        reference: 'BK-1',
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(422);
    expect((error as HttpException).getResponse()).toEqual({
      code: ErrorCode.PAYMENT_FAILED,
      message: PAYMENT_FAILED_MESSAGE,
    });
    expect(client.payment.create).not.toHaveBeenCalled();
  });
});
