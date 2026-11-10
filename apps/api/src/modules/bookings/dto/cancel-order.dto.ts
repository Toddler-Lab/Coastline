import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { CancelOrderRequest } from '@coastline/api-contracts';

export class CancelOrderDto implements CancelOrderRequest {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
