import type { OrderItemStatus, OrderPhase } from '@coastline/api-contracts';

export const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;
export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDhaka(date: Date): Date {
  return new Date(date.getTime() + DHAKA_OFFSET_MS);
}

/** Dhaka calendar date key (YYYY-MM-DD). */
export function dhakaDateKey(date: Date = new Date()): string {
  return toDhaka(date).toISOString().slice(0, 10);
}

/** Dhaka wall-clock hour (0–23). */
export function dhakaHour(date: Date): number {
  return toDhaka(date).getUTCHours();
}

/** Dhaka wall-clock label such as "09:00". */
export function dhakaHourLabel(date: Date): string {
  const shifted = toDhaka(date);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:00`;
}

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** UTC instant for a Dhaka wall-clock hour on a Dhaka date. */
export function dhakaHourToUtc(dateKey: string, hour: number): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0) - DHAKA_OFFSET_MS);
}

/** First hour strictly after `now`, or `openHour` when the day has not started. */
export function nextBookableHour(
  openHour: number,
  closeHour: number,
  now: Date = new Date(),
): number {
  const hour = dhakaHour(now);
  const minutes = toDhaka(now).getUTCMinutes();
  const candidate = minutes > 0 ? hour + 1 : hour;
  if (candidate < openHour) {
    return openHour;
  }
  if (candidate >= closeHour) {
    return openHour;
  }
  return candidate;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

export function isWholeHour(date: Date): boolean {
  return (
    date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0
  );
}

export function hoursBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / HOUR_MS);
}

/** Inclusive list of hourly slot starts in [start, end). */
export function slotStarts(start: Date, end: Date): Date[] {
  const result: Date[] = [];
  for (let cursor = start.getTime(); cursor < end.getTime(); cursor += HOUR_MS) {
    result.push(new Date(cursor));
  }
  return result;
}

export function phaseFor(
  startAt: Date,
  endAt: Date,
  status: OrderItemStatus,
  now: Date = new Date(),
): OrderPhase {
  if (status === 'CANCELLED') {
    return 'CANCELLED';
  }
  if (now < startAt) {
    return 'UPCOMING';
  }
  if (now < endAt) {
    return 'ACTIVE';
  }
  return 'PAST';
}

export function canCancel(startAt: Date, status: string, now: Date = new Date()): boolean {
  return status === 'CONFIRMED' && now.getTime() <= startAt.getTime() - 60 * 60 * 1000;
}
