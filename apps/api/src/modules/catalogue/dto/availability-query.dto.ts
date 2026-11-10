import { IsOptional, IsString, MaxLength } from 'class-validator';

/** `?date=YYYY-MM-DD` (defaults to today in Asia/Dhaka). */
export class AvailabilityQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  date?: string;
}
