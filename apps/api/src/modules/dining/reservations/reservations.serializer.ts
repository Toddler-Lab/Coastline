import type {
  AdminReservationDto,
  OrderPhase,
  ReservationDto,
} from '@coastline/api-contracts';
import type {
  Payment as PrismaPayment,
  TableReservation as PrismaReservation,
  User as PrismaUser,
} from '@coastline/db';
import type { Prisma } from '@coastline/db';
import { canCancel } from '../../../common/time/dhaka';
import { serializePayment } from '../../bookings/orders.serializer';
import type { TicketService } from '../../bookings/ticket.service';

export type ReservationWithRelations = PrismaReservation & {
  payments: PrismaPayment[];
  tourist?: PrismaUser;
};

/** Relations every reservation read loads, so serializers see the same shape. */
export const RESERVATION_INCLUDE = {
  payments: { orderBy: { createdAt: 'asc' } },
  tourist: true,
} satisfies Prisma.TableReservationInclude;

export function reservationPhase(
  reservation: Pick<PrismaReservation, 'status' | 'startAt' | 'endAt'>,
  now: Date = new Date(),
): OrderPhase {
  if (reservation.status === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (now < reservation.startAt) {
    return 'UPCOMING';
  }
  if (now < reservation.endAt) {
    return 'ACTIVE';
  }
  return 'PAST';
}

export function serializeReservation(
  reservation: ReservationWithRelations,
  ticketService: TicketService,
  now: Date = new Date(),
): ReservationDto {
  return {
    id: reservation.id,
    publicRef: reservation.publicRef,
    status: reservation.status,
    venue: { code: reservation.venueCode, name: reservation.venueName },
    table: { code: reservation.tableCode },
    partySize: reservation.partySize,
    startAt: reservation.startAt.toISOString(),
    endAt: reservation.endAt.toISOString(),
    phase: reservationPhase(reservation, now),
    depositMinor: reservation.depositMinor,
    currency: reservation.currency.trim(),
    note: reservation.note,
    placedAt: reservation.placedAt.toISOString(),
    cancelledAt: reservation.cancelledAt ? reservation.cancelledAt.toISOString() : null,
    cancelReason: reservation.cancelReason,
    checkedInAt: reservation.checkedInAt ? reservation.checkedInAt.toISOString() : null,
    // The shared signer is reference-agnostic; it only issues a ticket while CONFIRMED
    // and the reservation has not ended.
    ticket:
      reservation.endAt > now
        ? ticketService.ticketFor(reservation.publicRef, reservation.status)
        : null,
    canCancel: canCancel(reservation.startAt, reservation.status, now),
    payments: reservation.payments.map(serializePayment),
  };
}

export function serializeAdminReservation(
  reservation: ReservationWithRelations,
  ticketService: TicketService,
  now: Date = new Date(),
): AdminReservationDto {
  return {
    ...serializeReservation(reservation, ticketService, now),
    tourist: {
      id: reservation.tourist?.id ?? reservation.touristId,
      name: reservation.tourist?.name ?? 'Tourist',
      email: reservation.tourist?.email ?? null,
    },
  };
}
