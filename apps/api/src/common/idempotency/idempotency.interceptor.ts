import {
  type CallHandler,
  type ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { from, lastValueFrom, type Observable } from 'rxjs';
import {
  IDEMPOTENCY_KEY_HEADER,
  IDEMPOTENCY_KEY_PATTERN,
  IDEMPOTENT_REPLAYED_HEADER,
} from '@coastline/api-contracts';
import { conflict, validation } from '../errors/api-errors';
import { IdempotencyService, hashRequestBody } from './idempotency.service';

/**
 * Error statuses that are a deterministic answer to the request body and are
 * replayed like a success. 401/403 depend on who is signed in and 5xx on the
 * moment, so those release the key for a retry instead.
 */
const REPLAYABLE_ERROR_STATUSES = new Set([400, 404, 409, 422]);

/**
 * `Idempotency-Key` handling for booking-creating POST endpoints.
 *
 * - No header: the request runs normally (the header is optional for now).
 * - Malformed header (not 8-128 of `[A-Za-z0-9_-]`): 400.
 * - Scope is the route plus the caller, so two callers never share a key.
 * - Same key, same body: the stored response is returned with the header
 *   `Idempotent-Replayed: true` and nothing is created.
 * - Same key, different body: 409. Same key while the first is running: 409.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly store: IdempotencyService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const key = request.header(IDEMPOTENCY_KEY_HEADER);
    if (key === undefined) {
      return next.handle();
    }
    if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
      throw validation(
        'Idempotency-Key must be 8 to 128 letters, digits, hyphens or underscores.',
        { header: IDEMPOTENCY_KEY_HEADER },
      );
    }

    const actorId = request.actor?.id ?? null;
    const route = `${request.method} ${request.route?.path ?? request.path}`;
    const claim = await this.store.claim({
      scope: `${route}|${actorId ?? 'anonymous'}`,
      key,
      actorUserId: actorId,
      requestHash: hashRequestBody(request.body),
    });

    switch (claim.kind) {
      case 'mismatch':
        throw conflict('This Idempotency-Key was already used with a different request.', {
          reason: 'IDEMPOTENCY_KEY_REUSED',
        });
      case 'in_progress':
        throw conflict('A request with this Idempotency-Key is still being processed.', {
          reason: 'IDEMPOTENCY_KEY_IN_PROGRESS',
        });
      case 'replay':
        response.setHeader(IDEMPOTENT_REPLAYED_HEADER, 'true');
        if (claim.status >= 400) {
          throw new HttpException(claim.body as Record<string, unknown>, claim.status);
        }
        return from([claim.body]);
      case 'new':
        return from(this.run(claim.id, context, next));
    }
  }

  private async run(id: string, context: ExecutionContext, next: CallHandler): Promise<unknown> {
    let body: unknown;
    try {
      body = await lastValueFrom(next.handle());
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      if (error instanceof HttpException && REPLAYABLE_ERROR_STATUSES.has(status)) {
        await this.store.complete(id, status, error.getResponse());
      } else {
        await this.store.release(id);
      }
      throw error;
    }
    await this.store.complete(id, this.successStatus(context), body);
    return body;
  }

  /** The status Nest will send: `@HttpCode` when set, else 201 for POST. */
  private successStatus(context: ExecutionContext): number {
    const explicit = this.reflector.get<number | undefined>(
      HTTP_CODE_METADATA,
      context.getHandler(),
    );
    if (explicit) {
      return explicit;
    }
    return context.switchToHttp().getRequest<Request>().method === 'POST' ? 201 : 200;
  }
}
