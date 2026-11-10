import type { OrderDto, OrderPhase, SlotDto, SunbedAvailability } from '@coastline/api-contracts';
import { formatCount, formatIsoTime } from './format';

const HOUR_MS = 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** Free/booked/yours/out-of-service for the currently selected hour window. */
export type BedWindowState = 'free' | 'booked' | 'mine' | 'off';

export interface DateParts {
  key: string;
  weekday: string;
  day: string;
  month: string;
}

/** `Beach Point Beach` reads badly in tight rows; the map already trims the suffix. */
export function shortPointName(name: string): string {
  return name.replace(/\s+Beach$/i, '');
}

/** A display-only calendar strip; dates are Dhaka date keys, not instants. */
export function dateStrip(startKey: string, count = 8): DateParts[] {
  const start = new Date(`${startKey}T00:00:00.000Z`);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * HOUR_MS);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      weekday: WEEKDAYS[date.getUTCDay()],
      day: String(date.getUTCDate()),
      month: MONTHS[date.getUTCMonth()],
    };
  });
}

/** Slot instants covered by a start + duration window. Format matches the API. */
export function windowSlotStarts(slots: SlotDto[], startIso: string, hours: number): string[] {
  const start = Date.parse(startIso);
  if (Number.isNaN(start)) {
    return [];
  }
  const end = start + hours * HOUR_MS;
  return slots
    .filter((slot) => {
      const at = Date.parse(slot.startsAt);
      return at >= start && at < end;
    })
    .map((slot) => slot.startsAt);
}

/** True when the window starts on a real slot and ends at or before closing time. */
export function windowIsComplete(slots: SlotDto[], startIso: string, hours: number): boolean {
  const starts = windowSlotStarts(slots, startIso, hours);
  return starts.length === hours && starts[0] === startIso;
}

export function windowLabel(startIso: string, hours: number): string {
  const end = new Date(Date.parse(startIso) + hours * HOUR_MS).toISOString();
  return `${formatIsoTime(startIso)}–${formatIsoTime(end)}`;
}

export function windowEndIso(startIso: string, hours: number): string {
  return new Date(Date.parse(startIso) + hours * HOUR_MS).toISOString();
}

/** Booked slot labels for one bed inside the window, e.g. ["11:00", "12:00"]. */
export function conflictsInWindow(bed: SunbedAvailability, windowStarts: string[]): string[] {
  const wanted = new Set(windowStarts);
  return [...new Set(bed.bookedSlots.filter((slot) => wanted.has(slot)))]
    .sort()
    .map((slot) => formatIsoTime(slot));
}

export function mineInWindow(bed: SunbedAvailability, windowStarts: string[]): string[] {
  const wanted = new Set(windowStarts);
  return [...new Set(bed.mineSlots.filter((slot) => wanted.has(slot)))].sort();
}

/**
 * What a bed is for the current window. `mine` wins over `booked` because a
 * bed held by the signed-in tourist is still theirs, not someone else's.
 */
export function bedWindowState(bed: SunbedAvailability, windowStarts: string[]): BedWindowState {
  if (bed.status !== 'AVAILABLE') {
    return 'off';
  }
  const conflicts = conflictsInWindow(bed, windowStarts);
  if (conflicts.length === 0) {
    return 'free';
  }
  return mineInWindow(bed, windowStarts).length > 0 ? 'mine' : 'booked';
}

export function isBedSelectable(
  bed: SunbedAvailability,
  windowStarts: string[],
  windowReady: boolean,
): boolean {
  return windowReady && bedWindowState(bed, windowStarts) === 'free';
}

/** Indicative display total. The API recalculates the authoritative amount. */
export function bedsTotalMinor(beds: SunbedAvailability[], hours: number): number {
  return beds.reduce((sum, bed) => sum + bed.hourlyPriceMinor * hours, 0);
}

export function durationLabel(hours: number): string {
  return formatCount(hours, 'hour');
}

/* Orders ------------------------------------------------------------------ */

