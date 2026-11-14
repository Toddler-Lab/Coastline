import type { PaymentProvider, PaymentRequest, PaymentResult } from '../payment-provider';

/**
 * Test double that declines every charge. Injected only through
 * `createTestApp({ paymentProvider })`; there is no runtime switch for it.
 */
export class DecliningPaymentProvider implements PaymentProvider {
  readonly name = 'DECLINING_TEST_DOUBLE';
  readonly charges: PaymentRequest[] = [];
  readonly refunds: PaymentRequest[] = [];

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    this.charges.push(request);
    return { status: 'FAILED', externalRef: null };
  }

  async refund(request: PaymentRequest): Promise<PaymentResult> {
    this.refunds.push(request);
    return { status: 'FAILED', externalRef: null };
  }
}
