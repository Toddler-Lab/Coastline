import { describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Reflector } from '@nestjs/core';
import { DemoAuthGuard } from './demo-auth.guard';
import type { PrismaService } from '../prisma/prisma.service';

function createContext(headers: Record<string, string> = {}): {
  context: ExecutionContext;
  req: { header: (name: string) => string | undefined; actor?: unknown };
} {
  const req = {
    header: (name: string) => headers[name.toLowerCase()],
    actor: undefined,
  };
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
  return { context, req };
}

describe('DemoAuthGuard', () => {
  it('allows anonymous endpoints without a header', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as unknown as Reflector;
    const config = { get: vi.fn().mockReturnValue('true') } as unknown as ConfigService;
    const prisma = {} as PrismaService;

    const guard = new DemoAuthGuard(reflector, config, prisma);
    const { context } = createContext();

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
  });

  it('rejects protected endpoints when no demo header is provided', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as unknown as Reflector;
    const config = { get: vi.fn().mockReturnValue('true') } as unknown as ConfigService;
    const prisma = {} as PrismaService;

    const guard = new DemoAuthGuard(reflector, config, prisma);
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow('Sign in to continue.');
  });

  it.each([
    ['a malformed id', 'not-a-uuid', null],
    ['an unknown user', '00000000-0000-4000-8000-0000000000ff', null],
    [
      'an inactive user',
      '00000000-0000-4000-8000-000000000002',
      { id: '00000000-0000-4000-8000-000000000002', isActive: false },
    ],
  ])('answers %s with the plain sign-in message', async (_label, id, found) => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as unknown as Reflector;
    const config = { get: vi.fn().mockReturnValue('true') } as unknown as ConfigService;
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue(found) },
    } as unknown as PrismaService;

    const guard = new DemoAuthGuard(reflector, config, prisma);
    const { context } = createContext({ 'x-demo-user-id': id });

    const error = await guard.canActivate(context).catch((e: unknown) => e);
    expect((error as Error).message).toBe('Sign in to continue.');
    expect((error as Error).message).not.toMatch(/demo|persona/i);
  });

  it('answers protected endpoints with the sign-in message when the account switch is off', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as unknown as Reflector;
    const config = { get: vi.fn().mockReturnValue('false') } as unknown as ConfigService;
    const guard = new DemoAuthGuard(reflector, config, {} as PrismaService);
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow('Sign in to continue.');
  });

  it('resolves active user into request.actor', async () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as unknown as Reflector;
    const config = { get: vi.fn().mockReturnValue('true') } as unknown as ConfigService;
    const user = {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Rafiq Hasan',
      email: 'rafiq@coastline.demo',
      role: 'TOURIST',
      isActive: true,
    };
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
      },
    } as unknown as PrismaService;

    const guard = new DemoAuthGuard(reflector, config, prisma);
    const { context, req } = createContext({ 'x-demo-user-id': user.id });

    const allowed = await guard.canActivate(context);
    expect(allowed).toBe(true);
    expect(req.actor).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'TOURIST',
    });
  });
});
