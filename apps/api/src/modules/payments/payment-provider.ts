import type { PaymentMethod, PaymentStatus } from '@coastline/api-contracts';

/** Nest injection token for the active {@link PaymentProvider}. */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

/** Values accepted by the `PAYMENT_PROVIDER` setting. Only the sandbox adapter exists. */
export const PAYMENT_PROVIDER_NAMES = ['sandbox'] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDER_NAMES)[number];

export interface PaymentRequest {
  /** Integer minor units, always positive. */
  amountMinor: number;
  /** ISO 4217 code, e.g. `BDT`. */
  currency: string;
  /** Checkout method; null for legacy requests that named none. */
  method: PaymentMethod | null;
  /** Coastline reference the provider stores against the payment. */
  reference: string;
  /** A retry with the same key must return the first result. */
  idempotencyKey: string;
}

export interface PaymentResult {
  status: PaymentStatus;
  /** The provider's own reference; stored in `payments.external_ref`. */
  externalRef: string | null;
}

/**
 * Port to a payment provider. Adapters never receive or return card numbers,
 * CVVs, wallet PINs or one-time codes: credential entry belongs to a licensed
 * gateway's hosted page, which a live adapter will add in a reviewed change.
 */
export interface PaymentProvider {
  /** Value recorded in `payments.provider`, e.g. `SANDBOX`. */
  readonly name: string;
  charge(request: PaymentRequest): Promise<PaymentResult>;
  refund(request: PaymentRequest): Promise<PaymentResult>;
}
