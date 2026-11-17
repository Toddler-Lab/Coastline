import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/** `?date=YYYY-MM-DD` (defaults to today in Asia/Dhaka). */
export class AvailabilityQueryDto {
  /** Destination slug (list only). */
  @IsOptional()
  @Matches(/^[a-z0-9-]{1,80}$/, { message: 'destination must be a destination slug' })
  destination?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  date?: string;
}
