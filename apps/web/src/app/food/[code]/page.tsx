import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { DiningVenueDetail } from '@coastline/api-contracts';
import { ApiError, DEFAULT_DEMO_USER, serverApi } from '@/lib/api';
import { venuePath } from '@/lib/dining/catalogue';
import { toDhaka } from '@/lib/format';
import { getViewer } from '@/lib/session';
import { ApiOffline } from '@/components/booking/api-offline';
import { VenueDetailView } from '@/components/dining/venue-detail-view';
import { SiteFooter } from '@/components/site/site-footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  try {
    const venue = await serverApi<DiningVenueDetail>(venuePath(code), DEFAULT_DEMO_USER);
    return {
      title: `${venue.name} · Beach dining`,
      description: venue.description ?? `Menu and opening hours for ${venue.name}.`,
    };
  } catch {
    return { title: 'Dining venue · Beach dining' };
  }
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [{ code }, viewer] = await Promise.all([params, getViewer()]);
  const dhakaHour = toDhaka(new Date()).getUTCHours();

  let venue: DiningVenueDetail;
  try {
    venue = await serverApi<DiningVenueDetail>(venuePath(code), viewer.userId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    const message =
      error instanceof ApiError
        ? error.message
        : 'The dining API is offline. Start the API on port 3001, then try again.';
    return (
      <>
        <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
          <ApiOffline title="Could not load this venue" message={message} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
        <VenueDetailView venue={venue} viewer={viewer.user} dhakaHour={dhakaHour} />
      </main>
      <SiteFooter />
    </>
  );
}
