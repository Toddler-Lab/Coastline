import type {
  AdminOrderDto,
  OrderItemStatus,
  OrderPhase,
  SunbedStatus,
} from '@coastline/api-contracts';
import { ApiError } from '@/lib/api';
import { hourLabel, toDhaka } from '@/lib/format';

export type Tone = 'neutral' | 'sea' | 'sand' | 'success' | 'warn' | 'danger';

const HOUR_MS = 3_600_000;

/** The operations desk only looks 8 days ahead (today + 7); see MAX_ADVANCE_DAYS. */

export function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return readParam(value[0]);
  }
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Keep a well-formed date key; anything else falls back to the supplied day. */
export function normalizeDateKey(value: string | undefined, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}

export function pointHours(openHour: number, closeHour: number): string {
  return `${hourLabel(openHour)}–${hourLabel(closeHour)}`;
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/** Hourly price input is whole taka; the API stores integer minor units. */
export function takaToMinor(taka: number): number {
  return Math.round(taka * 100);
}

export function minorToTaka(minor: number): number {
  return Math.round(minor / 100);
}

function dhakaHourOf(iso: string): number {
  return toDhaka(new Date(iso)).getUTCHours();
}

/** `09:00–12:00`, where the end is exclusive. */
export function itemWindowLabel(startAt: string, endAt: string): string {
  const hours = Math.max(1, Math.round((Date.parse(endAt) - Date.parse(startAt)) / HOUR_MS));
  const startHour = dhakaHourOf(startAt);
  return `${hourLabel(startHour)}–${hourLabel(startHour + hours)}`;
}

/** Collapses consecutive hourly slot instants into compact Dhaka ranges. */
export function slotRangeLabels(slots: string[]): string[] {
  const instants = [...new Set(slots.map((iso) => Date.parse(iso)))]
    .filter((ms) => Number.isFinite(ms))
    .sort((left, right) => left - right);
  const labels: string[] = [];
  let runStartHour: number | null = null;
  let runEndHour = 0;
  let previousMs: number | null = null;

  const flush = () => {
    if (runStartHour !== null) {
      labels.push(`${hourLabel(runStartHour)}–${hourLabel(runEndHour + 1)}`);
    }
  };

  for (const ms of instants) {
    const hour = dhakaHourOf(new Date(ms).toISOString());
    if (previousMs !== null && ms - previousMs === HOUR_MS) {
      runEndHour = hour;
    } else {
      flush();
      runStartHour = hour;
      runEndHour = hour;
    }
    previousMs = ms;
  }
  flush();

  return labels;
}

export function itemWindowGroups(
  items: AdminOrderDto['items'],
): Array<{ window: string; codes: string[] }> {
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const window = itemWindowLabel(item.startAt, item.endAt);
    groups.set(window, [...(groups.get(window) ?? []), item.sunbedCode]);
  }
  return [...groups.entries()].map(([window, codes]) => ({ window, codes }));
}

export function checkedInSummary(order: AdminOrderDto): {
  checkedIn: number;
  reservable: number;
  reserved: number;
} {
  const active = order.items.filter((item) => item.status !== 'CANCELLED');
  return {
    checkedIn: active.filter((item) => item.status === 'CHECKED_IN').length,
    reservable: active.length,
    reserved: order.items.filter((item) => item.status === 'RESERVED').length,
  };
}

/** A single phase for an order, derived from its items. */
export function displayPhase(order: AdminOrderDto): OrderPhase {
  if (order.status === 'CANCELLED') return 'CANCELLED';
  if (order.items.some((item) => item.phase === 'ACTIVE')) return 'ACTIVE';
  if (order.items.length > 0 && order.items.every((item) => item.phase === 'PAST')) return 'PAST';
  return 'UPCOMING';
}

export function orderStatusTone(status: AdminOrderDto['status']): Tone {
  return status === 'CONFIRMED' ? 'success' : 'danger';
}

export function phaseTone(phase: OrderPhase): Tone {
  switch (phase) {
    case 'ACTIVE':
      return 'sea';
    case 'UPCOMING':
      return 'sand';
    case 'PAST':
      return 'neutral';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function itemStatusTone(status: OrderItemStatus): Tone {
  switch (status) {
    case 'RESERVED':
      return 'warn';
    case 'CHECKED_IN':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function bedStatusTone(status: SunbedStatus): Tone {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'OUT_OF_SERVICE':
      return 'warn';
    case 'RETIRED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function bedStatusLabel(status: SunbedStatus): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Available';
    case 'OUT_OF_SERVICE':
      return 'Out of service';
    case 'RETIRED':
      return 'Retired';
    default:
      return status;
  }
}

/** Best-effort message for unexpected failures from `clientApi`. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'The request failed. Try again.';
}

/**
 * Nest's validation pipe returns `string[]`; domain conflicts return objects.
 * This flattens the useful human strings without dumping raw JSON at the user.
 */
export function detailMessages(details: unknown): string[] {
  if (!details) return [];
  if (Array.isArray(details)) {
    return details.flatMap((entry) => detailMessages(entry));
  }
  if (typeof details === 'string') return [details];
  if (typeof details === 'object') {
    const record = details as Record<string, unknown>;
    const lines: string[] = [];
    if (Array.isArray(record.issues)) {
      lines.push(...detailMessages(record.issues));
    }
    for (const key of ['message', 'reason']) {
      if (typeof record[key] === 'string') {
        lines.push(record[key] as string);
      }
    }
    return [...new Set(lines)];
  }
  return [];
}

export function slotStartsFrom(details: unknown): string[] {
  if (!details || typeof details !== 'object') return [];
  const record = details as Record<string, unknown>;
  return Array.isArray(record.slotStarts)
    ? record.slotStarts.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

export function itemIdsFrom(details: unknown): string[] {
  if (!details || typeof details !== 'object') return [];
  const record = details as Record<string, unknown>;
  return Array.isArray(record.itemIds)
    ? record.itemIds.filter((entry): entry is string => typeof entry === 'string')
    : [];
}
