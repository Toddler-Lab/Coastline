import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Raw `GET /dining/venues` query. Values stay strings here so the domain parser
 * (`parseVenueQuery`) can reject unknown kinds and loose booleans with a 422.
 * Unknown query keys are still refused (400) by the global whitelist.
 */
export class VenueQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  kind?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  beachPointCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  reservable?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  delivers?: string;
}
