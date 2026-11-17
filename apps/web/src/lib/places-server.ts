import { cache } from 'react';
import { cookies } from 'next/headers';
import type {
  BeachPointSummary,
  DestinationDetailDto,
  DestinationSummaryDto,
  DiningVenueSummary,
  HotelSummaryDto,
  SpotDetailDto,
} from '@coastline/api-contracts';
import { ApiError, serverApi } from './api';
import { DESTINATION_COOKIE, type PlaceInventory } from './places';

export interface InventoryResult extends PlaceInventory {
  /** Sections that failed to load; the page renders the rest. */
  failed: Array<'spots' | 'hotels' | 'venues'>;
  /** True when nothing loaded, which almost always means the API is down. */
  offline: boolean;
}

function settle<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Coastline could not reach its booking service. Check your connection and try again.';
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Active destinations; an empty list when the API is down (`offline` says which). Cached per request. */
export const loadDestinations = cache(async function loadDestinations(
  userId: string,
): Promise<{ destinations: DestinationSummaryDto[]; offline: boolean }> {
  try {
    return { destinations: await serverApi<DestinationSummaryDto[]>('/destinations', userId), offline: false };
  } catch {
    return { destinations: [], offline: true };
  }
});

/** Null when the destination does not exist or is hidden. Other failures throw. Cached per request. */
export const loadDestination = cache(async function loadDestination(
  slug: string,
  userId: string,
): Promise<DestinationDetailDto | null> {
  try {
    return await serverApi<DestinationDetailDto>(`/destinations/${encodeURIComponent(slug)}`, userId);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
});

export async function loadSpot(destination: string, spot: string, userId: string): Promise<SpotDetailDto | null> {
  try {
    return await serverApi<SpotDetailDto>(
      `/destinations/${encodeURIComponent(destination)}/spots/${encodeURIComponent(spot)}`,
      userId,
    );
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** The destination picked on Explore (cookie), else the first active one. */
export async function currentDestinationSlug(destinations: DestinationSummaryDto[]): Promise<string | null> {
  const store = await cookies();
  const remembered = store.get(DESTINATION_COOKIE)?.value;
  if (remembered && destinations.some((destination) => destination.slug === remembered)) {
    return remembered;
  }
  return destinations[0]?.slug ?? null;
}

/**
 * Everything bookable in a destination. Each engine is loaded independently so
 * one failing service does not blank the page.
 */
export async function loadInventory(
  userId: string,
  destination: string,
  date?: string,
): Promise<InventoryResult> {
  const place = `destination=${encodeURIComponent(destination)}`;
  const day = date ? `&date=${encodeURIComponent(date)}` : '';
  const [spots, hotels, venues] = await Promise.allSettled([
    serverApi<BeachPointSummary[]>(`/beach-points?${place}${day}`, userId),
    serverApi<HotelSummaryDto[]>(`/hotels?${place}`, userId),
    serverApi<DiningVenueSummary[]>(`/dining/venues?${place}`, userId),
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
