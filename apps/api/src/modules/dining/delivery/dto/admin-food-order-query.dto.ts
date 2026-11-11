import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  FOOD_ORDER_STATUSES,
  type AdminFoodOrderQuery,
  type FoodOrderStatus,
} from '@coastline/api-contracts';

/** `date` is checked by the service (422 for an impossible calendar date, like hotels). */
export class AdminFoodOrderQueryDto implements AdminFoodOrderQuery {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  venueCode?: string;

  @IsOptional()
  @IsIn(FOOD_ORDER_STATUSES)
  status?: FoodOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  date?: string;
}
