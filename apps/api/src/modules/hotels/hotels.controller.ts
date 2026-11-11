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
  HotelDetailDto,
  HotelSummaryDto,
  OrderDto,
} from '@coastline/api-contracts';
import type { Actor } from '../../common/auth/actor';
import { AllowAnonymous } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import { CreateHotelOrderDto } from './dto/create-hotel-order.dto';
import { HotelQueryDto } from './dto/hotel-query.dto';
import { HotelsService } from './hotels.service';

@ApiTags('hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get()
  @AllowAnonymous()
  async list(@Query() query: HotelQueryDto): Promise<{ data: HotelSummaryDto[] }> {
    const hotels = await this.hotelsService.listHotels(query);
    return { data: hotels };
  }

  @Get(':slug')
  @AllowAnonymous()
  async detail(
    @Param('slug') slug: string,
    @Query('checkInDate') checkInDate?: string,
    @Query('checkOutDate') checkOutDate?: string,
  ): Promise<{ data: HotelDetailDto }> {
    const hotel = await this.hotelsService.getHotelBySlug(slug, checkInDate, checkOutDate);
    return { data: hotel };
  }

  @Post('bookings')
  async createBooking(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateHotelOrderDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ data: OrderDto }> {
    const order = await this.hotelsService.createHotelBooking(actor, dto, requestId);
    return { data: order };
  }
}
