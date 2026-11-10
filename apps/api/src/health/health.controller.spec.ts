import { describe, expect, it, vi } from 'vitest';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';
import type { PrismaService } from '../common/prisma/prisma.service';

describe('HealthController', () => {
  it('returns status ok for live probe', () => {
    const prisma = {} as PrismaService;
    const controller = new HealthController(prisma);

    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ok and database up for ready probe when database responds', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    } as unknown as PrismaService;

    const controller = new HealthController(prisma);
    const result = await controller.ready();

    expect(result).toEqual({ status: 'ok', database: 'up' });
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('throws ServiceUnavailableException when database query fails', async () => {
    const prisma = {
      $queryRaw: vi.fn().mockRejectedValue(new Error('Connection failed')),
    } as unknown as PrismaService;

    const controller = new HealthController(prisma);

    await expect(controller.ready()).rejects.toThrow(ServiceUnavailableException);
  });
});
