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
import { findDroneSpot } from '@/lib/drone-landing-data';
import { Badge } from '@/components/ui/badge';
import { PriceUnit } from '@/components/ui/display';
import { AerialImage, Photo } from './spot-hub-sections';

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
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl',
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
    <span className="absolute left-3 top-3 inline-flex h-7 items-center gap-1.5 rounded-full bg-surface/90 px-3 text-caption font-semibold text-fg shadow-md backdrop-blur-md">
      <Icon aria-hidden className="size-3.5 text-primary" />
      {meta.label}
    </span>
  );
}

export function HotelCard({ hotel, spotName }: { hotel: HotelSummaryDto; spotName?: string }) {
  return (
    <CardShell href={listingHref(hotelListingId(hotel))}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
        <Photo src={hotel.featuredImage} alt={hotel.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <TypeBadge service="stay" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-fg transition-colors group-hover:text-primary">{hotel.name}</h3>
          {hotel.starRating > 0 ? (
            <span
              className="inline-flex flex-none items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400"
              aria-label={`${hotel.starRating}-star hotel`}
            >
              <Star aria-hidden className="size-3.5 fill-current text-warn" />
              <span className="tabular">{hotel.starRating}</span>
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-xs text-muted">
          <MapPin aria-hidden className="size-3.5 flex-none" />
          <span className="truncate">
            {formatDistance(hotel.distanceMeters)} to {spotName ?? 'the beach'}
          </span>
        </p>
        <p className="text-xs text-muted">
          {hotel.availableRoomsCount > 0
            ? `${hotel.availableRoomsCount} rooms free tonight`
            : 'Check dates for rooms'}
        </p>
        <div className="mt-auto border-t border-line/60 pt-3">
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
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
        <Photo src={venue.imageUrl} alt={venue.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <TypeBadge service="food" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base font-bold text-fg transition-colors group-hover:text-primary">{venue.name}</h3>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin aria-hidden className="size-3.5 flex-none" />
          <span className="truncate">{venue.beachPointName ?? 'In town'}</span>
          <span aria-hidden>·</span>
          <Clock aria-hidden className="size-3.5 flex-none" />
          <span className="truncate">{hoursRange(venue.openHour, venue.closeHour)}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {fact}
          </span>
          {venue.cuisineTags.slice(0, 1).map((tag) => (
            <span key={tag} className="inline-flex rounded-full bg-surface-alt px-2.5 py-0.5 text-xs text-muted">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-auto border-t border-line/60 pt-3">
          {venue.priceFromMinor !== null ? (
            <PriceUnit from minor={venue.priceFromMinor} unit="item" />
          ) : (
            <span className="text-xs text-muted">Menu coming soon</span>
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
  const droneSpot = findDroneSpot(destination.slug, spot.slug);
  const heroImageSrc = droneSpot?.img ? `/media/places/${droneSpot.img}.webp` : null;

  const facts = [
    SPOT_KIND_LABELS[spot.kind],
    spot.openHours ? hoursRange(spot.openHours.open, spot.openHours.close) : null,
  ].filter(Boolean);
  const bookable = spot.services.stay + spot.services.food;

  return (
    <CardShell href={spotHref(destination.slug, spot.slug)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-alt">
        {heroImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageSrc}
            alt={spot.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <AerialImage
            latitude={spot.latitude}
            longitude={spot.longitude}
            zoom={16}
            cols={2}
            rows={2}
            label={`Aerial view of ${spot.name}`}
            className="h-full w-full"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white/90 backdrop-blur-md">
          {SPOT_KIND_LABELS[spot.kind]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base font-bold text-fg transition-colors group-hover:text-primary">{spot.name}</h3>
        <p className="text-xs text-muted">
          {destination.name} · {facts.join(' · ')}
        </p>
        {beds && beds.totalBeds > 0 ? (
          <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-3">
            <span className="flex items-center gap-1.5 text-xs">
              <Umbrella aria-hidden className="size-4 text-primary" />
              <span className="tabular font-bold text-fg">{beds.freeBeds}</span>
              <span className="text-muted">of {beds.totalBeds} free</span>
            </span>
            <span className="text-xs font-semibold text-primary">Reserve →</span>
          </div>
        ) : bookable > 0 ? (
          <p className="mt-auto border-t border-line/60 pt-3 text-xs text-muted">
            {bookable} {bookable === 1 ? 'place' : 'places'} to book
          </p>
        ) : spot.description ? (
          <p className="mt-auto line-clamp-2 border-t border-line/60 pt-3 text-xs text-muted">{spot.description}</p>
        ) : null}
      </div>
    </CardShell>
  );
}
