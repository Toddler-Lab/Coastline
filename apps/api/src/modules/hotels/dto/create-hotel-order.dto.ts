import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHotelOrderDto {
  @IsUUID()
  hotelId!: string;

  @IsUUID()
  roomTypeId!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'checkInDate must be YYYY-MM-DD' })
  checkInDate!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'checkOutDate must be YYYY-MM-DD' })
  checkOutDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  guestsCount?: number;

  @IsOptional()
  @IsString()
  touristName?: string;

  @IsOptional()
  @IsString()
  touristEmail?: string;

  @IsOptional()
  @IsString()
  touristPhone?: string;
}
