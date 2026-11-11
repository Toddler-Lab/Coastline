import Link from 'next/link';
import { Bike, CalendarCheck, Clock, MapPin, Utensils } from 'lucide-react';
import type { DiningVenueSummary } from '@coastline/api-contracts';
import { Panel } from '@/components/ui/panel';
import { VenueImage } from './venue-image';
import {
  VENUE_KIND_LABELS,
  formatDiningPrice,
  isVenueOpen,
  venueHoursLabel,
} from './dining-format';

export interface VenueCardProps {
  venue: DiningVenueSummary;
  /** Current Asia/Dhaka hour, resolved on the server so hydration matches. */
  dhakaHour: number;
}

export function VenueCard({ venue, dhakaHour }: VenueCardProps) {
  const open = isVenueOpen(venue.openHour, venue.closeHour, dhakaHour);

  return (
    <Panel className="group flex flex-col overflow-hidden transition-all duration-200 hover:border-sea/50 hover:shadow-lg">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
        <VenueImage
          src={venue.imageUrl}
          alt={`${venue.name}, ${VENUE_KIND_LABELS[venue.kind].toLowerCase()}`}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss/80 via-transparent to-black/20" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-abyss/85 px-2 py-1 text-[11px] font-semibold text-sand backdrop-blur-md">
            <Utensils className="h-3 w-3" aria-hidden />
            {VENUE_KIND_LABELS[venue.kind]}
          </span>
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={`rounded-md px-2 py-1 text-[11px] font-medium backdrop-blur-md ${
              open ? 'bg-success/90 text-abyss' : 'bg-abyss/85 text-mist'
            }`}
          >
            {open ? 'Open now' : 'Closed now'}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-[12px] font-medium text-foam">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-sea" aria-hidden />
            {venue.beachPointName ? `${venue.beachPointName} beach point` : 'Town venue'}
          </span>
          <span className="inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] text-foam">
            <Clock className="h-3 w-3" aria-hidden />
            {venueHoursLabel(venue.openHour, venue.closeHour)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-[17px] font-semibold text-foam transition-colors group-hover:text-sea">
            {venue.name}
          </h3>
          {venue.nameBn ? (
            <p className="text-[12.5px] text-mist" lang="bn">
              {venue.nameBn}
            </p>
          ) : null}

          {venue.description ? (
            <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-mist">
              {venue.description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {venue.cuisineTags.map((tag) => (
              <span key={tag} className="rounded bg-surface px-2 py-0.5 text-[10.5px] text-mist">
                {tag}
              </span>
            ))}
            {venue.reservationsEnabled ? (
              <span className="inline-flex items-center gap-1 rounded bg-sea/10 px-2 py-0.5 text-[10.5px] text-sea">
                <CalendarCheck className="h-3 w-3" aria-hidden /> Table booking
              </span>
            ) : null}
            {venue.deliveryEnabled ? (
              <span className="inline-flex items-center gap-1 rounded bg-sand/10 px-2 py-0.5 text-[10.5px] text-sand">
                <Bike className="h-3 w-3" aria-hidden /> Sunbed delivery
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mist">Dishes from</p>
            <p className="text-[20px] font-bold text-foam">
              {venue.priceFromMinor === null
                ? '—'
                : formatDiningPrice(venue.priceFromMinor, venue.currency)}
            </p>
            <p className="text-[10.5px] text-sand">Indicative demo price</p>
          </div>

          <Link
            href={`/food/${encodeURIComponent(venue.code)}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-sea px-3.5 py-2 text-[12.5px] font-semibold text-abyss shadow-sm transition-colors hover:bg-sea-deep"
            aria-label={`View menu for ${venue.name}`}
          >
            <Utensils className="h-3.5 w-3.5" aria-hidden />
            View menu
          </Link>
        </div>
      </div>
    </Panel>
  );
}
