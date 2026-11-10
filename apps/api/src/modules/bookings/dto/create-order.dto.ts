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
  MAX_BEDS_PER_ORDER,
  MAX_HOURS_PER_ITEM,
  type CreateOrderItemRequest,
  type CreateOrderRequest,
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

  @IsOptional()
  @IsIn(['MOCK'])
  paymentMethod?: 'MOCK';
}
