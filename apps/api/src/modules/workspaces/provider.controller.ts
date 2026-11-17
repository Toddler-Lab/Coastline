import { Body, Controller, Get, Headers, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  AdminFoodOrderDto,
  AdminMenuItemDto,
  AdminReservationDto,
  DiningAdminOverviewDto,
  DiningAdminVenueDto,
} from '@coastline/api-contracts';
import type { Actor } from '../../common/auth/actor';
import { Roles } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { forbidden } from '../../common/errors/api-errors';
import { DiningAdminService } from '../dining/admin/dining-admin.service';
import {
  DiningOverviewQueryDto,
  UpdateDiningVenueDto,
  UpdateMenuItemDto,
} from '../dining/admin/dto/dining-admin.dto';
import { AdminFoodOrderQueryDto } from '../dining/delivery/dto/admin-food-order-query.dto';
import { UpdateFoodOrderStatusDto } from '../dining/delivery/dto/update-food-order-status.dto';
import { FoodOrdersService } from '../dining/delivery/food-orders.service';
import { AdminReservationQueryDto } from '../dining/reservations/dto/admin-reservation-query.dto';
import { CancelReservationDto } from '../dining/reservations/dto/cancel-reservation.dto';
import { ReservationsService } from '../dining/reservations/reservations.service';
import { WorkspaceScopeService } from './workspace-scope.service';

const OWNER_ONLY_VENUE = 'Only the business owner can change venue settings and deposits.';
const OWNER_ONLY_MENU = 'Only the business owner can change menu names and prices.';

/**
 * Provider portal (`/provider`, api.md section 5): the dining engine's venue,
 * table and kitchen actions, scoped to the venues of the caller's providers.
 * ADMIN sees every venue. Staff members cannot change prices or settings.
 */
@ApiTags('provider')
@Controller('provider')
@Roles('PROVIDER', 'ADMIN')
export class ProviderController {
  constructor(
    private readonly scope: WorkspaceScopeService,
    private readonly dining: DiningAdminService,
    private readonly reservations: ReservationsService,
    private readonly foodOrders: FoodOrdersService,
  ) {}

  @Get('today')
  async today(
    @CurrentActor() actor: Actor,
    @Query() query: DiningOverviewQueryDto,
  ): Promise<{ data: DiningAdminOverviewDto }> {
    const venues = await this.scope.venueScope(actor);
    return { data: await this.dining.getOverview(query.date, venues ?? undefined) };
  }

  @Get('venues')
  async venues(@CurrentActor() actor: Actor): Promise<{ data: DiningAdminVenueDto[] }> {
    const venues = await this.scope.venueScope(actor);
    return { data: await this.dining.listVenues(venues ?? undefined) };
  }

  @Patch('venues/:code')
  async updateVenue(
    @CurrentActor() actor: Actor,
    @Param('code') code: string,
    @Body() dto: UpdateDiningVenueDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: DiningAdminVenueDto }> {
    const venueId = await this.scope.venueIdByCode(code);
    await this.scope.assertVenue(actor, venueId, { ownerOnly: OWNER_ONLY_VENUE });
    return { data: await this.dining.updateVenue(actor, code.toUpperCase(), dto, requestId) };
  }

  @Patch('menu-items/:id')
  async updateMenuItem(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminMenuItemDto }> {
    const venueId = await this.scope.menuItemVenueId(id);
    const role = await this.scope.venueRole(actor, venueId);
    // Staff may mark items available or sold out; everything else is the owner's.
    const changed = Object.entries(dto).filter(([, value]) => value !== undefined);
    const staffSafe = changed.every(([key]) => key === 'isAvailable');
    if (role === 'STAFF' && !staffSafe) {
      throw forbidden(OWNER_ONLY_MENU);
    }
    return { data: await this.dining.updateMenuItem(actor, id, dto, requestId) };
  }

  @Get('reservations')
  async listReservations(
    @CurrentActor() actor: Actor,
    @Query() query: AdminReservationQueryDto,
  ): Promise<{ data: AdminReservationDto[] }> {
    const codes = await this.scope.venueCodes(await this.scope.venueScope(actor));
    const all = await this.reservations.adminList(query);
    return { data: codes ? all.filter((item) => codes.has(item.venue.code)) : all };
  }

  @Post('reservations/:ref/check-in')
  async checkInReservation(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminReservationDto }> {
    await this.scope.assertVenue(actor, await this.scope.reservationVenueId(ref));
    return { data: await this.reservations.adminCheckIn(actor, ref, requestId) };
  }

  @Post('reservations/:ref/cancel')
  async cancelReservation(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CancelReservationDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminReservationDto }> {
    await this.scope.assertVenue(actor, await this.scope.reservationVenueId(ref));
    return { data: await this.reservations.adminCancel(actor, ref, dto, requestId) };
  }

  @Get('food-orders')
  async listFoodOrders(
    @CurrentActor() actor: Actor,
    @Query() query: AdminFoodOrderQueryDto,
  ): Promise<{ data: AdminFoodOrderDto[] }> {
    const codes = await this.scope.venueCodes(await this.scope.venueScope(actor));
    const all = await this.foodOrders.listForKitchen(query);
    return { data: codes ? all.filter((item) => codes.has(item.venue.code)) : all };
  }

  @Post('food-orders/:ref/status')
  async changeFoodOrderStatus(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: UpdateFoodOrderStatusDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminFoodOrderDto }> {
    await this.scope.assertVenue(actor, await this.scope.foodOrderVenueId(ref));
    return { data: await this.foodOrders.changeStatus(actor, ref, dto, requestId) };
  }
}
