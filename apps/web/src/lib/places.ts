import type {
  BeachPointSummary,
  DiningVenueSummary,
  HotelSummaryDto,
  ServiceCountsDto,
  SpotKind,
} from '@coastline/api-contracts';
import type { ServiceKey } from './services';

/**
 * Place helpers shared by server and client. Destinations and spots come from
 * the places API (WP-05); this file only builds links and derives what a page
 * shows from the API's data.
 */

/** Remembers the destination picked on Explore. */
export const DESTINATION_COOKIE = 'coastline_destination';

export function destinationHref(destination: { slug: string }): string {
  return `/d/${destination.slug}`;
}

export function spotHref(destinationSlug: string, spotSlug: string): string {
  return `/d/${destinationSlug}/s/${spotSlug}`;
}

export function sunbedPickerHref(point: Pick<BeachPointSummary, 'code'>, date?: string): string {
  const base = `/sunbeds/${point.code.toLowerCase()}`;
  return date ? `${base}?date=${date}` : base;
}

export const SPOT_KIND_LABELS: Record<SpotKind, string> = {
  BEACH: 'Beach',
  HILL: 'Hill',
  LAKE: 'Lake',
  RIVER: 'River',
  WATERFALL: 'Waterfall',
  FOREST: 'Forest',
  TEA_GARDEN: 'Tea garden',
  ISLAND: 'Island',
  HERITAGE: 'Heritage site',
  PARK: 'Park',
  MARKET: 'Market',
  OTHER: 'Place',
};

/* Listings --------------------------------------------------------------- */

export type ListingRef = { kind: 'hotel'; slug: string } | { kind: 'dining'; code: string };

export function hotelListingId(hotel: Pick<HotelSummaryDto, 'slug'>): string {
  return `hotel-${hotel.slug}`;
}

export function venueListingId(venue: Pick<DiningVenueSummary, 'code'>): string {
  return `dining-${venue.code.toLowerCase()}`;
}

export function listingHref(id: string): string {
  return `/l/${encodeURIComponent(id)}`;
}

export function parseListingId(id: string): ListingRef | null {
  const decoded = decodeURIComponent(id);
  if (decoded.startsWith('hotel-') && decoded.length > 6) {
    return { kind: 'hotel', slug: decoded.slice(6) };
  }
  if (decoded.startsWith('dining-') && decoded.length > 7) {
    return { kind: 'dining', code: decoded.slice(7).toUpperCase() };
  }
  return null;
}

/* Services present ------------------------------------------------------- */

/** What can be booked in a destination or at a spot, from the engines' lists. */
export interface PlaceInventory {
  spots: BeachPointSummary[];
  hotels: HotelSummaryDto[];
  venues: DiningVenueSummary[];
}

/** The service types that have engines today; each is also a `ServiceKey`. */
export type CountedService = keyof ServiceCountsDto & ServiceKey;

const SERVICE_ORDER: CountedService[] = ['stay', 'food', 'sunbeds'];

/** Service types with at least one active listing; tiles show only these. */
export function servicesPresent(counts: ServiceCountsDto): CountedService[] {
  return SERVICE_ORDER.filter((key) => counts[key] > 0);
}

export function inventoryCounts(inventory: PlaceInventory): ServiceCountsDto {
  return {
    stay: inventory.hotels.length,
    food: inventory.venues.length,
    sunbeds: inventory.spots.filter((spot) => spot.isActive && spot.totalBeds > 0).length,
  };
}

export function spotInventory(inventory: PlaceInventory, spotSlug: string): PlaceInventory {
  return {
    spots: inventory.spots.filter((point) => point.spotSlug === spotSlug),
    hotels: inventory.hotels.filter((hotel) => hotel.spotSlug === spotSlug),
    venues: inventory.venues.filter((venue) => venue.spotSlug === spotSlug),
  };
}
