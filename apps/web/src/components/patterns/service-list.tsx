import Link from 'next/link';
import { ArrowUpDown, Umbrella } from 'lucide-react';
import type { BeachPointSummary } from '@coastline/api-contracts';
import type { Destination, PlaceInventory } from '@/lib/places';
import { spotSlug, sunbedPickerHref } from '@/lib/places';
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

function SunbedPointCard({ spot }: { spot: BeachPointSummary }) {
  return (
    <Link
      href={sunbedPickerHref(spot)}
      className="group flex h-full overflow-hidden rounded-md border border-line bg-surface hover:shadow-soft"
    >
      <AerialImage
        latitude={spot.latitude}
        longitude={spot.longitude}
        zoom={17}
        cols={1}
        rows={1}
        label={`Aerial view of ${spot.name}`}
        className="aspect-square w-28 flex-none md:w-36"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <h2 className="text-title-sm group-hover:text-primary">{spot.name}</h2>
        <p className="text-body-sm text-muted">{hoursRange(spot.openHour, spot.closeHour)}</p>
        <p className="flex items-center gap-1.5 text-body-sm">
          <Umbrella aria-hidden className="size-4 text-primary" />
          <span className="tabular font-semibold">{spot.freeBeds}</span>
          <span className="text-muted">
            of {spot.totalBeds} free at {slotLabel(spot.referenceSlotLabel)}
          </span>
        </p>
        <p className="mt-auto text-body-sm text-muted">
          from{' '}
          <span className="text-title-sm text-fg">
            {formatMoney(spot.defaultHourlyPriceMinor, spot.currency)}
          </span>{' '}
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
  destination: Destination;
  spot: BeachPointSummary | null;
  service: ServiceKey;
  inventory: PlaceInventory;
  params: ListParams;
  offline: boolean;
}) {
  const meta = SERVICES[service];
  const base = spot
    ? `/d/${destination.slug}/s/${spotSlug(spot)}/${service}`
    : `/d/${destination.slug}/${service}`;
  const placeName = spot ? spot.name : destination.name;
  const backHref = spot ? `/d/${destination.slug}/s/${spotSlug(spot)}` : `/d/${destination.slug}`;
  const sort = one(params.sort) ?? 'recommended';
  const filter = one(params.filter);
  const spotFilter = spot ? spot.code : one(params.spot)?.toUpperCase();
  const spotNames = new Map(inventory.spots.map((item) => [item.code, item.name]));

  let body: React.ReactNode;
  let count = 0;
  const filters: React.ReactNode[] = [];

  if (!spot && (service === 'stay' || service === 'food')) {
    const codes = [
      ...new Set(
        service === 'stay'
          ? inventory.hotels.map((hotel) => hotel.nearestBeachCode)
          : inventory.venues
              .map((venue) => venue.beachPointCode)
              .filter((code): code is string => Boolean(code)),
      ),
    ];
    filters.push(
      <ChipLink key="all" href={withParams(base, { sort, filter })} selected={!spotFilter}>
        All spots
      </ChipLink>,
      ...codes.map((code) => (
        <ChipLink
          key={code}
          href={withParams(base, { spot: code.toLowerCase(), sort, filter })}
          selected={spotFilter === code}
        >
          {spotNames.get(code) ?? code}
        </ChipLink>
      )),
    );
  }

  if (service === 'stay') {
    const hotels = inventory.hotels
      .filter((hotel) => !spotFilter || hotel.nearestBeachCode === spotFilter)
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
            <HotelCard hotel={hotel} spotName={spotNames.get(hotel.nearestBeachCode)} />
          </li>
        ))}
      </ul>
    );
  } else if (service === 'food') {
    filters.push(
      <ChipLink
        key="reserve"
        href={withParams(base, {
          spot: one(params.spot),
          sort,
          filter: filter === 'reserve' ? undefined : 'reserve',
        })}
        selected={filter === 'reserve'}
      >
        Reserve a table
      </ChipLink>,
      <ChipLink
        key="delivers"
        href={withParams(base, {
          spot: one(params.spot),
          sort,
          filter: filter === 'delivers' ? undefined : 'delivers',
        })}
        selected={filter === 'delivers'}
      >
        Delivers to your sunbed
      </ChipLink>,
    );
    const venues = inventory.venues
      .filter((venue) => !spotFilter || venue.beachPointCode === spotFilter)
      .filter((venue) =>
        filter === 'reserve'
          ? venue.reservationsEnabled
          : filter === 'delivers'
            ? venue.deliveryEnabled
            : true,
      )
      .sort((a, b) =>
        sort === 'price' ? (a.priceFromMinor ?? Infinity) - (b.priceFromMinor ?? Infinity) : 0,
      );
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
    const spots = inventory.spots.filter(
      (item) => item.totalBeds > 0 && (!spot || item.code === spot.code),
    );
    count = spots.length;
    body = (
      <ul className="grid gap-3 md:grid-cols-2">
        {spots.map((item) => (
          <li key={item.code}>
            <SunbedPointCard spot={item} />
          </li>
        ))}
      </ul>
    );
  }

  const sortable = service === 'stay' || service === 'food';

  return (
    <div className="page">
      <PageHeader
        title={`${meta.label} ${spot ? 'at' : 'in'} ${placeName}`}
        subtitle={count > 0 ? `${count} ${count === 1 ? 'result' : 'results'}` : undefined}
        backHref={backHref}
        backLabel={`Back to ${placeName}`}
        className="lg:pt-6"
      />
      {filters.length > 0 || sortable ? (
        <div className="flex items-center gap-2">
          <ChipRow label="Filters" className="min-w-0 flex-1">
            {filters}
          </ChipRow>
        </div>
      ) : null}
      {sortable ? (
        <div className="mt-2 flex items-center gap-2 text-body-sm">
          <ArrowUpDown aria-hidden className="size-4 text-muted" />
          <span className="text-muted">Sort:</span>
          {(service === 'stay'
            ? ['recommended', 'price', 'distance']
            : ['recommended', 'price']
          ).map((option) => (
            <Link
              key={option}
              href={withParams(base, {
                spot: one(params.spot),
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
          <ErrorState
            message="Coastline's booking service did not answer. Try again in a moment."
            retryHref={base}
          />
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
                ? {
                    label: `${meta.label} in ${destination.name}`,
                    href: `/d/${destination.slug}/${service}`,
                  }
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
