import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AdminFoodOrderDto } from '@coastline/api-contracts';
import type { Actor } from '../../../common/auth/actor';
import { Roles } from '../../../common/auth/auth.decorators';
import { CurrentActor } from '../../../common/auth/current-actor.decorator';
import { AdminFoodOrderQueryDto } from './dto/admin-food-order-query.dto';
import { UpdateFoodOrderStatusDto } from './dto/update-food-order-status.dto';
import { FoodOrdersService } from './food-orders.service';

/** Kitchen board. Kitchen staff are ADMIN in the MVP. */
@ApiTags('admin-dining-delivery')
@Controller('admin/dining')
@Roles('ADMIN')
export class AdminFoodOrdersController {
  constructor(private readonly foodOrders: FoodOrdersService) {}

  @Get('food-orders')
  async list(@Query() query: AdminFoodOrderQueryDto): Promise<{ data: AdminFoodOrderDto[] }> {
    return { data: await this.foodOrders.listForKitchen(query) };
  }

  @Post('food-orders/:ref/status')
  async changeStatus(
    @CurrentActor() actor: Actor,
    @Param('ref') ref: string,
    @Body() dto: UpdateFoodOrderStatusDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: AdminFoodOrderDto }> {
    return { data: await this.foodOrders.changeStatus(actor, ref, dto, requestId) };
  }
}
