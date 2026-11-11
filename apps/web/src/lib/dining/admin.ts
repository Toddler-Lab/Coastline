import {
  FOOD_ORDER_STATUSES,
  FOOD_ORDER_TRANSITIONS,
  RESERVATION_STATUSES,
  type DiningVenueKind,
  type FoodOrderStatus,
  type ReservationStatus,
} from '@coastline/api-contracts';
import { ApiError } from '@/lib/api';
import { hourLabel } from '@/lib/format';

/** Dining operations desk helpers (stream D). */

export type Tone = 'neutral' | 'sea' | 'sand' | 'success' | 'warn' | 'danger';

export const OPEN_FOOD_ORDER_STATUSES = ['PLACED', 'PREPARING', 'READY'] as const satisfies
  readonly FoodOrderStatus[];
export type OpenFoodOrderStatus = (typeof OPEN_FOOD_ORDER_STATUSES)[number];

/** Kitchen refresh cadence; light enough for a demo laptop. */
export const KITCHEN_REFRESH_MS = 20_000;

export const VENUE_KIND_LABELS: Record<DiningVenueKind, string> = {
  RESTAURANT: 'Restaurant',
  SEAFOOD_KITCHEN: 'Seafood kitchen',
  BEACH_STALL: 'Beach stall',
};

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked in',
  CANCELLED: 'Cancelled',
};

export const FOOD_ORDER_STATUS_LABELS: Record<FoodOrderStatus, string> = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** Verb shown on the kitchen's "advance" button for each target status. */
export const FOOD_ORDER_ADVANCE_LABELS: Partial<Record<FoodOrderStatus, string>> = {
  PREPARING: 'Start preparing',
  READY: 'Mark ready',
  DELIVERED: 'Mark delivered',
};

export function reservationStatusTone(status: ReservationStatus): Tone {
  switch (status) {
    case 'CONFIRMED':
      return 'sand';
    case 'CHECKED_IN':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function foodOrderStatusTone(status: FoodOrderStatus): Tone {
  switch (status) {
    case 'PLACED':
      return 'warn';
    case 'PREPARING':
      return 'sand';
    case 'READY':
      return 'sea';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** The forward kitchen move for a status, or null when there is none. */
export function nextKitchenStatus(status: FoodOrderStatus): FoodOrderStatus | null {
  return FOOD_ORDER_TRANSITIONS[status].find((candidate) => candidate !== 'CANCELLED') ?? null;
}

export function canKitchenCancel(status: FoodOrderStatus): boolean {
  return FOOD_ORDER_TRANSITIONS[status].includes('CANCELLED');
}

export function isReservationStatus(value: string | undefined): value is ReservationStatus {
  return (RESERVATION_STATUSES as readonly string[]).includes(value ?? '');
}

export function isFoodOrderStatus(value: string | undefined): value is FoodOrderStatus {
  return (FOOD_ORDER_STATUSES as readonly string[]).includes(value ?? '');
}

export function venueHours(openHour: number, closeHour: number): string {
  return `${hourLabel(openHour)}–${hourLabel(closeHour)}`;
}

/** Whole-taka inputs; the API stores integer minor units (paisa). */
export function takaToMinor(taka: number): number {
  return Math.round(taka * 100);
}

export function minorToTakaInput(minor: number): string {
  return Number.isInteger(minor / 100) ? String(minor / 100) : (minor / 100).toFixed(2);
}

/** Accepts up to two decimals of taka; returns null for anything else. */
export function parseTaka(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return takaToMinor(Number(trimmed));
}

export function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

export function diningErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404 && error.code === 'NOT_FOUND' && /Cannot (GET|POST)/.test(error.message)) {
      return 'This dining endpoint is not available on the API yet.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'The request failed. Try again.';
}

/** Human strings from `details.issues` (422) or validation arrays (400). */
export function diningErrorDetails(error: unknown): string[] {
  if (!(error instanceof ApiError) || !error.details) return [];
  const details = error.details as unknown;
  if (Array.isArray(details)) {
    return details.filter((entry): entry is string => typeof entry === 'string');
  }
  if (typeof details === 'object' && details !== null) {
    const issues = (details as { issues?: unknown }).issues;
    if (Array.isArray(issues)) {
      return issues
        .map((issue) =>
          issue && typeof issue === 'object' && typeof (issue as { message?: unknown }).message === 'string'
            ? (issue as { message: string }).message
            : null,
        )
        .filter((entry): entry is string => entry !== null);
    }
  }
  return [];
}

/** Field name -> message map from a 422 `details.issues` payload. */
export function diningFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object') {
    return {};
  }
  const issues = (error.details as { issues?: unknown }).issues;
  if (!Array.isArray(issues)) return {};
  const result: Record<string, string> = {};
  for (const issue of issues) {
    if (issue && typeof issue === 'object') {
      const { field, message } = issue as { field?: unknown; message?: unknown };
      if (typeof field === 'string' && typeof message === 'string' && !result[field]) {
        result[field] = message;
      }
    }
  }
  return result;
}
