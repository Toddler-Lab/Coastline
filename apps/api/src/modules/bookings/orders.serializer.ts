import type {
  AdminOrderDto,
  HotelBookingDto,
  OrderDto,
  OrderItemDto,
  PaymentDto,
} from '@coastline/api-contracts';
import type {
  HotelBooking as PrismaHotelBooking,
  Order as PrismaOrder,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  User as PrismaUser,
} from '@coastline/db';
import { canCancel, dhakaDateTimeToUtc, phaseFor } from '../../common/time/dhaka';
import type { TicketService } from './ticket.service';

export type OrderWithRelations = PrismaOrder & {
  items: PrismaOrderItem[];
  hotelBookings?: PrismaHotelBooking[];
  payments: PrismaPayment[];
  tourist?: PrismaUser;
};

/**
 * Start of the earliest sunbed hour or hotel check-in in the order, or `now`
 * for an order with neither. Drives the tourist cancellation cutoff.
 */
export function earliestOrderStart(
  order: Pick<OrderWithRelations, 'items' | 'hotelBookings'>,
  now: Date = new Date(),
): Date {
  const starts = [
    ...order.items.map((item) => item.startAt.getTime()),
    ...(order.hotelBookings ?? []).map((stay) =>
      dhakaDateTimeToUtc(stay.checkInDate, stay.checkInTime).getTime(),
    ),
  ];
  return starts.length > 0 ? new Date(Math.min(...starts)) : now;
}

export function serializeHotelBooking(booking: PrismaHotelBooking): HotelBookingDto {
  return {
    id: booking.id,
    orderId: booking.orderId,
    hotelId: booking.hotelId,
    hotelName: booking.hotelName,
    hotelSlug: booking.hotelSlug,
    roomTypeId: booking.roomTypeId,
    roomTypeName: booking.roomTypeName,
    roomId: booking.roomId,
    roomNumber: booking.roomNumber,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    checkInTime: booking.checkInTime,
    nights: booking.nights,
    guestsCount: booking.guestsCount,
    nightlyPriceMinor: booking.nightlyPriceMinor,
    totalMinor: booking.totalMinor,
    currency: booking.currency.trim(),
    status: booking.status,
    checkedInAt: booking.checkedInAt ? booking.checkedInAt.toISOString() : null,
  };
}

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
  const hotelBookings = (order.hotelBookings ?? []).map(serializeHotelBooking);
  const payments = order.payments.map((p) => serializePayment(p));

  const earliestStart = earliestOrderStart(order, now);

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
    hotelBookings,
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

