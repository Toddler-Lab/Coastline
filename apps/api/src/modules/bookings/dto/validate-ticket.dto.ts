import { IsNotEmpty, IsString } from 'class-validator';
import type { ValidateTicketRequest } from '@coastline/api-contracts';

export class ValidateTicketDto implements ValidateTicketRequest {
  @IsString()
  @IsNotEmpty()
  payload!: string;
}
