import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import type { TicketDto } from '@coastline/api-contracts';

const TICKET_SECRET = process.env.TICKET_SECRET || 'coastline-demo-ticket-secret-2026';

@Injectable()
export class TicketService {
  sign(publicRef: string): string {
    return createHmac('sha256', TICKET_SECRET)
      .update(publicRef)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();
  }

  buildPayload(publicRef: string): string {
    return `COASTLINE:${publicRef}:${this.sign(publicRef)}`;
  }

  verify(payload: string): { valid: boolean; publicRef?: string } {
    const trimmed = (payload || '').trim();
    const parts = trimmed.split(':');
    if (parts.length !== 3 || parts[0] !== 'COASTLINE') {
      return { valid: false };
    }
    const [, publicRef, sig] = parts;
    const expected = this.sign(publicRef);
    if (sig.toUpperCase() !== expected.toUpperCase()) {
      return { valid: false, publicRef };
    }
    return { valid: true, publicRef };
  }

  ticketFor(publicRef: string, status: string): TicketDto | null {
    if (status !== 'CONFIRMED') {
      return null;
    }
    return {
      payload: this.buildPayload(publicRef),
      code: publicRef,
    };
  }
}
