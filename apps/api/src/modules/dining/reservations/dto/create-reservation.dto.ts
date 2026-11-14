import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  PAYMENT_METHOD_INPUT_MESSAGE,
  PAYMENT_METHOD_INPUTS,
} from '../../../payments/payment-method-input';
import type { CreateReservationRequest, PaymentMethodInput } from '@coastline/api-contracts';

/**
 * Shape-only validation (400). Business ranges — hours, party size against the
 * table, opening hours, advance window — are checked by the service (422).
 */
export class CreateReservationDto implements CreateReservationRequest {
  @IsUUID()
  tableId!: string;

  @IsISO8601({ strict: true })
  startsAt!: string;

  @IsInt()
  hours!: number;

  @IsInt()
  partySize!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /** Checkout method (BKASH, NAGAD, CARD). Never a credential. */
  // legacy: remove in WP-23 — 'MOCK' and an absent method are accepted and stored as null.
  @IsOptional()
  @IsIn(PAYMENT_METHOD_INPUTS, { message: PAYMENT_METHOD_INPUT_MESSAGE })
  paymentMethod?: PaymentMethodInput;
}
