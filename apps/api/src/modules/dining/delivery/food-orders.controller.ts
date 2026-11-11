import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { DeliverableBedDto, FoodOrderDto, FoodOrderListDto } from '@coastline/api-contracts';
import type { Actor } from '../../../common/auth/actor';
import { CurrentActor } from '../../../common/auth/current-actor.decorator';
import { CancelFoodOrderDto } from './dto/cancel-food-order.dto';
import { CreateFoodOrderDto } from './dto/create-food-order.dto';
import { FoodOrdersService } from './food-orders.service';

/** Tourist side of sunbed food delivery. Role checks live in the service. */
@ApiTags('dining-delivery')
@Controller('dining')
export class FoodOrdersController {
  constructor(private readonly foodOrders: FoodOrdersService) {}

  @Get('delivery/beds')
  async beds(@CurrentActor() actor: Actor): Promise<{ data: DeliverableBedDto[] }> {
    return { data: await this.foodOrders.listDeliverableBeds(actor) };
  }

  @Post('food-orders')
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateFoodOrderDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: FoodOrderDto }> {
    return { data: await this.foodOrders.createFoodOrder(actor, dto, requestId) };
  }

  @Get('food-orders/me')
  async listMine(@CurrentActor() actor: Actor): Promise<{ data: FoodOrderListDto }> {
    return { data: await this.foodOrders.listMine(actor) };
  }

  @Get('food-orders/:ref')
  async getByRef(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
  ): Promise<{ data: FoodOrderDto }> {
    return { data: await this.foodOrders.getByRef(actor, ref) };
  }

  @Post('food-orders/:ref/cancel')
  async cancel(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: CancelFoodOrderDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: FoodOrderDto }> {
    return { data: await this.foodOrders.cancelByTourist(actor, ref, dto, requestId) };
  }
}
