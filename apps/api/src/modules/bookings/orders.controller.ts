import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { OrderDto } from '@coastline/api-contracts';
import type { Actor } from '../../common/auth/actor';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateOrderDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: OrderDto }> {
    const order = await this.ordersService.createOrder(actor, dto, requestId);
    return { data: order };
  }

  @Get('me')
  async listMine(@CurrentActor() actor: Actor): Promise<{ data: OrderDto[] }> {
    const orders = await this.ordersService.getTouristOrders(actor.id);
    return { data: orders };
  }

  @Get()
  async list(@CurrentActor() actor: Actor): Promise<{ data: OrderDto[] }> {
    const orders = await this.ordersService.getTouristOrders(actor.id);
    return { data: orders };
  }

  @Get(':ref')
  async getByRef(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
  ): Promise<{ data: OrderDto }> {
    const order = await this.ordersService.getOrder(actor, ref);
    return { data: order };
  }

  @Post(':ref/cancel')
  async cancel(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CancelOrderDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: OrderDto }> {
    const order = await this.ordersService.cancelOrder(actor, ref, dto, requestId);
    return { data: order };
  }
}
