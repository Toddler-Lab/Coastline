import { Injectable } from '@nestjs/common';
import type { PaymentProvider, PaymentRequest, PaymentResult } from './payment-provider';

/**
 * Sandbox adapter: approves every charge and refund immediately and moves no
 * money. It behaves like a live provider in every other respect: same
 * statuses, same records. References are derived from the Coastline reference
 * alone, so a retry with the same request returns the same result.
 */
@Injectable()
export class SandboxPaymentProvider implements PaymentProvider {
  readonly name = 'SANDBOX';

  async charge(request: PaymentRequest): Promise<PaymentResult> {
    return { status: 'SUCCEEDED', externalRef: `SBX-${request.reference}` };
  }

  async refund(request: PaymentRequest): Promise<PaymentResult> {
    return { status: 'SUCCEEDED', externalRef: `SBX-REFUND-${request.reference}` };
  }
}
