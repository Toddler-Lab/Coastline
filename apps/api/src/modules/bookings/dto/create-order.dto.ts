import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  PAYMENT_METHOD_INPUT_MESSAGE,
  PAYMENT_METHOD_INPUTS,
} from '../../payments/payment-method-input';
import {
  MAX_BEDS_PER_ORDER,
  MAX_HOURS_PER_ITEM,
  type CreateOrderItemRequest,
  type CreateOrderRequest,
  type PaymentMethodInput,
} from '@coastline/api-contracts';

export class CreateOrderItemDto implements CreateOrderItemRequest {
  @IsUUID()
  sunbedId!: string;

  @IsISO8601()
  startsAt!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_HOURS_PER_ITEM)
  hours!: number;
}

export class CreateOrderDto implements CreateOrderRequest {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BEDS_PER_ORDER)
  items!: CreateOrderItemDto[];

  /** Checkout method (BKASH, NAGAD, CARD). Never a credential. */
  // legacy: remove in WP-23 — 'MOCK' and an absent method are accepted and stored as null.
  @IsOptional()
  @IsIn(PAYMENT_METHOD_INPUTS, { message: PAYMENT_METHOD_INPUT_MESSAGE })
  paymentMethod?: PaymentMethodInput;
}

