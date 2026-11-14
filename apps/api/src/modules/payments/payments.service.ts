import { Inject, Injectable } from '@nestjs/common';
import type { PaymentMethod, PaymentMethodInput } from '@coastline/api-contracts';
import type { Payment, Prisma } from '@coastline/db';
import { paymentFailed } from '../../common/errors/api-errors';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';

type Tx = Prisma.TransactionClient;

/** The parent a payment row belongs to (exactly one, enforced in SQL). */
export type PaymentTarget = { orderId: string } | { reservationId: string } | { foodOrderId: string };

export interface ChargeInput {
  target: PaymentTarget;
  amountMinor: number;
  currency: string;
  method: PaymentMethod | null;
  /** Coastline reference, usually the booking's public reference. */
  reference: string;
}

export interface RefundInput {
  target: PaymentTarget;
  amountMinor: number;
  currency: string;
  /** Must be unique per refund: it becomes part of the stored external reference. */
  reference: string;
}

export const REFUND_FAILED_MESSAGE =
  'The refund could not be completed. Your booking has not been cancelled.';

/** Maps the request value to the stored method. */
// legacy: remove in WP-23 — 'MOCK' and an absent method are stored as null.
export function resolvePaymentMethod(input: PaymentMethodInput | undefined): PaymentMethod | null {
  if (input === undefined || input === 'MOCK') {
    return null;
  }
  return input;
}

/**
 * The only writer of `payments` rows. Every call runs inside the caller's
 * transaction, so a declined charge (thrown as `PAYMENT_FAILED`) rolls back
 * the booking and its inventory together with everything else.
 */
@Injectable()
export class PaymentsService {
  constructor(@Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  async charge(tx: Tx, input: ChargeInput): Promise<Payment> {
    const result = await this.provider.charge({
      amountMinor: input.amountMinor,
      currency: input.currency,
      method: input.method,
      reference: input.reference,
      idempotencyKey: `charge:${input.reference}`,
    });
    if (result.status !== 'SUCCEEDED') {
      throw paymentFailed();
    }

    return tx.payment.create({
      data: {
        ...input.target,
        type: 'CHARGE',
        provider: this.provider.name,
        method: input.method,
        status: 'SUCCEEDED',
        amountMinor: input.amountMinor,
        currency: input.currency,
        externalRef: result.externalRef,
      },
    });
  }

  /** Refunds by reversal to the method of the parent's latest charge. */
  async refund(tx: Tx, input: RefundInput): Promise<Payment> {
    const charge = await tx.payment.findFirst({
      where: { ...input.target, type: 'CHARGE', status: 'SUCCEEDED' },
      orderBy: { createdAt: 'desc' },
      select: { method: true },
    });
    const method = charge?.method ?? null;

    const result = await this.provider.refund({
      amountMinor: input.amountMinor,
      currency: input.currency,
      method,
      reference: input.reference,
      idempotencyKey: `refund:${input.reference}`,
    });
    if (result.status !== 'SUCCEEDED') {
      throw paymentFailed(REFUND_FAILED_MESSAGE);
    }

    return tx.payment.create({
      data: {
        ...input.target,
        type: 'REFUND',
        provider: this.provider.name,
        method,
        status: 'SUCCEEDED',
        amountMinor: input.amountMinor,
        currency: input.currency,
        externalRef: result.externalRef,
      },
    });
  }
}
