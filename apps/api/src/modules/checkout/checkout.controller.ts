import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { ApiEnvelope, CheckoutQuoteDto } from '@coastline/api-contracts';
import { IsIn, IsObject } from 'class-validator';
import { Roles } from '../../common/auth/auth.decorators';
import { CheckoutService, type QuoteKind } from './checkout.service';

class CheckoutQuoteBody {
  @IsIn(['sunbed', 'stay', 'table', 'food'])
  kind!: QuoteKind;

  /** Validated against the engine's create DTO by the service. */
  @IsObject()
  request!: Record<string, unknown>;
}

@ApiTags('checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  /** The server price of a booking; nothing is booked or charged. */
  @Post('quote')
  @HttpCode(200)
  @Roles('TOURIST')
  async quote(@Body() body: CheckoutQuoteBody): Promise<ApiEnvelope<CheckoutQuoteDto>> {
    return { data: await this.checkout.quote(body.kind, body.request) };
  }
}
