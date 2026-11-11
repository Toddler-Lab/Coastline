import { IsIn, IsInt, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type { CreateReservationRequest } from '@coastline/api-contracts';

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

  @IsOptional()
  @IsIn(['MOCK'])
  paymentMethod?: 'MOCK';
}
