import { Injectable } from '@nestjs/common';
import type { Prisma } from '@coastline/db';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AuditInput {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Prisma.InputJsonValue;
  requestId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pass the transaction client when the audit row must commit atomically. */
  async record(
    input: AuditInput,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    await client.auditEvent.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details,
        requestId: input.requestId ?? null,
      },
    });
  }
}
