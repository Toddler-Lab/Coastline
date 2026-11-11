import type { Metadata } from 'next';
import type { DiningVenueQuery, DiningVenueSummary } from '@coastline/api-contracts';
import { ApiError, serverApi } from '@/lib/api';
import { venuesPath, isVenueKind } from '@/lib/dining/catalogue';
import { toDhaka } from '@/lib/format';
import { getViewer } from '@/lib/session';
import { ApiOffline } from '@/components/booking/api-offline';
import { VenueDiscovery } from '@/components/dining/venue-discovery';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Beach dining · Seafood kitchens, restaurants and beach stalls',
  description:
    'Discover Cox’s Bazar seafood kitchens, Bengali restaurants and beach stalls. Reserve a table or order to your sunbed. Prices are indicative demo prices.',
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function initialQueryFrom(params: SearchParams): DiningVenueQuery {
  const query: DiningVenueQuery = {};
  const kind = first(params.kind);
  if (isVenueKind(kind)) query.kind = kind;
  const point = first(params.beachPointCode);
  if (point && /^[A-Za-z0-9-]{1,32}$/.test(point)) query.beachPointCode = point.toUpperCase();
  if (first(params.reservable) === 'true') query.reservable = true;
  if (first(params.delivers) === 'true') query.delivers = true;
  return query;
}

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [viewer, params] = await Promise.all([getViewer(), searchParams]);
  const dhakaHour = toDhaka(new Date()).getUTCHours();

  let venues: DiningVenueSummary[] | null = null;
  let errorMessage = 'The dining API is offline. Start the API on port 3001, then try again.';
  try {
    // Load the full active list once; filters are applied in the browser.
    venues = await serverApi<DiningVenueSummary[]>(venuesPath(), viewer.userId);
  } catch (error) {
    if (error instanceof ApiError) {
      errorMessage = error.message;
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-20 pt-8 sm:px-6">
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-sea/30 bg-sea/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-sea">
                Beach dining
              </span>
              <span className="rounded-md border border-sand/30 bg-sand/10 px-2 py-0.5 font-mono text-[11px] text-sand">
                Indicative demo prices · Simulated payments
              </span>
            </div>
            <h1 className="mt-3 font-display text-[32px] leading-tight text-foam sm:text-[40px]">
              Eat by the Bay of Bengal
            </h1>
            <p className="mt-0.5 text-[15px] text-mist" lang="bn">
              সি-ফুড ও রেস্তোরাঁ
            </p>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-mist">
              Seafood kitchens, Bengali restaurants and beach stalls near the Cox’s Bazar sunbed
              lines. Browse menus, reserve a table, or have snacks delivered to the sunbed you
              booked.
            </p>
          </div>

          {venues ? (
            <div className="flex flex-wrap gap-2 text-[12px] text-mist sm:text-right">
              <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-2">
                <span className="block font-mono text-[18px] font-bold text-foam">
                  {venues.length}
                </span>
                <span className="text-[11px]">Listed venues</span>
              </div>
              <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-2">
                <span className="block font-mono text-[18px] font-bold text-sea">
                  {venues.filter((venue) => venue.deliveryEnabled).length}
                </span>
                <span className="text-[11px]">Deliver to sunbeds</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {venues ? (
            <VenueDiscovery
              venues={venues}
              initialQuery={initialQueryFrom(params)}
              dhakaHour={dhakaHour}
            />
          ) : (
            <ApiOffline title="Could not load dining venues" message={errorMessage} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
