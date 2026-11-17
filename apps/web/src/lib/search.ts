import type { DestinationDetailDto, DestinationSummaryDto } from '@coastline/api-contracts';
import type { PlaceInventory } from './places';
import {
  SPOT_KIND_LABELS,
  destinationHref,
  hotelListingId,
  inventoryCounts,
  listingHref,
  servicesPresent,
  spotHref,
  venueListingId,
} from './places';
import { SERVICES, type ServiceKey } from './services';

export interface SearchEntry {
  kind: 'place' | 'listing' | 'service';
  label: string;
  sublabel?: string;
  href: string;
  /** Extra words that should match (service type, area, cuisine). */
  keywords: string;
  /** Service type of a listing or service entry: picks the icon and filters results. */
  service?: ServiceKey;
}

/**
 * Builds the client-side search index: every destination, plus the spots,
 * listings and services of the current one (from the live API data).
 */
export function buildSearchIndex(
  destinations: DestinationSummaryDto[],
  current: DestinationDetailDto | null,
  inventory: PlaceInventory,
): SearchEntry[] {
  const entries: SearchEntry[] = destinations.map((destination) => ({
    kind: 'place' as const,
    label: destination.name,
    sublabel: 'Destination',
    href: destinationHref(destination),
    keywords: [destination.nameBn, destination.tagline, 'destination'].filter(Boolean).join(' '),
  }));
  if (!current) return entries;

  for (const spot of current.spots) {
    entries.push({
      kind: 'place',
      label: spot.name,
      sublabel: `${SPOT_KIND_LABELS[spot.kind]} in ${current.name}`,
      href: spotHref(current.slug, spot.slug),
      keywords: [spot.nameBn, spot.beachPointCode, spot.kind, 'spot', current.name].filter(Boolean).join(' '),
    });
  }

  for (const hotel of inventory.hotels) {
    entries.push({
      kind: 'listing',
      label: hotel.name,
      sublabel: `Stay · ${hotel.area ?? hotel.address}`,
      href: listingHref(hotelListingId(hotel)),
      keywords: ['stay hotel resort room', hotel.banglaName, hotel.area, hotel.spotSlug, current.name]
        .filter(Boolean)
        .join(' '),
      service: 'stay',
    });
  }

  for (const venue of inventory.venues) {
    entries.push({
      kind: 'listing',
      label: venue.name,
      sublabel: `Food · ${venue.beachPointName ?? current.name}`,
      href: listingHref(venueListingId(venue)),
      keywords: [
        'food eat restaurant',
        venue.nameBn,
        venue.cuisineTags.join(' '),
        venue.kind,
        venue.beachPointName,
        venue.spotSlug,
      ]
        .filter(Boolean)
        .join(' '),
      service: 'food',
    });
  }

  for (const key of servicesPresent(inventoryCounts(inventory))) {
    const meta = SERVICES[key];
    entries.push({
      kind: 'service',
      label: `${meta.label} in ${current.name}`,
      sublabel: meta.blurb,
      href: `/d/${current.slug}/${key}`,
      keywords: `${meta.label} ${meta.noun}`,
      service: key,
    });
  }

  return entries;
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Every query word must match; a match in the label ranks above keywords. */
export function rankSuggestions(index: SearchEntry[], query: string): SearchEntry[] {
  const words = normalise(query).split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const scored: Array<{ entry: SearchEntry; score: number }> = [];
  for (const entry of index) {
    const label = normalise(entry.label);
    const haystack = `${label} ${normalise(entry.sublabel ?? '')} ${normalise(entry.keywords)}`;
    let score = 0;
    let all = true;
    for (const word of words) {
      if (label.startsWith(word) || label.includes(` ${word}`)) score += 3;
      else if (label.includes(word)) score += 2;
      else if (haystack.includes(word)) score += 1;
      else {
        all = false;
        break;
      }
    }
    if (all) {
      if (entry.kind === 'place') score += 0.5;
      scored.push({ entry, score });
    }
  }
  return scored.sort((a, b) => b.score - a.score).map((item) => item.entry);
}
