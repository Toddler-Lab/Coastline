import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  PAYMENT_METHOD_INPUT_MESSAGE,
  PAYMENT_METHOD_INPUTS,
} from '../../../payments/payment-method-input';
import type {
  CreateFoodOrderLine,
  CreateFoodOrderRequest,
  PaymentMethodInput,
} from '@coastline/api-contracts';

export const FOOD_ORDER_NOTE_MAX = 300;

/**
 * Shape only. Line count, quantity bounds, duplicates and menu membership are
 * business rules checked by the service so they answer 422, like the hotel and
 * sunbed flows. Unknown properties such as a client price are rejected by the
 * global whitelist pipe and never reach pricing.
 */
export class CreateFoodOrderLineDto implements CreateFoodOrderLine {
  @IsUUID()
  menuItemId!: string;

  @IsInt()
  quantity!: number;
}

export class CreateFoodOrderDto implements CreateFoodOrderRequest {
  @IsUUID()
  orderItemId!: string;

  @IsUUID()
  venueId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFoodOrderLineDto)
  lines!: CreateFoodOrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(FOOD_ORDER_NOTE_MAX)
  note?: string;

  /** Checkout method (BKASH, NAGAD, CARD). Never a credential. */
  // legacy: remove in WP-23 — 'MOCK' and an absent method are accepted and stored as null.
  @IsOptional()
  @IsIn(PAYMENT_METHOD_INPUTS, { message: PAYMENT_METHOD_INPUT_MESSAGE })
  paymentMethod?: PaymentMethodInput;
}
