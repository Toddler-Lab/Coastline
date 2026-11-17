import {
  Building2,
  Camera,
  Car,
  Compass,
  Sailboat,
  ShoppingBag,
  Ticket,
  Umbrella,
  UtensilsCrossed,
  BedDouble,
  type LucideIcon,
} from 'lucide-react';

/**
 * Service types (design.md 6.1 and 7.4). Each type has one fixed icon used
 * everywhere: tile, card badge, ticket and filter.
 */
export const SERVICE_KEYS = [
  'stay',
  'food',
  'sunbeds',
  'rides',
  'boats',
  'tours',
  'tickets',
  'photographers',
  'shopping',
  'facilities',
] as const;

export type ServiceKey = (typeof SERVICE_KEYS)[number];

export interface ServiceMeta {
  key: ServiceKey;
  label: string;
  /** Plural noun for "No ___ here yet". */
  noun: string;
  /** Singular noun for a count of one. */
  one: string;
  icon: LucideIcon;
  /** Short line under the tile title. */
  blurb: string;
}

export const SERVICES: Record<ServiceKey, ServiceMeta> = {
  stay: {
    key: 'stay',
    label: 'Stay',
    noun: 'places to stay',
    one: 'place to stay',
    icon: BedDouble,
    blurb: 'Hotels and resorts',
  },
  food: {
    key: 'food',
    label: 'Food',
    noun: 'places to eat',
    one: 'place to eat',
    icon: UtensilsCrossed,
    blurb: 'Tables and sunbed delivery',
  },
  sunbeds: {
    key: 'sunbeds',
    label: 'Sunbeds',
    noun: 'sunbeds',
    one: 'sunbed',
    icon: Umbrella,
    blurb: 'Book by the hour',
  },
  rides: {
    key: 'rides',
    label: 'Rides',
    noun: 'rides',
    one: 'ride',
    icon: Car,
    blurb: 'Jeeps, tuk-tuks, transfers',
  },
  boats: {
    key: 'boats',
    label: 'Boats',
    noun: 'boat trips',
    one: 'boat trip',
    icon: Sailboat,
    blurb: 'Trips and hire',
  },
  tours: {
    key: 'tours',
    label: 'Tours',
    noun: 'tours and activities',
    one: 'tour',
    icon: Compass,
    blurb: 'Guided days out',
  },
  tickets: {
    key: 'tickets',
    label: 'Tickets',
    noun: 'entry tickets',
    one: 'entry ticket',
    icon: Ticket,
    blurb: 'Parks and sites',
  },
  photographers: {
    key: 'photographers',
    label: 'Photographers',
    noun: 'photographers',
    one: 'photographer',
    icon: Camera,
    blurb: 'Packages and bids',
  },
  shopping: {
    key: 'shopping',
    label: 'Shopping',
    noun: 'shops',
    one: 'shop',
    icon: ShoppingBag,
    blurb: 'Local markets',
  },
  facilities: {
    key: 'facilities',
    label: 'Facilities',
    noun: 'facilities',
    one: 'facility',
    icon: Building2,
    blurb: 'ATM, pharmacy, washroom',
  },
};

export function isServiceKey(value: string): value is ServiceKey {
  return (SERVICE_KEYS as readonly string[]).includes(value);
}
