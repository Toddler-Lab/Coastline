import type { PlaceInventory, Destination } from './places';
import { destinationHref, hotelListingId, listingHref, spotHref, venueListingId } from './places';
import { SERVICES, type ServiceKey } from './services';
import { servicesPresent } from './places';

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

/** Builds the client-side search index from the live inventory. */
export function buildSearchIndex(
  destination: Destination,
  inventory: PlaceInventory,
): SearchEntry[] {
  const entries: SearchEntry[] = [
    {
      kind: 'place',
      label: destination.name,
      sublabel: 'Destination',
      href: destinationHref(destination),
      keywords: `${destination.nameBn} destination`,
    },
  ];

  for (const spot of inventory.spots) {
    entries.push({
      kind: 'place',
      label: spot.name,
      sublabel: `Spot in ${destination.name}`,
      href: spotHref(destination.slug, spot),
      keywords: `${spot.code} beach spot ${destination.name}`,
    });
  }

  for (const hotel of inventory.hotels) {
    entries.push({
      kind: 'listing',
      label: hotel.name,
      sublabel: `Stay · ${hotel.address}`,
      href: listingHref(hotelListingId(hotel)),
      keywords: `stay hotel resort room ${hotel.banglaName ?? ''} ${hotel.zone} ${destination.name}`,
      service: 'stay',
    });
  }

  for (const venue of inventory.venues) {
    entries.push({
      kind: 'listing',
      label: venue.name,
      sublabel: `Food · ${venue.beachPointName ?? destination.name}`,
      href: listingHref(venueListingId(venue)),
      keywords: `food eat restaurant ${venue.nameBn ?? ''} ${venue.cuisineTags.join(' ')} ${venue.kind} ${venue.beachPointName ?? ''}`,
      service: 'food',
    });
  }

  for (const key of servicesPresent(inventory)) {
    const meta = SERVICES[key];
    entries.push({
      kind: 'service',
      label: `${meta.label} in ${destination.name}`,
      sublabel: meta.blurb,
      href: `/d/${destination.slug}/${key}`,
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
