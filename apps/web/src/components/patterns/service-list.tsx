import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpDown,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Umbrella,
  Video,
} from 'lucide-react';
import type { BeachPointSummary, DestinationDetailDto, SpotSummaryDto } from '@coastline/api-contracts';
import type { PlaceInventory } from '@/lib/places';
import { sunbedPickerHref } from '@/lib/places';
import { SERVICES, type ServiceKey } from '@/lib/services';
import { formatMoney, hoursRange, slotLabel } from '@/lib/format';
import { findDroneSpot } from '@/lib/scenic-places-data';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { EmptyState, ErrorState } from '@/components/ui/feedback-states';
import { HotelCard, VenueCard } from './listing-cards';
import { AerialImage, PageHeader } from './spot-hub-sections';

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
  const droneSpot = findDroneSpot(point.destinationSlug, point.spotSlug);
  const heroImageSrc = droneSpot?.img ? `/media/places/${droneSpot.img}.webp` : null;

  return (
    <Link
      href={sunbedPickerHref(point)}
      className="group flex h-full overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      <div className="relative aspect-square w-32 flex-none overflow-hidden bg-surface-alt md:w-44">
        {heroImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageSrc}
            alt={point.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <AerialImage
            latitude={point.latitude}
            longitude={point.longitude}
            zoom={17}
            cols={1}
            rows={1}
            label={`Aerial view of ${point.name}`}
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:hidden" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-bold text-fg transition-colors group-hover:text-primary">
              {point.name}
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {point.freeBeds} free
            </span>
          </div>

          <p className="mt-1 text-xs text-muted">
            {hoursRange(point.openHour, point.closeHour)} · {point.totalBeds} total sunbeds
          </p>

          <p className="mt-1 text-xs text-muted">
            Reference slot: <span className="font-medium text-fg">{slotLabel(point.referenceSlotLabel)}</span>
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">Hourly Rate</span>
            <p className="text-sm font-bold text-fg">
              {formatMoney(point.defaultHourlyPriceMinor, point.currency)}
              <span className="text-xs font-normal text-muted"> / hr</span>
            </p>
          </div>
          <span className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors group-hover:bg-action-bg group-hover:text-action-fg">
            Select Beds →
          </span>
        </div>
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
      <ul className="grid gap-4 md:grid-cols-2">
        {points.map((item) => (
          <li key={item.code}>
            <SunbedPointCard point={item} />
          </li>
        ))}
      </ul>
    );
  } else if (service === 'photographers') {
    const packages = [
      {
        id: 'portraits',
        title: 'Beach Walk & Sunset Portraits',
        price: 'Tk 5',
        unit: '/ keeper photo',
        desc: `Verified on-beach portrait photographers at ${placeName}. Pay only for the shots you select and keep.`,
        features: [
          'Direct wireless phone transfer (AirDrop / WhatsApp)',
          'No minimum order quantity',
          'Instant review on camera display',
        ],
        icon: Camera,
        badge: 'Pay Per Photo',
        cta: 'Request On Beach',
        href: `/inbox?new=photographer&type=portrait&dest=${destination.slug}`,
      },
      {
        id: 'drone',
        title: '4K Drone Cinematography',
        price: 'Tk 1,500',
        unit: '/ 20-min flight',
        desc: `Dramatic overhead 4K aerial reels of your group along ${placeName}.`,
        features: [
          'Licensed CAAB drone operator',
          'Color-graded 4K 60FPS video reels',
          'Delivery within 2 hours',
        ],
        icon: Video,
        badge: 'Popular',
        cta: 'Book Drone Operator',
        href: `/inbox?new=photographer&type=drone&dest=${destination.slug}`,
      },
      {
        id: 'story',
        title: 'Half-Day Coastal Story',
        price: 'Tk 3,500',
        unit: '/ 4 hours',
        desc: `Dedicated personal photographer traveling with your party across ${destination.name} viewpoints.`,
        features: [
          '4 hours comprehensive coverage',
          'Unlimited edited high-res digital photos',
          'Permanent cloud gallery link',
        ],
        icon: Sparkles,
        badge: 'Full Story',
        cta: 'Request Coverage',
        href: `/inbox?new=photographer&type=story&dest=${destination.slug}`,
      },
    ];
    count = packages.length;
    body = (
      <div className="space-y-6">
        <ul className="grid gap-6 md:grid-cols-3">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <li
                key={pkg.id}
                className="group flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-6" />
                    </span>
                    <span className="rounded-full bg-surface-alt px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                      {pkg.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-fg group-hover:text-primary transition-colors">
                    {pkg.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{pkg.desc}</p>
                  <ul className="mt-4 space-y-2 text-xs text-muted">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="size-3.5 flex-none text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 border-t border-line/60 pt-4">
                  <p className="text-base font-extrabold text-fg">
                    {pkg.price}{' '}
                    <span className="text-xs font-normal text-muted">{pkg.unit}</span>
                  </p>
                  <Link
                    href={pkg.href}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-action-bg px-4 py-2 text-xs font-bold text-action-fg shadow-md transition-all hover:bg-action-bg/90"
                  >
                    {pkg.cta} <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-xs text-muted">
          <ShieldCheck className="size-4 flex-none text-primary mt-0.5" />
          <div>
            <span className="font-bold text-fg">Sealed Bids & Identity Verified:</span>{' '}
            Photographers in Coastline&apos;s network carry active tourist police registration badges. All custom requests receive sealed private bids so you get the fairest beach market rates.
          </div>
        </div>
      </div>
    );
  }

  const sortable = (service === 'stay' || service === 'food') && count > 1;

  return (
    <div className="page pb-24" data-accent={destination.accent}>
      {/* 2026 Navigation Header */}
      <div className="flex items-center gap-2 py-2 text-xs text-muted">
        <Link href="/" className="hover:text-fg">
          Bangladesh
        </Link>
        <span>/</span>
        <Link href={`/d/${destination.slug}`} className="hover:text-fg">
          {destination.name}
        </Link>
        {spot ? (
          <>
            <span>/</span>
            <Link href={`/d/${destination.slug}/s/${spot.slug}`} className="hover:text-fg">
              {spot.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="font-semibold text-fg">{meta.label}</span>
      </div>

      <PageHeader
        title={`${meta.label} ${spot ? 'at' : 'in'} ${placeName}`}
        subtitle={count > 0 ? `${count} ${count === 1 ? 'place' : 'places'} available` : undefined}
        backHref={backHref}
        backLabel={`Back to ${placeName}`}
        className="lg:pt-4"
      />

      {filters.length > 0 ? (
        <div className="mt-2">
          <ChipRow label="Filters" className="min-w-0">
            {filters}
          </ChipRow>
        </div>
      ) : null}

      {sortable ? (
        <div className="mt-3 flex items-center gap-2 text-body-sm">
          <ArrowUpDown aria-hidden className="size-4 text-muted" />
          <span className="text-muted">Sort by:</span>
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
                  ? 'inline-flex h-9 items-center rounded-full bg-primary/10 px-3 font-semibold text-primary'
                  : 'inline-flex h-9 items-center rounded-full px-3 text-muted hover:bg-surface-alt hover:text-fg'
              }
            >
              {option === 'recommended' ? 'Recommended' : option === 'price' ? 'Price' : 'Distance'}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-6">
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
                ? `See all ${meta.noun} across ${destination.name}.`
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
