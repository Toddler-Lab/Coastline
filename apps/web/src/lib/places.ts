import type {
  BeachPointSummary,
  DiningVenueSummary,
  HotelSummaryDto,
} from '@coastline/api-contracts';
import type { ServiceKey } from './services';

/**
 * Places adapter for the v2 UI.
 *
 * Destinations and spots are not tables yet (WP-05). Until they are, the UI
 * reads the destination descriptor below and treats each live beach point as a
 * spot. Everything that varies per spot (beds, venues, hotels) still comes
 * from the API, so the pages do not change when the places module lands: only
 * this file is replaced by API calls.
 */

export type Accent = 'SEA' | 'FOREST' | 'LAKE' | 'HILL' | 'HERITAGE' | 'NEUTRAL';

export interface Destination {
  slug: string;
  name: string;
  nameBn: string;
  tagline: string;
  accent: Accent;
  latitude: number;
  longitude: number;
  /** Aerial hero framing: centre and zoom. */
  hero: { latitude: number; longitude: number; zoom: number };
  about: string;
  bestTime: string;
  gettingThere: string;
}

export const DESTINATIONS: Destination[] = [
  {
    slug: 'coxs-bazar',
    name: "Cox's Bazar",
    nameBn: 'কক্সবাজার',
    tagline: 'A long sandy sea beach on the Bay of Bengal',
    accent: 'SEA',
    latitude: 21.4272,
    longitude: 91.9786,
    hero: { latitude: 21.385, longitude: 91.995, zoom: 13 },
    about:
      "Cox's Bazar is a coastal town in south-east Bangladesh with an unbroken sandy beach that runs south towards Teknaf. Laboni, Sugandha and Kolatoli are the busy town beaches; Himchari and Inani are quieter and further south.",
    bestTime:
      'November to March is dry and mild and the busiest season. The monsoon months bring rough sea and heavy rain.',
    gettingThere:
      "Flights from Dhaka land at Cox's Bazar airport. Long-distance buses and trains also run from Dhaka and Chattogram.",
  },
];

export const DEFAULT_DESTINATION = DESTINATIONS[0];

export function findDestination(slug: string): Destination | null {
  return DESTINATIONS.find((destination) => destination.slug === slug) ?? null;
}

export function destinationHref(destination: Pick<Destination, 'slug'>): string {
  return `/d/${destination.slug}`;
}

/* Spots ------------------------------------------------------------------ */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function spotSlug(point: Pick<BeachPointSummary, 'name'>): string {
  return slugify(point.name);
}

export function spotHref(destinationSlug: string, point: Pick<BeachPointSummary, 'name'>): string {
  return `/d/${destinationSlug}/s/${spotSlug(point)}`;
}

export function findSpot<T extends Pick<BeachPointSummary, 'name' | 'code'>>(
  points: T[],
  slug: string,
): T | null {
  const lower = slug.toLowerCase();
  return (
    points.find((point) => spotSlug(point) === lower || point.code.toLowerCase() === lower) ?? null
  );
}

export function sunbedPickerHref(point: Pick<BeachPointSummary, 'code'>, date?: string): string {
  const base = `/sunbeds/${point.code.toLowerCase()}`;
  return date ? `${base}?date=${date}` : base;
}

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

export interface PlaceInventory {
  spots: BeachPointSummary[];
  hotels: HotelSummaryDto[];
  venues: DiningVenueSummary[];
}

/** Service types with at least one active listing; tiles show only these. */
export function servicesPresent(inventory: PlaceInventory): ServiceKey[] {
  const keys: ServiceKey[] = [];
  if (inventory.hotels.length > 0) keys.push('stay');
  if (inventory.venues.length > 0) keys.push('food');
  if (inventory.spots.some((spot) => spot.isActive && spot.totalBeds > 0)) keys.push('sunbeds');
  return keys;
}

export function spotInventory(inventory: PlaceInventory, point: BeachPointSummary): PlaceInventory {
  return {
    spots: [point],
    hotels: inventory.hotels.filter((hotel) => hotel.nearestBeachCode === point.code),
    venues: inventory.venues.filter((venue) => venue.beachPointCode === point.code),
  };
}

export function serviceCount(inventory: PlaceInventory, key: ServiceKey): number {
  switch (key) {
    case 'stay':
      return inventory.hotels.length;
    case 'food':
      return inventory.venues.length;
    case 'sunbeds':
      return inventory.spots.filter((spot) => spot.isActive && spot.totalBeds > 0).length;
    default:
      return 0;
  }
}
