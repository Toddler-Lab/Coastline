import {
  ConflictException,
  ForbiddenException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { hashRequestBody, type IdempotencyService } from './idempotency.service';

function contextFor(body: unknown): ExecutionContext {
  const request = {
    method: 'POST',
    route: { path: '/api/v1/orders' },
    path: '/api/v1/orders',
    body,
    actor: { id: 'user-1' },
    header: (name: string) => (name === 'Idempotency-Key' ? 'unit-key-0001' : undefined),
  };
  const response = { setHeader: vi.fn() };
  return {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    getHandler: () => function handler() {},
  } as unknown as ExecutionContext;
}

function storeDouble() {
  return {
    claim: vi.fn().mockResolvedValue({ kind: 'new', id: 'row-1' }),
    complete: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
  };
}

async function run(store: ReturnType<typeof storeDouble>, handler: CallHandler): Promise<unknown> {
  const interceptor = new IdempotencyInterceptor(
    store as unknown as IdempotencyService,
    new Reflector(),
  );
  return lastValueFrom(await interceptor.intercept(contextFor({ a: 1 }), handler));
}

describe('IdempotencyInterceptor (unit)', () => {
  it('stores a success with status 201 and scopes the key to route and caller', async () => {
    const store = storeDouble();
    await expect(run(store, { handle: () => of({ data: 'ok' }) })).resolves.toEqual({ data: 'ok' });
    expect(store.claim).toHaveBeenCalledWith({
      scope: 'POST /api/v1/orders|user-1',
      key: 'unit-key-0001',
      actorUserId: 'user-1',
      requestHash: hashRequestBody({ a: 1 }),
    });
    expect(store.complete).toHaveBeenCalledWith('row-1', 201, { data: 'ok' });
  });

  it('stores a deterministic 4xx domain error', async () => {
    const store = storeDouble();
    const error = new ConflictException({ code: 'CONFLICT', message: 'Taken' });
    await expect(run(store, { handle: () => throwError(() => error) })).rejects.toBe(error);
    expect(store.complete).toHaveBeenCalledWith('row-1', 409, {
      code: 'CONFLICT',
      message: 'Taken',
    });
    expect(store.release).not.toHaveBeenCalled();
  });

  it('never stores a 5xx: the key is released for a retry', async () => {
    const store = storeDouble();
    const error = new Error('database went away');
    await expect(run(store, { handle: () => throwError(() => error) })).rejects.toBe(error);
    expect(store.complete).not.toHaveBeenCalled();
    expect(store.release).toHaveBeenCalledWith('row-1');
  });

  it('does not store an authorization failure', async () => {
    const store = storeDouble();
    const error = new ForbiddenException();
    await expect(run(store, { handle: () => throwError(() => error) })).rejects.toBe(error);
    expect(store.complete).not.toHaveBeenCalled();
    expect(store.release).toHaveBeenCalledWith('row-1');
  });
});

describe('hashRequestBody', () => {
  it('ignores key order and undefined fields but not values', () => {
    expect(hashRequestBody({ a: 1, b: [1, { c: 2, d: 3 }] })).toBe(
      hashRequestBody({ b: [1, { d: 3, c: 2 }], a: 1, e: undefined }),
    );
    expect(hashRequestBody({ a: 1 })).not.toBe(hashRequestBody({ a: 2 }));
    expect(hashRequestBody({ a: [1, 2] })).not.toBe(hashRequestBody({ a: [2, 1] }));
  });
});
