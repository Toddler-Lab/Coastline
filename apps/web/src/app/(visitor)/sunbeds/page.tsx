import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, MapPin, Sparkles, Umbrella } from 'lucide-react';
import type { BeachPointSummary } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { formatMoney, hoursRange, slotLabel } from '@/lib/format';
import { findDroneSpot } from '@/lib/scenic-places-data';
import { sunbedPickerHref } from '@/lib/places';
import { PageHeader } from '@/components/patterns/spot-hub-sections';
import { ErrorState } from '@/components/ui/feedback-states';

export const metadata: Metadata = {
  title: 'Beach Sunbeds Booking | Coastline',
  description: 'Reserve front-row beach umbrellas and sunbeds by the hour across Laboni, Sugandha, Kolatoli, and Inani beaches in Cox’s Bazar.',
};

export default async function SunbedsHubPage() {
  const viewer = await getViewer();
  let points: BeachPointSummary[] = [];

  try {
    points = await serverApi<BeachPointSummary[]>('/beach-points', viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState
          title="Beach points could not be loaded"
          message={apiErrorMessage(error)}
          retryHref="/sunbeds"
        />
      </div>
    );
  }

  const activePoints = points
    .filter((point) => point.isActive && point.totalBeds > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="page pb-24">
      <PageHeader
        title="Beach Sunbeds & Umbrellas"
        subtitle="Book front-row beach lounger slots by the hour with digital QR passes"
        className="lg:pt-6"
      />

      {/* Feature Highlights Ribbon */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-primary/12 text-primary">
            <Umbrella className="size-5" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-fg">Front-Row Beach Views</h3>
            <p className="text-xs text-muted mt-0.5">Pick exact bed positions right at the water line.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-primary/12 text-primary">
            <Clock className="size-5" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-fg">Flexible Hourly Booking</h3>
            <p className="text-xs text-muted mt-0.5">Book 1 to 6 hours ahead; cancel free up to 30 mins before.</p>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
          <span className="grid size-10 flex-none place-items-center rounded-xl bg-primary/12 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-fg">Digital QR Pass</h3>
            <p className="text-xs text-muted mt-0.5">Attendants scan your pass directly from the Trips tab.</p>
          </div>
        </div>
      </div>

      {/* Beach Points Grid */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-fg mb-4">Select a Beach Point</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {activePoints.map((point) => {
            const droneSpot = findDroneSpot(point.destinationSlug, point.spotSlug);
            const imageSrc = droneSpot?.img ? `/media/places/${droneSpot.img}.webp` : null;

            return (
              <div
                key={point.code}
                className="glass-card group flex flex-col overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-alt">
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={point.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-surface-alt text-muted">
                      <Umbrella className="size-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                    {point.freeBeds} Free Now
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <h3 className="text-lg font-bold">{point.name}</h3>
                    <p className="text-xs text-white/80 line-clamp-1">{point.description}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div className="space-y-2 text-xs text-muted">
                    <p className="flex items-center gap-1.5">
                      <Clock className="size-3.5 flex-none text-primary" />
                      <span>Hours: {hoursRange(point.openHour, point.closeHour)}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Umbrella className="size-3.5 flex-none text-primary" />
                      <span>Total inventory: {point.totalBeds} verified sunbeds</span>
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted">Rate</span>
                      <p className="text-base font-extrabold text-fg">
                        {formatMoney(point.defaultHourlyPriceMinor, point.currency)}
                        <span className="text-xs font-normal text-muted"> / hour</span>
                      </p>
                    </div>
                    <Link
                      href={sunbedPickerHref(point)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-action-bg px-4 py-2 text-xs font-bold text-action-fg shadow-md transition-all hover:bg-action-bg/90 hover:scale-105"
                    >
                      Pick Beds <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
