import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@coastline/db';
import { PrismaService } from '../prisma/prisma.service';

/** How long a stored response can be replayed. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export type IdempotencyClaim =
  | { kind: 'new'; id: string }
  | { kind: 'replay'; status: number; body: unknown }
  | { kind: 'mismatch' }
  | { kind: 'in_progress' };

export interface ClaimInput {
  scope: string;
  key: string;
  actorUserId: string | null;
  requestHash: string;
}

/** JSON with object keys sorted at every level, so key order never changes the hash. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function hashRequestBody(body: unknown): string {
  return createHash('sha256').update(canonicalJson(body)).digest('hex');
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * Persistence for `Idempotency-Key`. Inserting the row is the claim: the
 * unique (scope, key) index lets exactly one of several concurrent duplicates
 * through, so only one of them can create a booking.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async claim(input: ClaimInput, now: Date = new Date()): Promise<IdempotencyClaim> {
    // Two passes: the second follows the removal of an expired or released row.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const row = await this.prisma.idempotencyKey.create({
          data: { ...input, expiresAt: new Date(now.getTime() + IDEMPOTENCY_TTL_MS) },
          select: { id: true },
        });
        return { kind: 'new', id: row.id };
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
      }

      const existing = await this.prisma.idempotencyKey.findUnique({
        where: { scope_key: { scope: input.scope, key: input.key } },
      });
      if (!existing) {
        continue;
      }
      if (existing.expiresAt <= now) {
        await this.prisma.idempotencyKey.deleteMany({
          where: { id: existing.id, expiresAt: { lte: now } },
        });
        continue;
      }
      if (existing.requestHash !== input.requestHash) {
        return { kind: 'mismatch' };
      }
      if (existing.responseStatus === null) {
        return { kind: 'in_progress' };
      }
      return { kind: 'replay', status: existing.responseStatus, body: existing.responseBody };
    }
    return { kind: 'in_progress' };
  }

  /** Stores the final response so a retry replays it. */
  async complete(id: string, status: number, body: unknown): Promise<void> {
    const json = JSON.parse(JSON.stringify(body ?? null)) as Prisma.InputJsonValue;
    await this.prisma.idempotencyKey.update({
      where: { id },
      data: { responseStatus: status, responseBody: json },
    });
  }

  /** Frees the key after a response that must not be replayed (5xx, auth). */
  async release(id: string): Promise<void> {
    await this.prisma.idempotencyKey.deleteMany({ where: { id, responseStatus: null } });
  }
}
