import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOW_ANONYMOUS } from './auth.decorators';
import { unauthenticated } from '../errors/api-errors';
import type { Actor } from './actor';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Development identity resolver.
 *
 * The client sends `x-demo-user-id`; the role always comes from the database.
 * This is the only place that knows how an actor is established, so real
 * NID/visa authentication can replace it without touching domain services.
 */
@Injectable()
export class DemoAuthGuard implements CanActivate {
  private readonly logger = new Logger(DemoAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const anonymous = this.reflector.getAllAndOverride<boolean>(ALLOW_ANONYMOUS, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<Request>();

    if (!this.demoEnabled()) {
      if (anonymous) {
        return true;
      }
      throw unauthenticated('Demo authentication is disabled.');
    }

    const userId = request.header('x-demo-user-id');
    if (!userId) {
      if (anonymous) {
        return true;
      }
      throw unauthenticated('Choose a demo user to continue.');
    }

    if (!UUID_PATTERN.test(userId)) {
      throw unauthenticated('Unknown demo user.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw unauthenticated('Unknown demo user.');
    }

    const actor: Actor = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    request.actor = actor;
    return true;
  }

  private demoEnabled(): boolean {
    const value = this.config.get<boolean | string>('DEMO_AUTH_ENABLED');
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = (value ?? 'true').toString().trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
}
