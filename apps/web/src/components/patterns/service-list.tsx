import Link from 'next/link';
import { ArrowUpDown, Umbrella } from 'lucide-react';
import type { BeachPointSummary, DestinationDetailDto, SpotSummaryDto } from '@coastline/api-contracts';
import type { PlaceInventory } from '@/lib/places';
import { sunbedPickerHref } from '@/lib/places';
import { SERVICES, type ServiceKey } from '@/lib/services';
import { formatMoney, hoursRange, slotLabel } from '@/lib/format';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { HotelCard, VenueCard } from './cards';
import { AerialImage, PageHeader } from './hub';

export type ListParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function withParams(base: string, params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

function SunbedPointCard({ point }: { point: BeachPointSummary }) {
  return (
    <Link
      href={sunbedPickerHref(point)}
      className="group flex h-full overflow-hidden rounded-md border border-line bg-surface hover:shadow-soft"
    >
      <AerialImage
        latitude={point.latitude}
        longitude={point.longitude}
        zoom={17}
        cols={1}
        rows={1}
        label={`Aerial view of ${point.name}`}
        className="aspect-square w-28 flex-none md:w-36"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <h2 className="text-title-sm group-hover:text-primary">{point.name}</h2>
        <p className="text-body-sm text-muted">{hoursRange(point.openHour, point.closeHour)}</p>
        <p className="flex items-center gap-1.5 text-body-sm">
          <Umbrella aria-hidden className="size-4 text-primary" />
          <span className="tabular font-semibold">{point.freeBeds}</span>
          <span className="text-muted">
            of {point.totalBeds} free at {slotLabel(point.referenceSlotLabel)}
          </span>
        </p>
        <p className="mt-auto text-body-sm text-muted">
          from{' '}
          <span className="text-title-sm text-fg">{formatMoney(point.defaultHourlyPriceMinor, point.currency)}</span>{' '}
          / hour
        </p>
      </div>
    </Link>
  );
}

/** List page shape (design.md 4.1): filter chips, then one-column cards growing to three. */
export function ServiceListView({
  destination,
  spot,
  service,
  inventory,
  params,
  offline,
}: {
  destination: DestinationDetailDto;
  spot: SpotSummaryDto | null;
  service: ServiceKey;
  inventory: PlaceInventory;
  params: ListParams;
  offline: boolean;
}) {
  const meta = SERVICES[service];
  const base = spot ? `/d/${destination.slug}/s/${spot.slug}/${service}` : `/d/${destination.slug}/${service}`;
  const placeName = spot ? spot.name : destination.name;
  const backHref = spot ? `/d/${destination.slug}/s/${spot.slug}` : `/d/${destination.slug}`;
  const sort = one(params.sort) ?? 'recommended';
  const filter = one(params.filter);
  const spotFilter = spot ? spot.slug : one(params.spot);
  const spotNames = new Map(destination.spots.map((item) => [item.slug, item.name]));

  let body: React.ReactNode = null;
  let count = 0;
  const filters: React.ReactNode[] = [];

  if (!spot && (service === 'stay' || service === 'food')) {
    const slugs = [
      ...new Set(
        (service === 'stay' ? inventory.hotels : inventory.venues)
          .map((item) => item.spotSlug)
          .filter((slug): slug is string => Boolean(slug)),
      ),
    ];
    if (slugs.length > 1) {
      filters.push(
        <ChipLink key="all" href={withParams(base, { sort: sort === 'recommended' ? undefined : sort, filter })} selected={!spotFilter}>
          All spots
        </ChipLink>,
        ...slugs.map((slug) => (
          <ChipLink
            key={slug}
            href={withParams(base, { spot: slug, sort: sort === 'recommended' ? undefined : sort, filter })}
            selected={spotFilter === slug}
          >
            {spotNames.get(slug) ?? slug}
          </ChipLink>
        )),
      );
    }
  }

  if (service === 'stay') {
    const hotels = inventory.hotels
      .filter((hotel) => !spotFilter || hotel.spotSlug === spotFilter)
      .sort((a, b) =>
        sort === 'price'
          ? a.minPriceMinor - b.minPriceMinor
          : sort === 'distance'
            ? a.distanceMeters - b.distanceMeters
            : Number(b.isFeatured) - Number(a.isFeatured) || b.starRating - a.starRating,
      );
    count = hotels.length;
    body = (
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <li key={hotel.id}>
            <HotelCard hotel={hotel} spotName={hotel.spotSlug ? spotNames.get(hotel.spotSlug) : undefined} />
          </li>
        ))}
      </ul>
    );
  } else if (service === 'food') {
    const keep = { spot: spot ? undefined : one(params.spot), sort: sort === 'recommended' ? undefined : sort };
    filters.push(
      <ChipLink key="reserve" href={withParams(base, { ...keep, filter: filter === 'reserve' ? undefined : 'reserve' })} selected={filter === 'reserve'}>
        Reserve a table
      </ChipLink>,
      <ChipLink key="delivers" href={withParams(base, { ...keep, filter: filter === 'delivers' ? undefined : 'delivers' })} selected={filter === 'delivers'}>
        Delivers to your sunbed
      </ChipLink>,
    );
    const venues = inventory.venues
      .filter((venue) => !spotFilter || venue.spotSlug === spotFilter)
      .filter((venue) => (filter === 'reserve' ? venue.reservationsEnabled : filter === 'delivers' ? venue.deliveryEnabled : true))
      .sort((a, b) => (sort === 'price' ? (a.priceFromMinor ?? Infinity) - (b.priceFromMinor ?? Infinity) : 0));
    count = venues.length;
    body = (
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <li key={venue.id}>
            <VenueCard venue={venue} />
          </li>
        ))}
      </ul>
    );
  } else if (service === 'sunbeds') {
    const points = inventory.spots.filter((item) => item.totalBeds > 0 && (!spot || item.spotSlug === spot.slug));
    count = points.length;
    body = (
      <ul className="grid gap-3 md:grid-cols-2">
        {points.map((item) => (
          <li key={item.code}>
            <SunbedPointCard point={item} />
          </li>
        ))}
      </ul>
    );
  }

  const sortable = (service === 'stay' || service === 'food') && count > 1;

  return (
    <div className="page" data-accent={destination.accent}>
      <PageHeader
        title={`${meta.label} ${spot ? 'at' : 'in'} ${placeName}`}
        subtitle={count > 0 ? `${count} ${count === 1 ? 'result' : 'results'}` : undefined}
        backHref={backHref}
        backLabel={`Back to ${placeName}`}
        className="lg:pt-6"
      />
      {filters.length > 0 ? (
        <ChipRow label="Filters" className="min-w-0">
          {filters}
        </ChipRow>
      ) : null}
      {sortable ? (
        <div className="mt-2 flex items-center gap-2 text-body-sm">
          <ArrowUpDown aria-hidden className="size-4 text-muted" />
          <span className="text-muted">Sort:</span>
          {(service === 'stay' ? ['recommended', 'price', 'distance'] : ['recommended', 'price']).map((option) => (
            <Link
              key={option}
              href={withParams(base, {
                spot: spot ? undefined : one(params.spot),
                filter,
                sort: option === 'recommended' ? undefined : option,
              })}
              aria-current={sort === option ? 'true' : undefined}
              className={
                sort === option
                  ? 'inline-flex h-11 items-center rounded-sm px-2 font-semibold text-primary'
                  : 'inline-flex h-11 items-center rounded-sm px-2 text-muted hover:text-fg'
              }
            >
              {option === 'recommended' ? 'Recommended' : option === 'price' ? 'Price' : 'Distance'}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        {offline ? (
          <ErrorState message="Coastline's booking service did not answer. Try again in a moment." retryHref={base} />
        ) : count > 0 ? (
          body
        ) : (
          <EmptyState
            icon={meta.icon}
            title={`No ${meta.noun} ${spot ? 'at' : 'in'} ${placeName} yet`}
            body={
              spot
                ? `See ${meta.noun} across ${destination.name}.`
                : filter || spotFilter
                  ? 'Try removing a filter.'
                  : 'Providers have not listed any here yet. Check back soon.'
            }
            action={
              spot
                ? { label: `${meta.label} in ${destination.name}`, href: `/d/${destination.slug}/${service}` }
                : filter || spotFilter
                  ? { label: 'Clear filters', href: base }
                  : { label: `Back to ${destination.name}`, href: `/d/${destination.slug}` }
            }
          />
        )}
      </div>
    </div>
  );
}
