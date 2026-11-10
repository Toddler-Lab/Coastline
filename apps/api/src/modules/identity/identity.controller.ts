import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { ApiEnvelope, SessionUser } from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AllowAnonymous } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import type { Actor } from '../../common/auth/actor';
import { notFound } from '../../common/errors/api-errors';

@ApiTags('identity')
@Controller()
export class IdentityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get('session')
  session(@CurrentActor() actor: Actor): ApiEnvelope<SessionUser> {
    return {
      data: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
      },
    };
  }

  /** Dev-only persona directory for the role switcher. */
  @Get('demo/users')
  @AllowAnonymous()
  async demoUsers(): Promise<ApiEnvelope<SessionUser[]>> {
    if (!this.demoEnabled()) {
      throw notFound('Not found.');
    }

    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, email: true, role: true },
    });

    return {
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    };
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
