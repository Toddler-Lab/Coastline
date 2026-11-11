import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { CancelReservationRequest } from '@coastline/api-contracts';

export class CancelReservationDto implements CancelReservationRequest {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
