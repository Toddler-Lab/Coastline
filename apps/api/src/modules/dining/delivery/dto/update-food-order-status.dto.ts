import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  FOOD_ORDER_STATUSES,
  type FoodOrderStatus,
  type UpdateFoodOrderStatusRequest,
} from '@coastline/api-contracts';

/** Every status except the initial one can be requested; the service applies the transition table. */
export const SETTABLE_FOOD_ORDER_STATUSES = FOOD_ORDER_STATUSES.filter(
  (status): status is Exclude<FoodOrderStatus, 'PLACED'> => status !== 'PLACED',
);

export class UpdateFoodOrderStatusDto implements UpdateFoodOrderStatusRequest {
  @IsIn(SETTABLE_FOOD_ORDER_STATUSES)
  status!: Exclude<FoodOrderStatus, 'PLACED'>;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
