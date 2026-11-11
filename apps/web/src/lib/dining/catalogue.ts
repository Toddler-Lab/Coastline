import type {
  DiningVenueDetail,
  DiningVenueKind,
  DiningVenueQuery,
  DiningVenueSummary,
} from '@coastline/api-contracts';
import { DINING_VENUE_KINDS } from '@coastline/api-contracts';
import { clientApi } from '@/lib/api';

/** `/dining/venues` path with only the filters that are set. */
export function venuesPath(query: DiningVenueQuery = {}): string {
  const params = new URLSearchParams();
  if (query.kind) params.set('kind', query.kind);
  if (query.beachPointCode) params.set('beachPointCode', query.beachPointCode);
  if (query.reservable !== undefined) params.set('reservable', String(query.reservable));
  if (query.delivers !== undefined) params.set('delivers', String(query.delivers));
  const search = params.toString();
  return search ? `/dining/venues?${search}` : '/dining/venues';
}

export function venuePath(code: string): string {
  return `/dining/venues/${encodeURIComponent(code)}`;
}

/** Browser fetch of the public venue list. */
export function fetchVenues(query: DiningVenueQuery = {}): Promise<DiningVenueSummary[]> {
  return clientApi<DiningVenueSummary[]>(venuesPath(query));
}

/** Browser fetch of one venue with its menu. */
export function fetchVenue(code: string): Promise<DiningVenueDetail> {
  return clientApi<DiningVenueDetail>(venuePath(code));
}

/** Local mirror of the API filter, used to filter an already-loaded list. */
export function filterVenues(
  venues: DiningVenueSummary[],
  query: DiningVenueQuery,
): DiningVenueSummary[] {
  return venues.filter(
    (venue) =>
      (query.kind === undefined || venue.kind === query.kind) &&
      (query.beachPointCode === undefined || venue.beachPointCode === query.beachPointCode) &&
      (query.reservable === undefined || venue.reservationsEnabled === query.reservable) &&
      (query.delivers === undefined || venue.deliveryEnabled === query.delivers),
  );
}

export function isVenueKind(value: unknown): value is DiningVenueKind {
  return typeof value === 'string' && (DINING_VENUE_KINDS as readonly string[]).includes(value);
}
