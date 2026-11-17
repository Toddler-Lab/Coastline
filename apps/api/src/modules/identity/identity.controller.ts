import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { ApiEnvelope, SessionUser } from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AllowAnonymous } from '../../common/auth/auth.decorators';
import { CurrentActor } from '../../common/auth/current-actor.decorator';
import type { Actor } from '../../common/auth/actor';
import { notFound } from '../../common/errors/api-errors';
import { WorkspaceScopeService } from '../workspaces/workspace-scope.service';

@ApiTags('identity')
@Controller()
export class IdentityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly scope: WorkspaceScopeService,
  ) {}

  @Get('session')
  async session(@CurrentActor() actor: Actor): Promise<ApiEnvelope<SessionUser>> {
    // Workspace scope is reported so the web app can show the right workspaces;
    // every endpoint still checks scope on its own.
    const [providers, deskDestinations] = await Promise.all([
      actor.role === 'PROVIDER' ? this.scope.memberships(actor.id) : Promise.resolve([]),
      actor.role === 'DESK' ? this.scope.deskDestinationSlugs(actor.id) : Promise.resolve([]),
    ]);
    return {
      data: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
        providers,
        deskDestinations,
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
