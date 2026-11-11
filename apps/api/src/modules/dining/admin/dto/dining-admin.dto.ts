import { IsBoolean, IsNumber, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import type { UpdateDiningVenueRequest, UpdateMenuItemRequest } from '@coastline/api-contracts';
import { DATE_KEY_PATTERN } from '../../../../common/time/dhaka';

/**
 * Shape checks only (400). Domain bounds such as hour ranges, close > open,
 * deposit and price limits (including "whole number") are enforced in the
 * service and answer 422, so fractions pass the finite-number check here.
 */
const FINITE = { allowNaN: false, allowInfinity: false };

const present = (_: object, value: unknown) => value !== undefined;

export class DiningOverviewQueryDto {
  @IsOptional()
  @Matches(DATE_KEY_PATTERN, { message: 'date must be YYYY-MM-DD' })
  date?: string;
}

export class UpdateDiningVenueDto implements UpdateDiningVenueRequest {
  /** `null` clears the description. */
  @IsOptional()
  @IsString()
  description?: string | null;

  @ValidateIf(present)
  @IsNumber(FINITE)
  openHour?: number;

  @ValidateIf(present)
  @IsNumber(FINITE)
  closeHour?: number;

  @ValidateIf(present)
  @IsBoolean()
  reservationsEnabled?: boolean;

  @ValidateIf(present)
  @IsBoolean()
  deliveryEnabled?: boolean;

  @ValidateIf(present)
  @IsNumber(FINITE)
  reservationDepositMinor?: number;

  @ValidateIf(present)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMenuItemDto implements UpdateMenuItemRequest {
  @ValidateIf(present)
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nameBn?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @ValidateIf(present)
  @IsNumber(FINITE)
  priceMinor?: number;

  @ValidateIf(present)
  @IsBoolean()
  isAvailable?: boolean;

  @ValidateIf(present)
  @IsNumber(FINITE)
  sortOrder?: number;
}
