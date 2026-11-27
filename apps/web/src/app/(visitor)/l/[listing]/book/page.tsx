import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { DiningVenueDetail, HotelDetailDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, isNotFound } from '@/lib/places-server';
import { listingHref, parseListingId } from '@/lib/places';
import { dhakaDateKey } from '@/lib/format';
import { ErrorState } from '@/components/ui/feedback-states';
import { StayFlow } from '@/components/flows/stay-flow';
import { TableFlow } from '@/components/flows/table-flow';
import { FoodOrderFlow } from '@/components/flows/food-order-flow';

export const metadata: Metadata = { title: 'Book' };

type Params = { listing: string };
type Search = Record<string, string | string[] | undefined>;

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const id = (await params).listing;
  const query = await searchParams;
  const ref = parseListingId(id);
  if (!ref) notFound();
  const viewer = await getViewer();
  const today = dhakaDateKey();
  const backHref = listingHref(id);

  let listing: { hotel: HotelDetailDto } | { venue: DiningVenueDetail };
  try {
    listing =
      ref.kind === 'hotel'
        ? {
            hotel: await serverApi<HotelDetailDto>(
              `/hotels/${encodeURIComponent(ref.slug)}`,
              viewer.userId,
            ),
          }
        : {
            venue: await serverApi<DiningVenueDetail>(
              `/dining/venues/${encodeURIComponent(ref.code)}`,
              viewer.userId,
            ),
          };
  } catch (error) {
    if (isNotFound(error)) notFound();
    return (
      <div className="page py-10">
        <ErrorState
          title="Booking could not start"
          message={apiErrorMessage(error)}
          retryHref={`${backHref}/book`}
        />
      </div>
    );
  }

  if ('hotel' in listing) {
    const room = typeof query.room === 'string' ? query.room : undefined;
    return (
      <StayFlow hotel={listing.hotel} today={today} backHref={backHref} initialRoomId={room} />
    );
  }
  const { venue } = listing;
  if (query.mode === 'order' && venue.deliveryEnabled) {
    return <FoodOrderFlow venue={venue} backHref={backHref} />;
  }
  if (venue.reservationsEnabled) {
    return <TableFlow venue={venue} today={today} backHref={backHref} />;
  }
  if (venue.deliveryEnabled) {
    return <FoodOrderFlow venue={venue} backHref={backHref} />;
  }
  notFound();
}
