import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, MapPin, Sparkles, UtensilsCrossed, ArrowRight } from 'lucide-react';
import type { DiningVenueSummary } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { formatMoney, hoursRange } from '@/lib/format';
import { listingHref, venueListingId } from '@/lib/places';
import { PageHeader } from '@/components/patterns/hub';
import { EmptyState, ErrorState } from '@/components/ui/states';

export const metadata: Metadata = {
  title: 'Dining & Sunbed Delivery | Coastline',
  description: 'Explore coastal seafood kitchens, beach cafes and restaurants with live delivery directly to your sunbed in Cox’s Bazar.',
};

const FILTER_TABS = [
  { id: 'all', label: 'All Venues', href: '/dining' },
  { id: 'delivery', label: 'Delivers to Sunbed', href: '/dining?filter=delivery' },
  { id: 'reservations', label: 'Table Reservations', href: '/dining?filter=reservations' },
  { id: 'seafood', label: 'Seafood Grill', href: '/dining?filter=seafood' },
  { id: 'cafe', label: 'Beach Cafes', href: '/dining?filter=cafe' },
];

export default async function DiningPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const currentFilter = typeof query.filter === 'string' ? query.filter : 'all';

  const viewer = await getViewer();
  let venues: DiningVenueSummary[] = [];

  try {
    venues = await serverApi<DiningVenueSummary[]>('/dining/venues', viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState
          title="Dining venues could not be loaded"
          message={apiErrorMessage(error)}
          retryHref="/dining"
        />
      </div>
    );
  }

  const filteredVenues = venues.filter((venue) => {
    if (currentFilter === 'delivery') return venue.deliveryEnabled;
    if (currentFilter === 'reservations') return venue.reservationsEnabled;
    if (currentFilter === 'seafood') {
      return (
        venue.cuisineTags.some((t) => /seafood|fish|grill/i.test(t)) ||
        /seafood/i.test(venue.name)
      );
    }
    if (currentFilter === 'cafe') {
      return (
        /cafe|stall/i.test(venue.kind) ||
        venue.cuisineTags.some((t) => /cafe|coffee|snack|tea/i.test(t))
      );
    }
    return true;
  });

  return (
    <div className="page pb-24">
      <PageHeader
        title="Seafood & Beach Dining"
        subtitle="Order fresh catch delivered directly to your sunbed or reserve tables with scenic sea views"
        className="lg:pt-6"
      />

      {/* Filter Tabs */}
      <nav aria-label="Dining categories" className="mt-6 flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => {
          const active = currentFilter === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                active
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface border border-line text-muted hover:border-primary/40 hover:text-fg'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {/* Spot quick links */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-medium text-muted">Spots in Cox&apos;s Bazar:</span>
        <Link
          href="/d/coxs-bazar/food"
          className="rounded-full bg-surface-alt px-3 py-1 font-medium text-fg transition-colors hover:bg-primary hover:text-white"
        >
          All spots
        </Link>
        <Link
          href="/d/coxs-bazar/food?spot=laboni"
          className="rounded-full bg-surface-alt px-3 py-1 font-medium text-fg transition-colors hover:bg-primary hover:text-white"
        >
          Laboni Beach
        </Link>
        <Link
          href="/d/coxs-bazar/food?spot=kolatoli"
          className="rounded-full bg-surface-alt px-3 py-1 font-medium text-fg transition-colors hover:bg-primary hover:text-white"
        >
          Kolatoli
        </Link>
        <Link
          href="/d/coxs-bazar/food?spot=sugandha"
          className="rounded-full bg-surface-alt px-3 py-1 font-medium text-fg transition-colors hover:bg-primary hover:text-white"
        >
          Sugandha Beach
        </Link>
      </div>

      {filteredVenues.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={UtensilsCrossed}
            title="No dining venues match this filter"
            body="Try selecting another category or view all dining venues across destinations."
            action={{ label: 'View all venues', href: '/dining' }}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVenues.map((venue) => (
            <Link
              key={venue.id}
              href={listingHref(venueListingId(venue))}
              className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                {venue.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-surface-alt text-muted">
                    <UtensilsCrossed className="size-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {venue.deliveryEnabled ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                    <Sparkles className="size-3" /> Delivers to Sunbed
                  </span>
                ) : venue.reservationsEnabled ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md">
                    Reserve a Table
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="text-base font-bold text-fg group-hover:text-primary transition-colors">
                    {venue.name}
                  </h3>
                  {venue.nameBn ? (
                    <p className="font-bn text-xs text-muted mt-0.5">{venue.nameBn}</p>
                  ) : null}

                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="size-3.5 flex-none" />
                    <span>{venue.beachPointName ?? 'Town center'}</span>
                    <span>·</span>
                    <Clock className="size-3.5 flex-none" />
                    <span>{hoursRange(venue.openHour, venue.closeHour)}</span>
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {venue.cuisineTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-surface-alt px-2.5 py-0.5 text-[11px] font-medium text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted">Items from</span>
                    <p className="text-base font-extrabold text-fg">
                      {venue.priceFromMinor !== null ? formatMoney(venue.priceFromMinor, 'BDT') : '—'}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    Explore Menu →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
