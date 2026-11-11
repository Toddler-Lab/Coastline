import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  ReservationDto,
  ReservationListDto,
  TableAvailabilityDto,
} from '@coastline/api-contracts';
import type { Actor } from '../../../common/auth/actor';
import { AllowAnonymous } from '../../../common/auth/auth.decorators';
import { CurrentActor } from '../../../common/auth/current-actor.decorator';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('dining-reservations')
@Controller('dining')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get('venues/:code/availability')
  @AllowAnonymous()
  async availability(
    @Param('code') code: string,
    @Query('date') date?: string,
  ): Promise<{ data: TableAvailabilityDto }> {
    return { data: await this.reservations.availability(code, date) };
  }

  @Post('reservations')
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateReservationDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: ReservationDto }> {
    return { data: await this.reservations.create(actor, dto, requestId) };
  }

  @Get('reservations/me')
  async listMine(@CurrentActor() actor: Actor): Promise<{ data: ReservationListDto }> {
    return { data: await this.reservations.listMine(actor) };
  }

  @Get('reservations/:ref')
  async get(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
  ): Promise<{ data: ReservationDto }> {
    return { data: await this.reservations.get(actor, ref) };
  }

  @Post('reservations/:ref/cancel')
  async cancel(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CancelReservationDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: ReservationDto }> {
    return { data: await this.reservations.cancelAsTourist(actor, ref, dto, requestId) };
  }
}
