import { Body, Controller, Get, Headers, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  AdminMenuItemDto,
  DiningAdminOverviewDto,
  DiningAdminVenueDto,
} from '@coastline/api-contracts';
import type { Actor } from '../../../common/auth/actor';
import { Roles } from '../../../common/auth/auth.decorators';
import { CurrentActor } from '../../../common/auth/current-actor.decorator';
import { DiningAdminService } from './dining-admin.service';
import {
  DiningOverviewQueryDto,
  UpdateDiningVenueDto,
  UpdateMenuItemDto,
} from './dto/dining-admin.dto';

/** Stream D: dining administration (ADMIN only). */
@ApiTags('admin-dining')
@Controller('admin/dining')
@Roles('ADMIN')
export class DiningAdminController {
  constructor(private readonly service: DiningAdminService) {}

  @Get('overview')
  async overview(
    @Query() query: DiningOverviewQueryDto,
  ): Promise<{ data: DiningAdminOverviewDto }> {
    return { data: await this.service.getOverview(query.date) };
  }

  @Get('venues')
  async venues(): Promise<{ data: DiningAdminVenueDto[] }> {
    return { data: await this.service.listVenues() };
  }

  @Patch('venues/:code')
  async updateVenue(
    @CurrentActor() actor: Actor,
    @Param('code') code: string,
    @Body() dto: UpdateDiningVenueDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: DiningAdminVenueDto }> {
    return { data: await this.service.updateVenue(actor, code, dto, requestId) };
  }

  @Patch('menu-items/:id')
  async updateMenuItem(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminMenuItemDto }> {
    return { data: await this.service.updateMenuItem(actor, id, dto, requestId) };
  }
}
