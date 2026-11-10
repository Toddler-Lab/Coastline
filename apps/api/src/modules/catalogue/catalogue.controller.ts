import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { BeachPointDetail, BeachPointSummary } from '@coastline/api-contracts';
import { AllowAnonymous } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import type { Actor } from '../../common/auth/actor';
import { CatalogueService } from './catalogue.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

@ApiTags('catalogue')
@Controller('beach-points')
@AllowAnonymous()
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}

  @Get()
  async list(@Query() query: AvailabilityQueryDto): Promise<{ data: BeachPointSummary[] }> {
    return this.catalogue.list(query.date);
  }

  @Get(':code')
  async detail(
    @Param('code') code: string,
    @Query() query: AvailabilityQueryDto,
    @CurrentActor() actor?: Actor,
  ): Promise<{ data: BeachPointDetail }> {
    return this.catalogue.detail(code, query.date, actor?.id);
  }
}
