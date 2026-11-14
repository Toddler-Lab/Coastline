import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SandboxPaymentProvider } from './sandbox-payment.provider';

/** Builds the adapter named by `PAYMENT_PROVIDER`; an unknown name fails start-up. */
export function createPaymentProvider(name: string | undefined): PaymentProvider {
  const normalized = (name ?? 'sandbox').trim().toLowerCase();
  switch (normalized) {
    case 'sandbox':
      return new SandboxPaymentProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER "${name}"`);
  }
}

@Module({
  controllers: [PaymentsController],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): PaymentProvider =>
        createPaymentProvider(config.get<string>('PAYMENT_PROVIDER')),
    },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
