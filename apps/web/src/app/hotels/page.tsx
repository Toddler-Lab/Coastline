import type { Metadata } from 'next';
import { BedDouble, Hotel, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import type { HotelSummaryDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { addDays, dhakaDateKey } from '@/lib/format';
import { getViewer } from '@/lib/session';
import { HotelDiscovery } from '@/components/hotels/hotel-discovery';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'Cox’s Bazar Hotels & Stays · Instant Reservation & Tariffs',
  description: 'Book verified coastal hotels and resorts across Kolatoli, Sugandha, Laboni, and Inani with assigned room numbers.',
};

export default async function HotelsPage() {
  const viewer = await getViewer();
  const today = dhakaDateKey();
  const tomorrow = addDays(today, 1);

  let hotels: HotelSummaryDto[] = [];
  try {
    hotels = await serverApi<HotelSummaryDto[]>(
      `/hotels?checkInDate=${today}&checkOutDate=${tomorrow}`,
      viewer.user?.id ?? '00000000-0000-4000-8000-000000000002',
    );
  } catch (err) {
    hotels = [];
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-20 pt-8 sm:px-6">
        {/* Header Hero */}
        <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-sea/10 border border-sea/30 px-2 py-0.5 text-[11px] font-mono uppercase tracking-wider text-sea">
                Verified Stays · Room Assigned
              </span>
              <span className="rounded-md bg-sand/10 border border-sand/30 px-2 py-0.5 text-[11px] font-mono text-sand">
                Simulated Booking
              </span>
            </div>
            <h1 className="mt-3 font-display text-[32px] sm:text-[40px] leading-tight text-foam">
              Cox’s Bazar Hotels & Resorts
            </h1>
            <p className="mt-1 text-[14px] text-mist max-w-2xl leading-relaxed">
              Discover audited coastal accommodations across Kolatoli, Sugandha, Laboni, and Marine Drive.
              Check live room availability, transparent nightly rates, and reserve with instant room number assignment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[12px] text-mist sm:text-right">
            <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-2">
              <span className="block font-mono text-[18px] font-bold text-foam">13</span>
              <span className="text-[11px]">Audited Hotels</span>
            </div>
            <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-2">
              <span className="block font-mono text-[18px] font-bold text-sea">100%</span>
              <span className="text-[11px]">Tariff Transparency</span>
            </div>
          </div>
        </div>

        {/* Discovery & Booking Engine */}
        <div className="mt-8">
          <HotelDiscovery
            initialHotels={hotels}
            initialCheckIn={today}
            initialCheckOut={tomorrow}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
