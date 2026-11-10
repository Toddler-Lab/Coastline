import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  AdminOrderDto,
  AdminOrderListDto,
  AdminOverviewDto,
  BeachPointSummary,
} from '@coastline/api-contracts';
import type { Actor } from '../../common/auth/actor';
import { Roles } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { CatalogueService } from '../catalogue/catalogue.service';
import { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CheckInDto } from './dto/check-in.dto';
import { ValidateTicketDto } from './dto/validate-ticket.dto';
import { OrdersService } from './orders.service';

@ApiTags('admin-orders')
@Controller('admin')
@Roles('ADMIN')
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly catalogueService: CatalogueService,
  ) {}

  @Get('overview')
  async getOverview(@Query('date') date?: string): Promise<{ data: AdminOverviewDto }> {
    const overview = await this.ordersService.getAdminOverview(date);
    return { data: overview };
  }

  @Get('beach-points')
  async getBeachPoints(@Query('date') date?: string): Promise<{ data: BeachPointSummary[] }> {
    return this.catalogueService.list(date);
  }

  @Get('orders')
  async findOrders(@Query() query: AdminOrderQueryDto): Promise<{ data: AdminOrderListDto }> {
    const result = await this.ordersService.findAdminOrders(query);
    return { data: result };
  }

  @Post('orders/:ref/cancel')
  async cancel(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CancelOrderDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminOrderDto }> {
    const updated = await this.ordersService.cancelOrder(actor, ref, dto, requestId);
    // Cast to AdminOrderDto (order has actor tourist info)
    return {
      data: {
        ...updated,
        tourist: { id: actor.id, name: actor.name, email: actor.email },
      },
    };
  }

  @Post('orders/:ref/check-in')
  async checkIn(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CheckInDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminOrderDto }> {
    const result = await this.ordersService.adminCheckIn(actor, ref, dto, requestId);
    return { data: result };
  }

  @Post('tickets/validate')
  async validateTicket(@Body() dto: ValidateTicketDto): Promise<{ data: AdminOrderDto }> {
    const result = await this.ordersService.adminValidateTicket(dto.payload);
    return { data: result };
  }
}

