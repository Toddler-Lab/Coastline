import type {
  BeachPointSummary,
  DiningVenueSummary,
  HotelSummaryDto,
} from '@coastline/api-contracts';
import { ApiError, serverApi } from './api';
import type { PlaceInventory } from './places';

export interface InventoryResult extends PlaceInventory {
  /** Sections that failed to load; the page renders the rest. */
  failed: Array<'spots' | 'hotels' | 'venues'>;
  /** True when nothing loaded, which almost always means the API is down. */
  offline: boolean;
}

function settle<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

/**
 * Everything bookable in a destination. Each source is loaded independently so
 * one failing service does not blank the page.
 */
export async function loadInventory(userId: string, date?: string): Promise<InventoryResult> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const [spots, hotels, venues] = await Promise.allSettled([
    serverApi<BeachPointSummary[]>(`/beach-points${query}`, userId),
    serverApi<HotelSummaryDto[]>('/hotels', userId),
    serverApi<DiningVenueSummary[]>('/dining/venues', userId),
  ]);

  const failed: InventoryResult['failed'] = [];
  if (spots.status === 'rejected') failed.push('spots');
  if (hotels.status === 'rejected') failed.push('hotels');
  if (venues.status === 'rejected') failed.push('venues');

  return {
    spots: settle(spots, [] as BeachPointSummary[])
      .filter((spot) => spot.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    hotels: settle(hotels, [] as HotelSummaryDto[]),
    venues: settle(venues, [] as DiningVenueSummary[]),
    failed,
    offline: failed.length === 3,
  };
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Coastline could not reach its booking service. Check your connection and try again.';
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