export interface OrderWindow {
  startAt: string;
  endAt: string;
  sameDhakaDay: boolean;
  dateKey: string;
  timeLabel: string;
}

export function orderWindow(order: Pick<OrderDto, 'items'>): OrderWindow | null {
  if (order.items.length === 0) {
    return null;
  }
  const starts = order.items.map((item) => item.startAt).sort();
  const ends = order.items.map((item) => item.endAt).sort();
  const startAt = starts[0];
  const endAt = ends[ends.length - 1];
  const startKey = isoDateKey(startAt);
  const endKey = isoDateKey(endAt);
  const sameDhakaDay = startKey === endKey;

  return {
    startAt,
    endAt,
    sameDhakaDay,
    dateKey: startKey,
    timeLabel: sameDhakaDay
      ? `${formatIsoTime(startAt)}–${formatIsoTime(endAt)}`
      : `${formatIsoTime(startAt)} → ${formatIsoTime(endAt)}`,
  };
}

/** Dhaka date key for an ISO instant, independent of the host timezone. */
export function isoDateKey(iso: string): string {
  return new Date(Date.parse(iso) + 6 * HOUR_MS).toISOString().slice(0, 10);
}

export function orderPhase(order: Pick<OrderDto, 'status' | 'items'>): OrderPhase {
  if (order.status === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (order.items.some((item) => item.phase === 'ACTIVE')) {
    return 'ACTIVE';
  }
  if (order.items.some((item) => item.phase === 'UPCOMING')) {
    return 'UPCOMING';
  }
  return 'PAST';
}

export function orderBedCodes(order: Pick<OrderDto, 'items'>): string[] {
  return [...new Set(order.items.map((item) => item.sunbedCode))];
}

export function orderPointNames(order: Pick<OrderDto, 'items'>): string[] {
  return [...new Set(order.items.map((item) => item.beachPointName))];
}

export type PhaseTone = 'neutral' | 'sea' | 'sand' | 'success' | 'warn' | 'danger';

export function phasePresentation(phase: OrderPhase): { label: string; tone: PhaseTone } {
  switch (phase) {
    case 'ACTIVE':
      return { label: 'In progress', tone: 'success' };
    case 'UPCOMING':
      return { label: 'Upcoming', tone: 'sea' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'danger' };
    default:
      return { label: 'Past', tone: 'neutral' };
  }
}

export function itemStatusPresentation(status: OrderDto['items'][number]['status']): {
  label: string;
  tone: PhaseTone;
} {
  switch (status) {
    case 'CHECKED_IN':
      return { label: 'Checked in', tone: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'danger' };
    default:
      return { label: 'Reserved', tone: 'sea' };
  }
}

export function paymentTypeLabel(type: OrderDto['payments'][number]['type']): string {
  return type === 'REFUND' ? 'Refund (simulated)' : 'Charge (simulated)';
}

/**
 * Turns the API's 409 `conflicts` detail into a human sentence fragment.
 * The API payload is `{ conflicts: [{ sunbedCode, slotStarts }] }`.
 */
export function describeConflictDetails(details: unknown): string | null {
  if (!details || typeof details !== 'object') {
    return null;
  }
  const conflicts = (details as { conflicts?: unknown }).conflicts;
  if (!Array.isArray(conflicts) || conflicts.length === 0) {
    return null;
  }

  const parts: string[] = [];
  for (const entry of conflicts) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const record = entry as { sunbedCode?: unknown; slotStarts?: unknown };
    const code = typeof record.sunbedCode === 'string' ? record.sunbedCode : null;
    if (!code) {
      continue;
    }
    const slots = Array.isArray(record.slotStarts)
      ? record.slotStarts.filter((slot): slot is string => typeof slot === 'string')
      : [];
    const times = [...new Set(slots.map((slot) => formatIsoTime(slot)))].sort();
    parts.push(times.length > 0 ? `${code} at ${times.join(', ')}` : code);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}
