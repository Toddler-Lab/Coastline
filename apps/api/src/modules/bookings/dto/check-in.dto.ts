import { IsArray, IsOptional, IsUUID } from 'class-validator';
import type { CheckInRequest } from '@coastline/api-contracts';

export class CheckInDto implements CheckInRequest {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds?: string[];
}
