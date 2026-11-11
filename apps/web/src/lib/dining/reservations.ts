import type {
  ReservationDto,
  ReservationStatus,
  TableAvailability,
} from '@coastline/api-contracts';
import { MAX_RESERVATION_HOURS } from '@coastline/api-contracts';
import { formatIsoDate, formatIsoTime } from '@/lib/format';

export type ReservationTone = 'neutral' | 'sea' | 'sand' | 'success' | 'warn' | 'danger';

/** Path of the tourist-facing reservation detail page. */
export function reservationHref(publicRef: string): string {
  return `/food/reservations/${encodeURIComponent(publicRef)}`;
}

export function reservationStatusPresentation(status: ReservationStatus): {
  label: string;
  tone: ReservationTone;
} {
  switch (status) {
    case 'CHECKED_IN':
      return { label: 'Checked in', tone: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'danger' };
    default:
      return { label: 'Confirmed', tone: 'sea' };
  }
}

/** "Fri 14 Nov · 19:00–21:00" in Asia/Dhaka. */
export function reservationWindowLabel(
  reservation: Pick<ReservationDto, 'startAt' | 'endAt'>,
): string {
  return `${formatIsoDate(reservation.startAt)} · ${formatIsoTime(reservation.startAt)}–${formatIsoTime(reservation.endAt)}`;
}

export function reservationHours(reservation: Pick<ReservationDto, 'startAt' | 'endAt'>): number {
  return Math.max(
    1,
    Math.round((Date.parse(reservation.endAt) - Date.parse(reservation.startAt)) / 3_600_000),
  );
}

/**
 * Longest run of consecutive free hours on `table` starting at `startsAt`,
 * capped at the reservation maximum. 0 when the start itself is taken.
 */
export function maxConsecutiveHours(table: TableAvailability, startsAt: string): number {
  const index = table.slots.findIndex((slot) => slot.startsAt === startsAt);
  if (index < 0) return 0;
  let count = 0;
  for (let i = index; i < table.slots.length && count < MAX_RESERVATION_HOURS; i += 1) {
    if (!table.slots[i].available) break;
    count += 1;
  }
  return count;
}

/** Explains a 409 from the reservation API in visitor language. */
export function describeReservationConflict(details: unknown): string | null {
  if (details && typeof details === 'object' && 'reason' in details) {
    const reason = (details as { reason?: unknown }).reason;
    if (reason === 'SLOT_TAKEN') {
      return 'Someone reserved that table for one of those hours a moment ago. The grid has been refreshed — pick another slot.';
    }
  }
  return null;
}
