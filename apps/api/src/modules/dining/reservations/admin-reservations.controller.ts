import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AdminReservationDto } from '@coastline/api-contracts';
import type { Actor } from '../../../common/auth/actor';
import { Roles } from '../../../common/auth/auth.decorators';
import { CurrentActor } from '../../../common/auth/current-actor.decorator';
import { AdminReservationQueryDto } from './dto/admin-reservation-query.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('admin-dining-reservations')
@Controller('admin/dining/reservations')
@Roles('ADMIN')
export class AdminReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get()
  async list(@Query() query: AdminReservationQueryDto): Promise<{ data: AdminReservationDto[] }> {
    return { data: await this.reservations.adminList(query) };
  }

  @Post(':ref/check-in')
  async checkIn(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminReservationDto }> {
    return { data: await this.reservations.adminCheckIn(actor, ref, requestId) };
  }

  @Post(':ref/cancel')
  async cancel(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CancelReservationDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminReservationDto }> {
    return { data: await this.reservations.adminCancel(actor, ref, dto, requestId) };
  }
}
