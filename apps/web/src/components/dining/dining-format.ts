import type { DiningVenueKind } from '@coastline/api-contracts';
import { formatMoney, hourLabel } from '@/lib/format';

export const VENUE_KIND_LABELS: Record<DiningVenueKind, string> = {
  RESTAURANT: 'Restaurant',
  SEAFOOD_KITCHEN: 'Seafood kitchen',
  BEACH_STALL: 'Beach stall',
};

/** "11:00 – 22:00"; venue hours are Asia/Dhaka wall-clock hours. */
export function venueHoursLabel(openHour: number, closeHour: number): string {
  return `${hourLabel(openHour)} – ${hourLabel(closeHour)}`;
}

/** Open when the Dhaka hour h satisfies openHour <= h < closeHour. */
export function isVenueOpen(openHour: number, closeHour: number, dhakaHour: number): boolean {
  return openHour <= dhakaHour && dhakaHour < closeHour;
}

/** BDT amount for display; only BDT exists in the demo. */
export function formatDiningPrice(minor: number, currency = 'BDT'): string {
  return currency === 'BDT' ? formatMoney(minor) : `${currency} ${(minor / 100).toFixed(2)}`;
}
