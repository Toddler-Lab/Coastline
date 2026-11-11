import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import {
  RESERVATION_STATUSES,
  type AdminReservationQuery,
  type ReservationStatus,
} from '@coastline/api-contracts';
import { DATE_KEY_PATTERN } from '../../../../common/time/dhaka';

export class AdminReservationQueryDto implements AdminReservationQuery {
  @IsOptional()
  @Matches(DATE_KEY_PATTERN, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  venueCode?: string;

  @IsOptional()
  @IsIn(RESERVATION_STATUSES)
  status?: ReservationStatus;
}
