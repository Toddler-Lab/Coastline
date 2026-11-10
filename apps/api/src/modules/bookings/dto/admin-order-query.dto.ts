import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import {
  ORDER_STATUSES,
  type AdminOrderQuery,
  type OrderStatus,
} from '@coastline/api-contracts';
import { DATE_KEY_PATTERN } from '../../../common/time/dhaka';

export class AdminOrderQueryDto implements AdminOrderQuery {
  @IsOptional()
  @Matches(DATE_KEY_PATTERN, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsString()
  pointCode?: string;

  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  ref?: string;
}

