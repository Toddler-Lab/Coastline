import type {
  AdminOrderDto,
  OrderDto,
  OrderItemDto,
  PaymentDto,
} from '@coastline/api-contracts';
import type {
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  User as PrismaUser,
} from '@coastline/db';
import { canCancel, phaseFor } from '../../common/time/dhaka';
import type { TicketService } from './ticket.service';

export type OrderWithRelations = PrismaOrder & {
  items: PrismaOrderItem[];
  payments: PrismaPayment[];
  tourist?: PrismaUser;
};

export function serializeItem(
  item: PrismaOrderItem,
  orderStatus: string,
  now: Date = new Date(),
): OrderItemDto {
  const effectiveStatus = orderStatus === 'CANCELLED' ? 'CANCELLED' : item.status;
  const phase = phaseFor(item.startAt, item.endAt, effectiveStatus, now);

  return {
    id: item.id,
    sunbedId: item.sunbedId,
    sunbedCode: item.sunbedCode,
    beachPointCode: item.beachPointCode,
    beachPointName: item.beachPointName,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt.toISOString(),
    unitPriceMinor: item.unitPriceMinor,
    totalMinor: item.totalMinor,
    status: effectiveStatus,
    phase,
    checkedInAt: item.checkedInAt ? item.checkedInAt.toISOString() : null,
  };
}

export function serializePayment(payment: PrismaPayment): PaymentDto {
  return {
    id: payment.id,
    type: payment.type,
    provider: payment.provider,
    status: payment.status,
    amountMinor: payment.amountMinor,
    currency: payment.currency.trim(),
    externalRef: payment.externalRef,
    createdAt: payment.createdAt.toISOString(),
  };
}

export function serializeOrder(
  order: OrderWithRelations,
  ticketService: TicketService,
  now: Date = new Date(),
): OrderDto {
  const items = order.items.map((item) => serializeItem(item, order.status, now));
  const payments = order.payments.map((p) => serializePayment(p));

  const earliestStart =
    order.items.length > 0
      ? new Date(Math.min(...order.items.map((item) => item.startAt.getTime())))
      : new Date();

  const cancellable = canCancel(earliestStart, order.status, now);

  return {
    id: order.id,
    publicRef: order.publicRef,
    status: order.status,
    subtotalMinor: order.subtotalMinor,
    totalMinor: order.totalMinor,
    currency: order.currency.trim(),
    placedAt: order.placedAt.toISOString(),
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    cancelReason: order.cancelReason,
    items,
    payments,
    ticket: ticketService.ticketFor(order.publicRef, order.status),
    canCancel: cancellable,
  };
}

export function serializeAdminOrder(
  order: OrderWithRelations,
  ticketService: TicketService,
  now: Date = new Date(),
): AdminOrderDto {
  const base = serializeOrder(order, ticketService, now);
  return {
    ...base,
    tourist: {
      id: order.tourist?.id ?? order.touristId,
      name: order.tourist?.name ?? 'Tourist',
      email: order.tourist?.email ?? null,
    },
  };
}
