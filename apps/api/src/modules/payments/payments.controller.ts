import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PaymentMethod, PaymentMethodDto } from '@coastline/api-contracts';
import { PAYMENT_METHODS } from '@coastline/api-contracts';
import { AllowAnonymous } from '../../common/auth/auth.decorators';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  CARD: 'Card',
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  /** Methods checkout may offer, so clients never hard-code them. */
  @Get('methods')
  @AllowAnonymous()
  methods(): { data: PaymentMethodDto[] } {
    return {
      data: PAYMENT_METHODS.map((code) => ({ code, label: PAYMENT_METHOD_LABELS[code] })),
    };
  }
}
