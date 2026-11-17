import Link from 'next/link';
import { Clock, MapPin, Star, Umbrella } from 'lucide-react';
import type {
  BeachPointSummary,
  DiningVenueSummary,
  HotelSummaryDto,
  SpotSummaryDto,
} from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { formatDistance, hoursRange, slotLabel } from '@/lib/format';
import { VENUE_KIND_LABELS } from '@/lib/dining/admin';
import {
  SPOT_KIND_LABELS,
  hotelListingId,
  listingHref,
  spotHref,
  venueListingId,
} from '@/lib/places';
import { SERVICES } from '@/lib/services';
import { Badge } from '@/components/ui/badge';
import { PriceUnit } from '@/components/ui/display';
import { AerialImage, Photo } from './hub';

function CardShell({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-md border border-line bg-surface transition-shadow hover:shadow-soft',
        className,
      )}
    >
      {children}
    </Link>
  );
}

function TypeBadge({ service }: { service: 'stay' | 'food' | 'sunbeds' }) {
  const meta = SERVICES[service];
  const Icon = meta.icon;
  return (
    <span className="absolute left-3 top-3 inline-flex h-7 items-center gap-1 rounded-full bg-surface px-2.5 text-caption text-fg shadow-soft">
      <Icon aria-hidden className="size-4 text-primary" />
      {meta.label}
    </span>
  );
}

export function HotelCard({ hotel, spotName }: { hotel: HotelSummaryDto; spotName?: string }) {
  return (
    <CardShell href={listingHref(hotelListingId(hotel))}>
      <div className="relative">
        <Photo src={hotel.featuredImage} alt={hotel.name} className="aspect-[4/3] w-full" />
        <TypeBadge service="stay" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-title-sm group-hover:text-primary">{hotel.name}</h3>
          {hotel.starRating > 0 ? (
            <span
              className="inline-flex flex-none items-center gap-0.5 text-body-sm"
              aria-label={`${hotel.starRating}-star hotel`}
            >
              <Star aria-hidden className="size-4 fill-current text-warn" />
              <span className="tabular">{hotel.starRating}</span>
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-body-sm text-muted">
          <MapPin aria-hidden className="size-4 flex-none" />
          <span className="truncate">
            {formatDistance(hotel.distanceMeters)} to {spotName ?? 'the beach'}
          </span>
        </p>
        <p className="text-body-sm text-muted">
          {hotel.availableRoomsCount > 0
            ? `${hotel.availableRoomsCount} rooms free tonight`
            : 'Check dates for rooms'}
        </p>
        <div className="mt-auto pt-2">
          <PriceUnit from minor={hotel.minPriceMinor} unit="night" />
        </div>
      </div>
    </CardShell>
  );
}

export function VenueCard({ venue }: { venue: DiningVenueSummary }) {
  const fact = venue.deliveryEnabled
    ? 'Delivers to your sunbed'
    : venue.reservationsEnabled
      ? 'Reserve a table'
      : VENUE_KIND_LABELS[venue.kind];
  return (
    <CardShell href={listingHref(venueListingId(venue))}>
      <div className="relative">
        <Photo src={venue.imageUrl} alt={venue.name} className="aspect-[4/3] w-full" />
        <TypeBadge service="food" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-title-sm group-hover:text-primary">{venue.name}</h3>
        <p className="flex items-center gap-1 text-body-sm text-muted">
          <MapPin aria-hidden className="size-4 flex-none" />
          <span className="truncate">{venue.beachPointName ?? 'In town'}</span>
          <span aria-hidden>·</span>
          <Clock aria-hidden className="size-4 flex-none" />
          <span className="truncate">{hoursRange(venue.openHour, venue.closeHour)}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge tone="primary">{fact}</Badge>
          {venue.cuisineTags.slice(0, 1).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <div className="mt-auto pt-2">
          {venue.priceFromMinor !== null ? (
            <PriceUnit from minor={venue.priceFromMinor} unit="item" />
          ) : (
            <span className="text-body-sm text-muted">Menu coming soon</span>
          )}
        </div>
      </div>
    </CardShell>
  );
}

/** A spot from the places API, with live sunbed counts when it has a sunbed row. */
export function SpotCard({
  spot,
  destination,
  beds,
}: {
  spot: SpotSummaryDto;
  destination: { slug: string; name: string };
  beds?: BeachPointSummary;
}) {
  const facts = [
    SPOT_KIND_LABELS[spot.kind],
    spot.openHours ? hoursRange(spot.openHours.open, spot.openHours.close) : null,
  ].filter(Boolean);
  const bookable = spot.services.stay + spot.services.food;
  return (
    <CardShell href={spotHref(destination.slug, spot.slug)}>
      <AerialImage
        latitude={spot.latitude}
        longitude={spot.longitude}
        zoom={16}
        cols={2}
        rows={2}
        label={`Aerial view of ${spot.name}`}
        className="aspect-[4/3] w-full"
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-title-sm group-hover:text-primary">{spot.name}</h3>
        <p className="text-body-sm text-muted">
          {destination.name} · {facts.join(' · ')}
        </p>
        {beds && beds.totalBeds > 0 ? (
          <p className="mt-auto flex items-center gap-1.5 pt-2 text-body-sm">
            <Umbrella aria-hidden className="size-4 text-primary" />
            <span>
              <span className="tabular font-semibold">{beds.freeBeds}</span>
              <span className="text-muted">
                {' '}
                of {beds.totalBeds} sunbeds free at {slotLabel(beds.referenceSlotLabel)}
              </span>
            </span>
          </p>
        ) : bookable > 0 ? (
          <p className="mt-auto pt-2 text-body-sm text-muted">
            {bookable} {bookable === 1 ? 'place' : 'places'} to book
          </p>
        ) : spot.description ? (
          <p className="mt-auto line-clamp-2 pt-2 text-body-sm text-muted">{spot.description}</p>
        ) : null}
      </div>
    </CardShell>
  );
}
