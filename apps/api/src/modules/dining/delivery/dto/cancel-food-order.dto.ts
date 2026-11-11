import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { CancelFoodOrderRequest } from '@coastline/api-contracts';

export class CancelFoodOrderDto implements CancelFoodOrderRequest {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
