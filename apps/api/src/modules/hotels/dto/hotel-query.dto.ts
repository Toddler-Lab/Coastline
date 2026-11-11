import { IsEnum, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { HOTEL_ZONES, type HotelZone } from '@coastline/api-contracts';

export class HotelQueryDto {
  @IsOptional()
  @IsEnum(HOTEL_ZONES)
  zone?: HotelZone;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'checkInDate must be YYYY-MM-DD' })
  checkInDate?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'checkOutDate must be YYYY-MM-DD' })
  checkOutDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  starRating?: number;
}
