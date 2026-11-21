import type { Metadata } from 'next';
import Link from 'next/link';
import { BedDouble, MapPin, Sparkles, Star, ArrowRight } from 'lucide-react';
import type { HotelSummaryDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { formatDistance, formatMoney } from '@/lib/format';
import { listingHref, hotelListingId } from '@/lib/places';
import { PageHeader } from '@/components/patterns/hub';
import { EmptyState, ErrorState } from '@/components/ui/states';

export const metadata: Metadata = {
  title: 'Hotels & Resorts in Bangladesh | Coastline',
  description: 'Book verified beachfront resorts, heritage cottages and boutique hotels across Bangladesh with instant confirmation.',
};

const DEST_TABS = [
  { id: 'all', label: 'All Destinations', href: '/stays' },
  { id: 'coxs-bazar', label: "Cox's Bazar", href: '/stays?dest=coxs-bazar' },
  { id: 'sylhet', label: 'Sylhet', href: '/stays?dest=sylhet' },
  { id: 'rangamati', label: 'Rangamati', href: '/stays?dest=rangamati' },
  { id: 'bandarban', label: 'Bandarban', href: '/stays?dest=bandarban' },
];

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const selectedDest = typeof query.dest === 'string' ? query.dest : 'all';

  const viewer = await getViewer();
  let hotels: HotelSummaryDto[] = [];

  try {
    hotels = await serverApi<HotelSummaryDto[]>('/hotels', viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState
          title="Hotels could not be loaded"
          message={apiErrorMessage(error)}
          retryHref="/stays"
        />
      </div>
    );
  }

  const filteredHotels = selectedDest === 'all'
    ? hotels
    : hotels.filter((h) => h.destinationSlug === selectedDest);

  return (
    <div className="page pb-24">
      <PageHeader
        title="Stays & Beach Resorts"
        subtitle="Verified beachfront hotels, eco-cottages and resorts with instant booking"
        className="lg:pt-6"
      />

      {/* Destination Filter Tabs */}
      <nav aria-label="Destination filter" className="mt-6 flex flex-wrap items-center gap-2">
        {DEST_TABS.map((tab) => {
          const active = selectedDest === tab.id;
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

      {/* Contextual link to destination stay directory */}
      {selectedDest === 'coxs-bazar' && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface p-4 text-xs">
          <span className="text-muted">
            Looking for spot-level filters (Laboni, Kolatoli, Inani) and map view?
          </span>
          <Link
            href="/d/coxs-bazar/stay"
            className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
          >
            Open Cox&apos;s Bazar Stays Directory <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {filteredHotels.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={BedDouble}
            title={`No verified stays listed for this region yet`}
            body="New boutique hotels and eco-cottages are verified and added regularly."
            action={{ label: 'View all destinations', href: '/stays' }}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredHotels.map((hotel) => (
            <Link
              key={hotel.id}
              href={listingHref(hotelListingId(hotel))}
              className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                {hotel.featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hotel.featuredImage}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-surface-alt text-muted">
                    <BedDouble className="size-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {hotel.isFeatured ? (
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md">
                    <Sparkles className="size-3" /> Featured Stay
                  </span>
                ) : null}
                {hotel.starRating > 0 ? (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-amber-400 backdrop-blur-md">
                    <Star className="size-3 fill-current" /> {hotel.starRating} Stars
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <h3 className="text-base font-bold text-fg group-hover:text-primary transition-colors">
                    {hotel.name}
                  </h3>
                  {hotel.banglaName ? (
                    <p className="font-bn text-xs text-muted mt-0.5">{hotel.banglaName}</p>
                  ) : null}

                  <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="size-3.5 flex-none" />
                    <span className="truncate">{formatDistance(hotel.distanceMeters)} to beach</span>
                  </p>

                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {hotel.availableRoomsCount > 0
                      ? `${hotel.availableRoomsCount} rooms available tonight`
                      : 'Select dates for availability'}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted">From</span>
                    <p className="text-base font-extrabold text-fg">
                      {formatMoney(hotel.minPriceMinor, 'BDT')}
                      <span className="text-xs font-normal text-muted"> / night</span>
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    View Rooms →
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
