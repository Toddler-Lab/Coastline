import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma/prisma.service';
import { AllowAnonymous } from '../common/auth/auth.decorators';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health/live')
  @AllowAnonymous()
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('health/ready')
  @AllowAnonymous()
  async ready(): Promise<{ status: 'ok'; database: 'up' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up' };
    } catch {
      throw new ServiceUnavailableException({
        code: 'INTERNAL_ERROR',
        message: 'Database is not ready.',
      });
    }
  }
}
