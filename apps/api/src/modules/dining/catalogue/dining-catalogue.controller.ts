import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { DiningVenueDetail, DiningVenueSummary } from '@coastline/api-contracts';
import { AllowAnonymous } from '../../../common/auth/auth.decorators';
import { parseVenueQuery } from './dining-catalogue.query';
import { DiningCatalogueService } from './dining-catalogue.service';
import { VenueQueryDto } from './dto/venue-query.dto';

@ApiTags('dining')
@Controller('dining/venues')
@AllowAnonymous()
export class DiningCatalogueController {
  constructor(private readonly catalogue: DiningCatalogueService) {}

  @Get()
  async list(@Query() query: VenueQueryDto): Promise<{ data: DiningVenueSummary[] }> {
    return { data: await this.catalogue.listVenues(parseVenueQuery(query)) };
  }

  @Get(':code')
  async detail(@Param('code') code: string): Promise<{ data: DiningVenueDetail }> {
    return { data: await this.catalogue.getVenue(code) };
  }
}
