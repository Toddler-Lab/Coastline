import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { Role } from '@coastline/api-contracts';
import { REQUIRED_ROLES } from './auth.decorators';
import { forbidden } from '../errors/api-errors';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const actor = request.actor;

    if (!actor) {
      throw forbidden('This action needs a signed-in user.');
    }
    if (!required.includes(actor.role)) {
      throw forbidden('Your role cannot perform this action.');
    }
    return true;
  }
}
