import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { HotelDetailDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { addDays, dhakaDateKey } from '@/lib/format';
import { getViewer } from '@/lib/session';
import { HotelDetailView } from '@/components/hotels/hotel-detail-view';
import { SiteFooter } from '@/components/site/site-footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const hotel = await serverApi<HotelDetailDto>(
      `/hotels/${slug}`,
      '00000000-0000-4000-8000-000000000002',
    );
    return {
      title: `${hotel.name} · Instant Room Reservation Cox’s Bazar`,
      description: hotel.description,
    };
  } catch {
    return {
      title: 'Hotel Detail · Cox’s Bazar Coastal Tourism',
    };
  }
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();

  const today = dhakaDateKey();
  const checkIn =
    (Array.isArray(query.checkIn) ? query.checkIn[0] : query.checkIn) || today;
  const checkOut =
    (Array.isArray(query.checkOut) ? query.checkOut[0] : query.checkOut) ||
    addDays(checkIn, 1);

  let hotel: HotelDetailDto | null = null;
  try {
    hotel = await serverApi<HotelDetailDto>(
      `/hotels/${slug}?checkInDate=${checkIn}&checkOutDate=${checkOut}`,
      viewer.user?.id ?? '00000000-0000-4000-8000-000000000002',
    );
  } catch (err) {
    notFound();
  }

  if (!hotel) {
    notFound();
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-6 sm:px-6">
        <HotelDetailView
          hotel={hotel}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
        />
      </main>
      <SiteFooter />
    </>
  );
}
