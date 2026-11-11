'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bike, CalendarCheck, Compass, Utensils } from 'lucide-react';
import type {
  DiningVenueKind,
  DiningVenueQuery,
  DiningVenueSummary,
} from '@coastline/api-contracts';
import { DINING_VENUE_KINDS } from '@coastline/api-contracts';
import { filterVenues } from '@/lib/dining/catalogue';
import { cn } from '@/lib/cn';
import { VenueCard } from './venue-card';
import { VENUE_KIND_LABELS } from './dining-format';

export interface VenueDiscoveryProps {
  venues: DiningVenueSummary[];
  /** Filters taken from the page URL so a filtered view can be shared. */
  initialQuery: DiningVenueQuery;
  /** Current Asia/Dhaka hour from the server. */
  dhakaHour: number;
}

function chipClass(active: boolean): string {
  return cn(
    'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
    active ? 'bg-sea text-abyss shadow-sm' : 'bg-surface text-mist hover:bg-raised hover:text-foam',
  );
}

/** Mirrors the active filters into the URL without a navigation. */
function syncUrl(query: DiningVenueQuery): void {
  const params = new URLSearchParams();
  if (query.kind) params.set('kind', query.kind);
  if (query.beachPointCode) params.set('beachPointCode', query.beachPointCode);
  if (query.reservable) params.set('reservable', 'true');
  if (query.delivers) params.set('delivers', 'true');
  const search = params.toString();
  window.history.replaceState(null, '', search ? `/food?${search}` : '/food');
}

export function VenueDiscovery({ venues, initialQuery, dhakaHour }: VenueDiscoveryProps) {
  const [kind, setKind] = useState<DiningVenueKind | undefined>(initialQuery.kind);
  // A beach point no listed venue uses would select a hidden option; ignore it.
  const [beachPointCode, setBeachPointCode] = useState<string | undefined>(() =>
    venues.some((venue) => venue.beachPointCode === initialQuery.beachPointCode)
      ? initialQuery.beachPointCode
      : undefined,
  );
  const [reservable, setReservable] = useState(initialQuery.reservable === true);
  const [delivers, setDelivers] = useState(initialQuery.delivers === true);

  const query = useMemo<DiningVenueQuery>(
    () => ({
      kind,
      beachPointCode,
      reservable: reservable ? true : undefined,
      delivers: delivers ? true : undefined,
    }),
    [kind, beachPointCode, reservable, delivers],
  );

  useEffect(() => {
    syncUrl(query);
  }, [query]);

  const beachPoints = useMemo(() => {
    const seen = new Map<string, string>();
    for (const venue of venues) {
      if (venue.beachPointCode && !seen.has(venue.beachPointCode)) {
        seen.set(venue.beachPointCode, venue.beachPointName ?? venue.beachPointCode);
      }
    }
    return [...seen.entries()].map(([code, name]) => ({ code, name }));
  }, [venues]);

  const visible = useMemo(() => filterVenues(venues, query), [venues, query]);
  const filtered = Boolean(kind || beachPointCode || reservable || delivers);

  function reset() {
    setKind(undefined);
    setBeachPointCode(undefined);
    setReservable(false);
    setDelivers(false);
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Filter venues"
        className="space-y-4 panel rounded-2xl p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Venue type">
          <span className="mr-1 text-[11.5px] font-medium text-mist">Type:</span>
          <button
            type="button"
            aria-pressed={kind === undefined}
            onClick={() => setKind(undefined)}
            className={chipClass(kind === undefined)}
          >
            All venues
          </button>
          {DINING_VENUE_KINDS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
              className={chipClass(kind === value)}
            >
              {VENUE_KIND_LABELS[value]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 border-t border-line/60 pt-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-end">
          <div>
            <label
              htmlFor="dining-beach-point"
              className="text-[11px] font-medium uppercase tracking-wider text-mist"
            >
              Beach point
            </label>
            <select
              id="dining-beach-point"
              value={beachPointCode ?? ''}
              onChange={(event) => setBeachPointCode(event.target.value || undefined)}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[13px] text-foam focus:border-sea focus:outline-none"
            >
              <option value="">All beach points</option>
              {beachPoints.map((point) => (
                <option key={point.code} value={point.code}>
                  {point.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Services">
            <button
              type="button"
              aria-pressed={reservable}
              onClick={() => setReservable((value) => !value)}
              className={chipClass(reservable)}
            >
              <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
              Reserve a table
            </button>
            <button
              type="button"
              aria-pressed={delivers}
              onClick={() => setDelivers((value) => !value)}
              className={chipClass(delivers)}
            >
              <Bike className="h-3.5 w-3.5" aria-hidden />
              Delivers to your sunbed
            </button>
            {filtered ? (
              <button
                type="button"
                onClick={reset}
                className="min-h-9 rounded-lg px-3 py-1.5 text-[12px] font-medium text-mist underline-offset-2 hover:text-foam hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex flex-col justify-between gap-3 rounded-xl border border-sea/25 bg-sea/5 p-4 text-[12.5px] text-mist sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <Compass className="h-5 w-5 flex-none text-sea" aria-hidden />
          <span aria-live="polite">
            Showing{' '}
            <strong className="text-foam">
              {visible.length} {visible.length === 1 ? 'venue' : 'venues'}
            </strong>
            . Hours are Asia/Dhaka local time.
          </span>
        </div>
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-sand">
          Indicative demo prices
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="space-y-3 panel rounded-2xl p-12 text-center">
          <Utensils className="mx-auto h-10 w-10 text-mist" aria-hidden />
          <h2 className="text-[18px] font-semibold text-foam">
            {venues.length === 0 ? 'No venues listed yet' : 'No venues match your filters'}
          </h2>
          <p className="mx-auto max-w-md text-[13px] text-mist">
            {venues.length === 0
              ? 'The demo dining catalogue is empty. Seed the database to see venues here.'
              : 'Try another venue type or beach point, or clear the service filters.'}
          </p>
          {filtered ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-surface px-4 py-2 text-[12.5px] font-semibold text-foam transition-colors hover:bg-raised"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((venue) => (
            <VenueCard key={venue.id} venue={venue} dhakaHour={dhakaHour} />
          ))}
        </div>
      )}
    </div>
  );
}
