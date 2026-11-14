import { IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { CreateHotelOrderRequest, PaymentMethodInput } from '@coastline/api-contracts';
import {
  PAYMENT_METHOD_INPUT_MESSAGE,
  PAYMENT_METHOD_INPUTS,
} from '../../payments/payment-method-input';

export class CreateHotelOrderDto implements CreateHotelOrderRequest {
  @IsUUID()
  hotelId!: string;

  @IsUUID()
  roomTypeId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'checkInDate must be YYYY-MM-DD' })
  checkInDate!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'checkOutDate must be YYYY-MM-DD' })
  checkOutDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  guestsCount?: number;

  @IsOptional()
  @IsString()
  touristName?: string;

  @IsOptional()
  @IsString()
  touristEmail?: string;

  @IsOptional()
  @IsString()
  touristPhone?: string;

  /** Checkout method (BKASH, NAGAD, CARD). Never a credential. */
  // legacy: remove in WP-23 — 'MOCK' and an absent method are accepted and stored as null.
  @IsOptional()
  @IsIn(PAYMENT_METHOD_INPUTS, { message: PAYMENT_METHOD_INPUT_MESSAGE })
  paymentMethod?: PaymentMethodInput;
}
