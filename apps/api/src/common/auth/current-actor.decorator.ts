import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Actor } from './actor';

/** Resident actor resolved by DemoAuthGuard. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor => {
    const request = context.switchToHttp().getRequest<Request>();
    return request.actor as Actor;
  },
);
