import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Actor } from '../../common/auth/actor';
import { OrdersService } from './orders.service';
import { TicketService } from './ticket.service';
import type { PrismaService } from '../../common/prisma/prisma.service';
import type { AuditService } from '../audit/audit.service';
import type { CatalogueService } from '../catalogue/catalogue.service';
import { addHours, dhakaDateKey, dhakaHourToUtc } from '../../common/time/dhaka';

describe('OrdersService (unit)', () => {
  let service: OrdersService;
  let prisma: any;
  let audit: any;
  let ticketService: TicketService;
  let catalogue: any;

  const touristActor: Actor = {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Test Tourist',
    email: 'tourist@test.example',
    role: 'TOURIST',
  };

  const adminActor: Actor = {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Test Admin',
    email: 'admin@test.example',
    role: 'ADMIN',
  };

  beforeEach(() => {
    prisma = {
      sunbed: {
        findMany: vi.fn(),
      },
      order: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
      bookingSlot: {
        findMany: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
      },
      orderItem: {
        updateMany: vi.fn(),
      },
      payment: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    audit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    catalogue = {
      list: vi.fn().mockResolvedValue({ data: [] }),
    };

    ticketService = new TicketService();
    service = new OrdersService(prisma as unknown as PrismaService, audit as unknown as AuditService, ticketService, catalogue as unknown as CatalogueService);
  });

  describe('TicketService', () => {
    it('signs and verifies valid tickets', () => {
      const payload = ticketService.buildPayload('BK-20261111-ABCD');
      expect(payload).toMatch(/^COASTLINE:BK-20261111-ABCD:[A-F0-9]{16}$/);

      const check = ticketService.verify(payload);
      expect(check.valid).toBe(true);
      expect(check.publicRef).toBe('BK-20261111-ABCD');
    });

    it('rejects tampered ticket payload', () => {
      const check = ticketService.verify('COASTLINE:BK-20261111-ABCD:BADSIG0000000000');
      expect(check.valid).toBe(false);
    });
  });

  describe('createOrder', () => {
    it('rejects booking if actor is admin', async () => {
      await expect(
        service.createOrder(adminActor, {
          items: [{ sunbedId: 'bed-1', startsAt: '2026-11-11T10:00:00.000Z', hours: 1 }],
        }),
      ).rejects.toThrow(/Admins cannot place tourist bookings/);
    });

    it('rejects booking if more than 6 beds are requested', async () => {
      const items = Array.from({ length: 7 }, (_, i) => ({
        sunbedId: `bed-${i}`,
        startsAt: '2026-11-11T10:00:00.000Z',
        hours: 1,
      }));

      await expect(service.createOrder(touristActor, { items })).rejects.toThrow(
        /at most 6 sunbeds/,
      );
    });

    it('creates a confirmed order with calculation, ticket and audit', async () => {
      const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
      const tomorrowKey = dhakaDateKey(tomorrow);
      const startsAt = dhakaHourToUtc(tomorrowKey, 10).toISOString();

      const mockBed = {
        id: 'bed-1',
        code: 'KOL-01',
        hourlyPriceMinor: 10000,
        currency: 'BDT',
        status: 'AVAILABLE',
        beachPoint: {
          code: 'KOL',
          name: 'Kolatoli',
          openHour: 8,
          closeHour: 18,
        },
      };

      prisma.sunbed.findMany.mockResolvedValue([mockBed]);
      prisma.bookingSlot.findMany.mockResolvedValue([]); // No conflicts

      const mockCreatedOrder = {
        id: 'order-1',
        publicRef: 'BK-20261111-A1B2',
        touristId: touristActor.id,
        status: 'CONFIRMED',
        subtotalMinor: 20000,
        totalMinor: 20000,
        currency: 'BDT',
        placedAt: new Date(),
        cancelledAt: null,
        cancelReason: null,
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            sunbedId: 'bed-1',
            sunbedCode: 'KOL-01',
            beachPointCode: 'KOL',
            beachPointName: 'Kolatoli',
            startAt: new Date(startsAt),
            endAt: addHours(new Date(startsAt), 2),
            unitPriceMinor: 10000,
            totalMinor: 20000,
            status: 'RESERVED',
            checkedInAt: null,
          },
        ],
        payments: [
          {
            id: 'pay-1',
            orderId: 'order-1',
            type: 'CHARGE',
            provider: 'MOCK',
            status: 'SUCCEEDED',
            amountMinor: 20000,
            currency: 'BDT',
            externalRef: 'MOCK-BK-20261111-A1B2',
            createdAt: new Date(),
          },
        ],
        tourist: {
          id: touristActor.id,
          name: touristActor.name,
          email: touristActor.email,
        },
      };

      prisma.order.create = vi.fn().mockResolvedValue(mockCreatedOrder);

      const result = await service.createOrder(touristActor, {
        items: [{ sunbedId: 'bed-1', startsAt, hours: 2 }],
      });

      expect(result.status).toBe('CONFIRMED');
      expect(result.totalMinor).toBe(20000);
      expect(result.ticket).not.toBeNull();
      expect(audit.record).toHaveBeenCalled();
    });
  });

  describe('getOrder', () => {
    it('returns order for owner', async () => {
      const mockOrder = {
        id: 'order-1',
        publicRef: 'BK-20261111-XYZ',
        touristId: touristActor.id,
        status: 'CONFIRMED',
        subtotalMinor: 10000,
        totalMinor: 10000,
        currency: 'BDT',
        placedAt: new Date(),
        cancelledAt: null,
        cancelReason: null,
        items: [],
        payments: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrder(touristActor, 'BK-20261111-XYZ');
      expect(result.publicRef).toBe('BK-20261111-XYZ');
    });

    it('rejects another tourist from viewing private order with 404', async () => {
      const mockOrder = {
        id: 'order-1',
        publicRef: 'BK-20261111-XYZ',
        touristId: 'different-tourist-id',
        status: 'CONFIRMED',
        subtotalMinor: 10000,
        totalMinor: 10000,
        currency: 'BDT',
        placedAt: new Date(),
        cancelledAt: null,
        cancelReason: null,
        items: [],
        payments: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.getOrder(touristActor, 'BK-20261111-XYZ')).rejects.toThrow(
        /not found/,
      );
    });

    it('allows admin to view any order', async () => {
      const mockOrder = {
        id: 'order-1',
        publicRef: 'BK-20261111-XYZ',
        touristId: 'any-tourist-id',
        status: 'CONFIRMED',
        subtotalMinor: 10000,
        totalMinor: 10000,
        currency: 'BDT',
        placedAt: new Date(),
        cancelledAt: null,
        cancelReason: null,
        items: [],
        payments: [],
      };

      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrder(adminActor, 'BK-20261111-XYZ');
      expect(result.publicRef).toBe('BK-20261111-XYZ');
    });
  });
});

