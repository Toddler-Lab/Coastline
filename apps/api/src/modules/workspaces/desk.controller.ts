import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AdminOrderListDto, DeskLookupDto } from '@coastline/api-contracts';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { Actor } from '../../common/auth/actor';
import { Roles } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { notFound, unprocessable } from '../../common/errors/api-errors';
import { AdminOrderQueryDto } from '../bookings/dto/admin-order-query.dto';
import { OrdersService } from '../bookings/orders.service';
import { TicketService } from '../bookings/ticket.service';
import { ReservationsService } from '../dining/reservations/reservations.service';
import { WorkspaceScopeService } from './workspace-scope.service';

class DeskLookupBody {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  query!: string;
}

const ORDER_REF = /^(BK|HTL)-[A-Z0-9-]{4,40}$/i;
const RESERVATION_REF = /^RS-[A-Z0-9-]{4,40}$/i;

/**
 * Spot desk (`/desk`, api.md section 6): find a booking by ticket or
 * reference, check it in, and list the day's arrivals. Desk staff act only in
 * their assigned destinations; anything else answers 404.
 */
@ApiTags('desk')
@Controller('desk')
@Roles('DESK', 'ADMIN')
export class DeskController {
  constructor(
    private readonly scope: WorkspaceScopeService,
    private readonly orders: OrdersService,
    private readonly tickets: TicketService,
    private readonly reservations: ReservationsService,
  ) {}

  @Get('arrivals')
  async arrivals(
    @CurrentActor() actor: Actor,
    @Query() query: AdminOrderQueryDto,
  ): Promise<{ data: AdminOrderListDto }> {
    const result = await this.orders.findAdminOrders(query);
    const orders = await this.scope.filterOrders(await this.scope.deskScope(actor), result.orders);
    return { data: { ...result, orders } };
  }

  @Post('lookup')
  async lookup(
    @CurrentActor() actor: Actor,
    @Body() body: DeskLookupBody,
  ): Promise<{ data: DeskLookupDto }> {
    const input = body.query.trim();
    let ref = input.toUpperCase();
    if (input.startsWith('COASTLINE:')) {
      // The signature is checked before anything is looked up; an edited QR is refused.
      const verified = this.tickets.verify(input);
      if (!verified.valid || !verified.publicRef) {
        throw unprocessable('This ticket QR code is not valid.');
      }
      ref = verified.publicRef.toUpperCase();
    }
    return { data: await this.find(actor, ref) };
  }

  @Post('bookings/:ref/check-in')
  async checkIn(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: DeskLookupDto }> {
    const reference = ref.trim().toUpperCase();
    await this.find(actor, reference);
    if (RESERVATION_REF.test(reference)) {
      return {
        data: {
          kind: 'reservation',
          reservation: await this.reservations.adminCheckIn(actor, reference, requestId),
        },
      };
    }
    return {
      data: {
        kind: 'order',
        order: await this.orders.adminCheckIn(actor, reference, {}, requestId),
      },
    };
  }

  /** Looks a reference up and enforces desk scope; 404 for unknown and out-of-scope alike. */
  private async find(actor: Actor, ref: string): Promise<DeskLookupDto> {
    const scope = await this.scope.deskScope(actor);
    if (ORDER_REF.test(ref)) {
      if (!this.scope.inScope(scope, await this.scope.orderDestinationId(ref))) {
        throw notFound(`Booking ${ref} was not found.`);
      }
      const list = await this.orders.findAdminOrders({ ref });
      const order = list.orders.find((item) => item.publicRef.toUpperCase() === ref);
      if (!order) throw notFound(`Booking ${ref} was not found.`);
      return { kind: 'order', order };
    }
    if (RESERVATION_REF.test(ref)) {
      if (!this.scope.inScope(scope, await this.scope.reservationDestinationId(ref))) {
        throw notFound(`Reservation ${ref} was not found.`);
      }
      return { kind: 'reservation', reservation: await this.reservations.adminGet(ref) };
    }
    if (/^FO-/i.test(ref)) {
      throw unprocessable('Food orders are handled by the venue kitchen, not at the desk.');
    }
    throw unprocessable(
      'References look like BK-20261117-AB12, HTL-20261117-AB12 or RS-20261117-AB12.',
    );
  }
}
