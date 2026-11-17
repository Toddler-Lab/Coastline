import type {
  CreateFoodOrderRequest,
  CreateOrderRequest,
  CreateReservationRequest,
  FoodOrderDto,
  OrderDto,
  ReservationDto,
} from '@coastline/api-contracts';
import { clientApi } from './api';
import type { ServiceKey } from './services';

/**
 * Shared checkout (design.md 7.8). Every booking flow builds a draft and hands
 * it to /checkout/[draft]. Until the payment port lands (WP-10) the draft
 * lives in this tab's session storage and the booking is created when the
 * visitor approves payment on the sandbox gateway screen; the API prices it
 * again and its amount is the one recorded.
 */

export interface StayRequest {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
}

export type DraftRequest =
  | { kind: 'sunbed'; body: CreateOrderRequest }
  | { kind: 'stay'; body: StayRequest }
  | { kind: 'table'; body: CreateReservationRequest }
  | { kind: 'food'; body: CreateFoodOrderRequest };

export interface DraftLine {
  label: string;
  detail?: string;
  amountMinor: number;
}

export interface CheckoutDraft {
  id: string;
  createdAt: string;
  service: ServiceKey;
  title: string;
  subtitle: string;
  when: string;
  lines: DraftLine[];
  totalMinor: number;
  currency: string;
  /** What is charged now when it differs from the total (a deposit). */
  payNowLabel?: string;
  cancellation: string;
  backHref: string;
  request: DraftRequest;
}

export const PAYMENT_METHODS = [
  { id: 'BKASH', label: 'bKash', hint: 'Mobile wallet' },
  { id: 'NAGAD', label: 'Nagad', hint: 'Mobile wallet' },
  { id: 'CARD', label: 'Card', hint: 'Visa, Mastercard, Amex' },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

const PREFIX = 'coastline_checkout_';

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 14);
}

export function saveDraft(draft: Omit<CheckoutDraft, 'id' | 'createdAt'>): string {
  const id = newId();
  const full: CheckoutDraft = { ...draft, id, createdAt: new Date().toISOString() };
  sessionStorage.setItem(PREFIX + id, JSON.stringify(full));
  return id;
}

export function loadDraft(id: string): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + id);
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(id: string): void {
  sessionStorage.removeItem(PREFIX + id);
}

export interface PlacedBooking {
  ref: string;
  totalMinor: number;
  currency: string;
  provider: string | null;
}

/** Creates the booking once the gateway approves. The server sets the price. */
export async function placeDraft(draft: CheckoutDraft): Promise<PlacedBooking> {
  const { request } = draft;
  switch (request.kind) {
    case 'sunbed': {
      const order = await clientApi<OrderDto>('/orders', {
        method: 'POST',
        body: JSON.stringify(request.body),
      });
      return {
        ref: order.publicRef,
        totalMinor: order.totalMinor,
        currency: order.currency,
        provider: order.payments[0]?.provider ?? null,
      };
    }
    case 'stay': {
      const order = await clientApi<OrderDto>('/hotels/bookings', {
        method: 'POST',
        body: JSON.stringify(request.body),
      });
      return {
        ref: order.publicRef,
        totalMinor: order.totalMinor,
        currency: order.currency,
        provider: order.payments[0]?.provider ?? null,
      };
    }
    case 'table': {
      const reservation = await clientApi<ReservationDto>('/dining/reservations', {
        method: 'POST',
        body: JSON.stringify(request.body),
      });
      return {
        ref: reservation.publicRef,
        totalMinor: reservation.depositMinor,
        currency: reservation.currency,
        provider: reservation.payments[0]?.provider ?? null,
      };
    }
    case 'food': {
      const order = await clientApi<FoodOrderDto>('/dining/food-orders', {
        method: 'POST',
        body: JSON.stringify(request.body),
      });
      return {
        ref: order.publicRef,
        totalMinor: order.totalMinor,
        currency: order.currency,
        provider: order.payments[0]?.provider ?? null,
      };
    }
  }
}
