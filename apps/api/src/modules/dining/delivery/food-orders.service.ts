import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type {
  AdminFoodOrderDto,
  DeliverableBedDto,
  FoodOrderDto,
  FoodOrderListDto,
  FoodOrderStatus,
} from '@coastline/api-contracts';
import {
  FOOD_ORDER_TRANSITIONS,
  MAX_FOOD_ITEM_QUANTITY,
  MAX_FOOD_ORDER_LINES,
} from '@coastline/api-contracts';
import { Prisma } from '@coastline/db';
import type { Actor } from '../../../common/auth/actor';
import { conflict, forbidden, notFound, unprocessable } from '../../../common/errors/api-errors';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { dhakaDateKey, dhakaHour, dhakaHourToUtc, isDateKey } from '../../../common/time/dhaka';
import { AuditActions } from '../../audit/audit.actions';
import { AuditService } from '../../audit/audit.service';
import type { AdminFoodOrderQueryDto } from './dto/admin-food-order-query.dto';
import type { CancelFoodOrderDto } from './dto/cancel-food-order.dto';
import type { CreateFoodOrderDto, CreateFoodOrderLineDto } from './dto/create-food-order.dto';
import type { UpdateFoodOrderStatusDto } from './dto/update-food-order-status.dto';
import {
  FOOD_ORDER_INCLUDE,
  serializeAdminFoodOrder,
  serializeDeliverableBed,
  serializeFoodOrder,
  type FoodOrderWithRelations,
} from './food-orders.serializer';

type Tx = Prisma.TransactionClient;

/** Same shape as sunbed (`BK-`) refs: prefix, Dhaka placement date, 4 hex chars. */
function generateFoodRef(dateKey: string): string {
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `FO-${dateKey.replace(/-/g, '')}-${suffix}`;
}

/** Venue hours are Dhaka wall-clock hours; open while open_hour <= h < close_hour. */
export function isVenueOpen(
  venue: { openHour: number; closeHour: number },
  now: Date = new Date(),
): boolean {
  const hour = dhakaHour(now);
  return venue.openHour <= hour && hour < venue.closeHour;
}

/** Statuses on a sunbed booking line that can still receive food. */
const DELIVERABLE_ITEM_STATUSES = ['RESERVED', 'CHECKED_IN'] as const;

