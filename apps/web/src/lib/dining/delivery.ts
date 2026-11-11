import type {
  DiningVenueDetail,
  FoodOrderDto,
  FoodOrderStatus,
  MenuItemDto,
} from '@coastline/api-contracts';
import { MAX_FOOD_ITEM_QUANTITY, MAX_FOOD_ORDER_LINES } from '@coastline/api-contracts';
import { formatIsoDate, toDhaka } from '@/lib/format';

export { MAX_FOOD_ITEM_QUANTITY, MAX_FOOD_ORDER_LINES };

type Tone = 'neutral' | 'sea' | 'sand' | 'success' | 'warn' | 'danger';

export function foodOrderHref(publicRef: string): string {
  return `/food/orders/${encodeURIComponent(publicRef)}`;
}

/** Statuses after which the order can no longer change. */
export function isTerminalFoodStatus(status: FoodOrderStatus): boolean {
  return status === 'DELIVERED' || status === 'CANCELLED';
}

export function foodStatusPresentation(status: FoodOrderStatus): { label: string; tone: Tone } {
  switch (status) {
    case 'PLACED':
      return { label: 'Placed', tone: 'sea' };
    case 'PREPARING':
      return { label: 'Preparing', tone: 'warn' };
    case 'READY':
      return { label: 'Ready · on its way', tone: 'sand' };
    case 'DELIVERED':
      return { label: 'Delivered', tone: 'success' };
    default:
      return { label: 'Cancelled', tone: 'danger' };
  }
}

/** Dhaka wall-clock "HH:mm" for an ISO instant. */
export function formatDhakaClock(iso: string): string {
  const shifted = toDhaka(new Date(iso));
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatDhakaStamp(iso: string): string {
  return `${formatIsoDate(iso)} · ${formatDhakaClock(iso)}`;
}

export interface TimelineStep {
  key: FoodOrderStatus;
  label: string;
  at: string | null;
  state: 'done' | 'current' | 'pending' | 'cancelled';
}

const FLOW: Array<{ key: Exclude<FoodOrderStatus, 'CANCELLED'>; label: string }> = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'READY', label: 'Ready' },
  { key: 'DELIVERED', label: 'Delivered' },
];

/**
 * Placed → Preparing → Ready → Delivered. A cancelled order keeps the steps it
 * reached and ends with a Cancelled step instead of the remaining ones.
 */
export function foodOrderTimeline(order: FoodOrderDto): TimelineStep[] {
  const stamps: Record<Exclude<FoodOrderStatus, 'CANCELLED'>, string | null> = {
    PLACED: order.placedAt,
    PREPARING: order.preparingAt,
    READY: order.readyAt,
    DELIVERED: order.deliveredAt,
  };

  if (order.status === 'CANCELLED') {
    const reached = FLOW.filter((step) => stamps[step.key]);
    return [
      ...reached.map((step) => ({
        key: step.key,
        label: step.label,
        at: stamps[step.key],
        state: 'done' as const,
      })),
      { key: 'CANCELLED', label: 'Cancelled', at: order.cancelledAt, state: 'cancelled' },
    ];
  }

  const currentIndex = FLOW.findIndex((step) => step.key === order.status);
  return FLOW.map((step, index) => ({
    key: step.key,
    label: step.label,
    at: stamps[step.key],
    state:
      index < currentIndex || (index === currentIndex && order.status === 'DELIVERED')
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'pending',
  }));
}

/** Menu items a tourist can add to a cart, in menu order. */
export function orderableItems(venue: DiningVenueDetail): MenuItemDto[] {
  return venue.menu.flatMap((category) => category.items.filter((item) => item.isAvailable));
}

/** Display-only estimate; the API prices the order from the database. */
export function cartTotalMinor(
  items: MenuItemDto[],
  quantities: Record<string, number>,
): number {
  return items.reduce((sum, item) => sum + item.priceMinor * (quantities[item.id] ?? 0), 0);
}
