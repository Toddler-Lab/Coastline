import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { IDEMPOTENCY_KEY_HEADER } from '@coastline/api-contracts';
import { IdempotencyInterceptor } from './idempotency.interceptor';

/** Marks a POST handler as honouring the optional `Idempotency-Key` header. */
export function Idempotent(): MethodDecorator {
  return applyDecorators(
    UseInterceptors(IdempotencyInterceptor),
    ApiHeader({
      name: IDEMPOTENCY_KEY_HEADER,
      required: false,
      description:
        'Optional. 8-128 characters of [A-Za-z0-9_-], new for every attempt. A retry with the ' +
        'same key and body returns the first response (header Idempotent-Replayed: true) ' +
        'without creating anything; the same key with a different body returns 409.',
    }),
  );
}
