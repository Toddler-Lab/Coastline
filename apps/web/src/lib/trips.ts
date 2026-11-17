import type { FoodOrderDto, OrderDto, OrderPhase, ReservationDto } from '@coastline/api-contracts';
import type { ServiceKey } from './services';
import type { Tone } from './tone';
import { orderPhase } from './booking';
import { foodStatusPresentation } from './dining/delivery';
import { reservationStatusPresentation } from './dining/reservations';
import { dhakaDateKey, formatDateKey, formatIsoTime, formatTimeRange, slotLabel } from './format';

/** One row in the Trips timeline, whatever engine it came from (WP-12). */
export interface TripItem {
  ref: string;
  service: ServiceKey;
  title: string;
  subtitle: string;
  /** Dhaka date the trip starts on. */
  dateKey: string;
  /** Sort key: UTC start instant. */
  startAt: string;
  timeLabel: string;
  phase: OrderPhase;
  status: { label: string; tone: Tone };
  amountMinor: number;
  currency: string;
  /** Food orders in progress are "live". */
  live: boolean;
}

export type TripRefKind = 'order' | 'reservation' | 'food';

export function tripRefKind(ref: string): TripRefKind | null {
  if (/^(BK|HTL)-/i.test(ref)) return 'order';
  if (/^RS-/i.test(ref)) return 'reservation';
  if (/^FO-/i.test(ref)) return 'food';
  return null;
}

function phaseStatus(phase: OrderPhase): { label: string; tone: Tone } {
  switch (phase) {
    case 'ACTIVE':
      return { label: 'Happening now', tone: 'success' };
    case 'UPCOMING':
      return { label: 'Confirmed', tone: 'info' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'danger' };
    default:
      return { label: 'Completed', tone: 'neutral' };
  }
}

export function orderToTrip(order: OrderDto): TripItem {
  const phase = orderPhase(order);
  const hotel = order.hotelBookings?.[0];
  if (hotel) {
    const startAt = `${hotel.checkInDate}T${hotel.checkInTime || '14:00'}:00.000+06:00`;
    return {
      ref: order.publicRef,
      service: 'stay',
      title: hotel.hotelName,
      subtitle: `${hotel.roomTypeName} · ${hotel.nights} ${hotel.nights === 1 ? 'night' : 'nights'} · ${hotel.guestsCount} ${hotel.guestsCount === 1 ? 'guest' : 'guests'}`,
      dateKey: hotel.checkInDate,
      startAt: new Date(startAt).toISOString(),
      timeLabel: `${formatDateKey(hotel.checkInDate)} – ${formatDateKey(hotel.checkOutDate)} · check-in ${slotLabel(hotel.checkInTime)}`,
      phase,
      status: phaseStatus(phase),
      amountMinor: order.totalMinor,
      currency: order.currency,
      live: false,
    };
  }
  const items = [...order.items].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const first = items[0];
  const last = items.reduce(
    (end, item) => (item.endAt > end ? item.endAt : end),
    first?.endAt ?? order.placedAt,
  );
  const beds = [...new Set(items.map((item) => item.sunbedCode))];
  const startAt = first?.startAt ?? order.placedAt;
  return {
    ref: order.publicRef,
    service: 'sunbeds',
    title: `Sunbeds at ${first?.beachPointName ?? 'the beach'}`,
    subtitle: `${beds.length} ${beds.length === 1 ? 'bed' : 'beds'} · ${beds.join(', ')}`,
    dateKey: dhakaDateKey(new Date(startAt)),
    startAt,
    timeLabel: formatTimeRange(startAt, last),
    phase,
    status: phaseStatus(phase),
    amountMinor: order.totalMinor,
    currency: order.currency,
    live: phase === 'ACTIVE',
  };
}

export function reservationToTrip(reservation: ReservationDto): TripItem {
  const status =
    reservation.status === 'CONFIRMED'
      ? phaseStatus(reservation.phase)
      : reservationStatusPresentation(reservation.status);
  return {
    ref: reservation.publicRef,
    service: 'food',
    title: reservation.venue.name,
    subtitle: `Table ${reservation.table.code} · ${reservation.partySize} ${reservation.partySize === 1 ? 'guest' : 'guests'}`,
    dateKey: dhakaDateKey(new Date(reservation.startAt)),
    startAt: reservation.startAt,
    timeLabel: formatTimeRange(reservation.startAt, reservation.endAt),
    phase: reservation.status === 'CANCELLED' ? 'CANCELLED' : reservation.phase,
    status,
    amountMinor: reservation.depositMinor,
    currency: reservation.currency,
    live: reservation.phase === 'ACTIVE',
  };
}

export function foodOrderToTrip(order: FoodOrderDto): TripItem {
  const open =
    order.status === 'PLACED' || order.status === 'PREPARING' || order.status === 'READY';
  const phase: OrderPhase = order.status === 'CANCELLED' ? 'CANCELLED' : open ? 'ACTIVE' : 'PAST';
  const items = order.lines.reduce((sum, line) => sum + line.quantity, 0);
  return {
    ref: order.publicRef,
    service: 'food',
    title: `${order.venue.name} to sunbed ${order.delivery.sunbedCode}`,
    subtitle: `${items} ${items === 1 ? 'item' : 'items'} · ${order.delivery.beachPointName}`,
    dateKey: dhakaDateKey(new Date(order.placedAt)),
    startAt: order.placedAt,
    timeLabel: `Ordered ${formatIsoTime(order.placedAt)}`,
    phase,
    status: foodStatusPresentation(order.status),
    amountMinor: order.totalMinor,
    currency: order.currency,
    live: open,
  };
}

export function isUpcoming(trip: TripItem): boolean {
  return trip.phase === 'UPCOMING' || trip.phase === 'ACTIVE';
}
