import { describe, expect, it, vi } from 'vitest';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function createContext(actor?: { role: string }): { context: ExecutionContext } {
  const req = { actor };
  const context = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
  return { context };
}

describe('RolesGuard', () => {
  it('allows access when no roles are required', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const { context } = createContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when actor has the required role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const { context } = createContext({ role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException when actor has an incorrect role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['ADMIN']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    const { context } = createContext({ role: 'TOURIST' });

    expect(() => guard.canActivate(context)).toThrow('Your role cannot perform this action.');
  });
});