const STATUS_LABELS: Record<FoodOrderStatus, string> = {
  PLACED: 'placed',
  PREPARING: 'being prepared',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

@Injectable()
export class FoodOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Testing aid (`DINING_IGNORE_TIME_RULES=true`): ignore the sunbed booked
   * window and the kitchen opening hours. Off by default; refused in production.
   */
  private get ignoreTimeRules(): boolean {
    const value = this.config.get<boolean | string>('DINING_IGNORE_TIME_RULES');
    return value === true || String(value).trim().toLowerCase() === 'true';
  }

  /* Tourist ---------------------------------------------------------------- */

  async listDeliverableBeds(actor: Actor, now: Date = new Date()): Promise<DeliverableBedDto[]> {
    this.assertTourist(actor);
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: { touristId: actor.id, status: 'CONFIRMED' },
        status: { in: [...DELIVERABLE_ITEM_STATUSES] },
        ...(this.ignoreTimeRules ? {} : { startAt: { lte: now }, endAt: { gt: now } }),
      },
      orderBy: [{ startAt: 'asc' }, { sunbedCode: 'asc' }],
    });
    return items.map(serializeDeliverableBed);
  }

  async createFoodOrder(
    actor: Actor,
    dto: CreateFoodOrderDto,
    requestId?: string,
  ): Promise<FoodOrderDto> {
    this.assertTourist(actor);
    this.validateLines(dto.lines);

    const note = dto.note?.trim() || null;

    const created = await this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // Holds the bed line against a concurrent sunbed cancellation until commit.
      await tx.$queryRaw`SELECT id FROM order_items WHERE id = ${dto.orderItemId}::uuid FOR SHARE`;

      const bed = await tx.orderItem.findFirst({
        where: { id: dto.orderItemId, order: { touristId: actor.id } },
        include: { order: true, sunbed: true },
      });
      if (!bed) {
        throw notFound('That sunbed booking was not found.');
      }
      if (
        bed.order.status !== 'CONFIRMED' ||
        !(DELIVERABLE_ITEM_STATUSES as readonly string[]).includes(bed.status)
      ) {
        throw unprocessable(`Sunbed booking for ${bed.sunbedCode} is cancelled.`);
      }
      if (!this.ignoreTimeRules && (now < bed.startAt || now >= bed.endAt)) {
        throw unprocessable(
          `Food can only be delivered to ${bed.sunbedCode} during its booked hours.`,
        );
      }

      const venue = await tx.diningVenue.findUnique({
        where: { id: dto.venueId },
        include: { beachPoint: true },
      });
      if (!venue || !venue.isActive) {
        throw notFound('That dining venue was not found.');
      }
      if (!venue.deliveryEnabled) {
        throw unprocessable(`${venue.name} does not deliver to sunbeds.`);
      }
      if (!venue.beachPointId || venue.beachPointId !== bed.sunbed.beachPointId) {
        throw unprocessable(
          `${venue.name} only delivers to sunbeds at ${venue.beachPoint?.name ?? 'its own beach'}; ${bed.sunbedCode} is at ${bed.beachPointName}.`,
        );
      }
      if (!this.ignoreTimeRules && !isVenueOpen(venue, now)) {
        throw unprocessable(
          `${venue.name} is closed now. Kitchen hours are ${venue.openHour}:00–${venue.closeHour}:00 (Asia/Dhaka).`,
        );
      }

      const ids = dto.lines.map((line) => line.menuItemId);
      const menuItems = await tx.menuItem.findMany({
        where: { id: { in: ids }, venueId: venue.id },
      });
      const byId = new Map(menuItems.map((item) => [item.id, item]));
      const currency = venue.currency.trim();

      const lines = dto.lines.map((line) => {
        const item = byId.get(line.menuItemId);
        if (!item) {
          throw unprocessable(`One or more items are not on the ${venue.name} menu.`, {
            menuItemId: line.menuItemId,
          });
        }
        if (!item.isAvailable) {
          throw unprocessable(`${item.name} is not available right now.`, {
            menuItemId: item.id,
          });
        }
        if (item.currency.trim() !== currency) {
          throw unprocessable(`${item.name} is priced in a different currency.`);
        }
        return {
          menuItemId: item.id,
          itemName: item.name,
          unitPriceMinor: item.priceMinor,
          quantity: line.quantity,
          totalMinor: item.priceMinor * line.quantity,
        };
      });

      const subtotalMinor = lines.reduce((sum, line) => sum + line.totalMinor, 0);
      // No delivery fee in the MVP: total = subtotal.
      const totalMinor = subtotalMinor;

      const dateKey = dhakaDateKey(now);
      let publicRef = generateFoodRef(dateKey);
      while (await tx.foodOrder.findUnique({ where: { publicRef }, select: { id: true } })) {
        publicRef = generateFoodRef(dateKey);
      }

      const order = await tx.foodOrder.create({
        data: {
          publicRef,
          touristId: actor.id,
          venueId: venue.id,
          orderItemId: bed.id,
          venueCode: venue.code,
          venueName: venue.name,
          sunbedCode: bed.sunbedCode,
          beachPointCode: bed.beachPointCode,
          beachPointName: bed.beachPointName,
          status: 'PLACED',
          subtotalMinor,
          totalMinor,
          currency,
          note,
          placedAt: now,
          items: { create: lines },
          payments: {
            create: {
              type: 'CHARGE',
              provider: 'MOCK',
              status: 'SUCCEEDED',
              amountMinor: totalMinor,
              currency,
              externalRef: `MOCK-${publicRef}`,
            },
          },
        },
        include: FOOD_ORDER_INCLUDE,
      });

      await this.audit.record(
        {
          actorUserId: actor.id,
          action: AuditActions.FOOD_ORDER_PLACED,
          entityType: 'food_order',
          entityId: order.id,
          details: {
            publicRef,
            venueCode: venue.code,
            sunbedCode: bed.sunbedCode,
            orderItemId: bed.id,
            totalMinor,
            lines: lines.map((line) => ({ menuItemId: line.menuItemId, quantity: line.quantity })),
          },
          requestId,
        },
        tx,
      );

      return order;
    });

    return serializeFoodOrder(created);
  }

  async listMine(actor: Actor): Promise<FoodOrderListDto> {
    this.assertTourist(actor);
    const orders = await this.prisma.foodOrder.findMany({
      where: { touristId: actor.id },
      orderBy: { placedAt: 'desc' },
      take: 100,
      include: FOOD_ORDER_INCLUDE,
    });
    return { orders: orders.map(serializeFoodOrder) };
  }

  async getByRef(actor: Actor, publicRef: string): Promise<FoodOrderDto> {
    const order = await this.prisma.foodOrder.findUnique({
      where: { publicRef },
      include: FOOD_ORDER_INCLUDE,
    });
    // Another tourist's order is indistinguishable from a missing one.
    if (!order || (actor.role !== 'ADMIN' && order.touristId !== actor.id)) {
      throw notFound(`Food order ${publicRef} was not found.`);
    }
    return serializeFoodOrder(order);
  }

  async cancelByTourist(
    actor: Actor,
    publicRef: string,
    dto: CancelFoodOrderDto,
    requestId?: string,
  ): Promise<FoodOrderDto> {
    this.assertTourist(actor);
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.foodOrder.findUnique({ where: { publicRef } });
      if (!order || order.touristId !== actor.id) {
        throw notFound(`Food order ${publicRef} was not found.`);
      }
      if (order.status !== 'PLACED') {
        throw conflict(
          `Food order ${publicRef} is already ${STATUS_LABELS[order.status]} and can no longer be cancelled.`,
        );
      }
      return this.applyTransition(tx, order, 'CANCELLED', actor, {
        reason: dto.reason?.trim() || 'Cancelled by visitor',
        requestId,
      });
    });
    return serializeFoodOrder(updated);
  }

  /* Kitchen (ADMIN) -------------------------------------------------------- */

  async listForKitchen(query: AdminFoodOrderQueryDto): Promise<AdminFoodOrderDto[]> {
    const where: Prisma.FoodOrderWhereInput = {};
    if (query.venueCode?.trim()) {
      where.venueCode = query.venueCode.trim().toUpperCase();
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.date !== undefined) {
      if (!isDateKey(query.date)) {
        throw unprocessable('date must be a real calendar date (YYYY-MM-DD).');
      }
      where.placedAt = {
        gte: dhakaHourToUtc(query.date, 0),
        lt: dhakaHourToUtc(query.date, 24),
      };
    }

    const orders = await this.prisma.foodOrder.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: 200,
      include: FOOD_ORDER_INCLUDE,
    });
    return orders.map(serializeAdminFoodOrder);
  }

  async changeStatus(
    actor: Actor,
    publicRef: string,
    dto: UpdateFoodOrderStatusDto,
    requestId?: string,
  ): Promise<AdminFoodOrderDto> {
    const target = dto.status;
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.foodOrder.findUnique({ where: { publicRef } });
      if (!order) {
        throw notFound(`Food order ${publicRef} was not found.`);
      }
      if (!FOOD_ORDER_TRANSITIONS[order.status].includes(target)) {
        throw conflict(
          `Food order ${publicRef} is ${STATUS_LABELS[order.status]} and cannot move to ${target}.`,
          { from: order.status, to: target, allowed: FOOD_ORDER_TRANSITIONS[order.status] },
        );
      }
      return this.applyTransition(tx, order, target, actor, {
        reason: target === 'CANCELLED' ? dto.reason?.trim() || 'Cancelled by kitchen' : null,
        requestId,
      });
    });
    return serializeAdminFoodOrder(updated);
  }

  /* Internals -------------------------------------------------------------- */

  /**
   * Moves an order one step. The update is conditional on the status the
   * caller validated, so two racing moves cannot both succeed: the loser
   * matches zero rows and gets a 409. Cancelling records a mock refund by
   * reversal; the original charge row is never touched.
   */
  private async applyTransition(
    tx: Tx,
    order: {
      id: string;
      publicRef: string;
      status: FoodOrderStatus;
      totalMinor: number;
      currency: string;
    },
    target: FoodOrderStatus,
    actor: Actor,
    options: { reason: string | null; requestId?: string },
  ): Promise<FoodOrderWithRelations> {
    const now = new Date();
    const data: Prisma.FoodOrderUncheckedUpdateManyInput = { status: target };
    switch (target) {
      case 'PREPARING':
        data.preparingAt = now;
        break;
      case 'READY':
        data.readyAt = now;
        break;
      case 'DELIVERED':
        data.deliveredAt = now;
        break;
      case 'CANCELLED':
        data.cancelledAt = now;
        data.cancelReason = options.reason;
        data.cancelledById = actor.id;
        break;
      default:
        break;
    }

    const result = await tx.foodOrder.updateMany({
      where: { id: order.id, status: order.status },
      data,
    });
    if (result.count !== 1) {
      throw conflict(
        `Food order ${order.publicRef} was just updated by someone else. Reload and try again.`,
      );
    }

    if (target === 'CANCELLED') {
      await tx.payment.create({
        data: {
          foodOrderId: order.id,
          type: 'REFUND',
          provider: 'MOCK',
          status: 'SUCCEEDED',
          amountMinor: order.totalMinor,
          currency: order.currency.trim(),
          // Unique ref: a second refund for the same order cannot be written.
          externalRef: `MOCK-REFUND-${order.publicRef}`,
        },
      });
    }

    await this.audit.record(
      {
        actorUserId: actor.id,
        action:
          target === 'CANCELLED'
            ? AuditActions.FOOD_ORDER_CANCELLED
            : AuditActions.FOOD_ORDER_STATUS_CHANGED,
        entityType: 'food_order',
        entityId: order.id,
        details: {
          publicRef: order.publicRef,
          from: order.status,
          to: target,
          byRole: actor.role,
          ...(target === 'CANCELLED'
            ? { reason: options.reason, refundMinor: order.totalMinor }
            : {}),
        },
        requestId: options.requestId,
      },
      tx,
    );

    return tx.foodOrder.findUniqueOrThrow({
      where: { id: order.id },
      include: FOOD_ORDER_INCLUDE,
    });
  }

  private assertTourist(actor: Actor): void {
    if (actor.role !== 'TOURIST') {
      throw forbidden(
        'Food delivery belongs to tourist personas. Switch persona to a tourist in the header.',
      );
    }
  }

  private validateLines(lines: CreateFoodOrderLineDto[]): void {
    if (lines.length === 0) {
      throw unprocessable('Add at least one menu item.');
    }
    if (lines.length > MAX_FOOD_ORDER_LINES) {
      throw unprocessable(`An order can have at most ${MAX_FOOD_ORDER_LINES} different items.`);
    }
    const seen = new Set<string>();
    for (const line of lines) {
      if (line.quantity < 1 || line.quantity > MAX_FOOD_ITEM_QUANTITY) {
        throw unprocessable(`Quantity must be between 1 and ${MAX_FOOD_ITEM_QUANTITY}.`, {
          menuItemId: line.menuItemId,
        });
      }
      if (seen.has(line.menuItemId)) {
        throw unprocessable('Each menu item may appear only once; change its quantity instead.', {
          menuItemId: line.menuItemId,
        });
      }
      seen.add(line.menuItemId);
    }
  }
}
