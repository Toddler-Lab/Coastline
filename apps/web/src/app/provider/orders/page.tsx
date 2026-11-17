import type { Metadata } from 'next';
import type { AdminFoodOrderDto, DiningAdminVenueDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { KitchenBoard } from '@/components/workspace/kitchen-board';
import { StaffPage } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Kitchen' };

export default async function ProviderOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const venue = typeof query.venue === 'string' ? query.venue.toUpperCase() : '';
  const viewer = await getViewer();
  const [orders, venues] = await Promise.allSettled([
    serverApi<AdminFoodOrderDto[]>(
      `/admin/dining/food-orders${venue ? `?venueCode=${encodeURIComponent(venue)}` : ''}`,
      viewer.userId,
    ),
    serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId),
  ]);
  const delivering =
    venues.status === 'fulfilled' ? venues.value.filter((item) => item.deliveryEnabled) : [];

  return (
    <StaffPage
      title="Kitchen"
      description="Sunbed food orders, oldest first. Move each one forward as it is cooked and delivered."
    >
      {delivering.length > 1 ? (
        <ChipRow label="Venue" className="mb-4">
          <ChipLink href="/provider/orders" selected={!venue}>
            All venues
          </ChipLink>
          {delivering.map((item) => (
            <ChipLink
              key={item.code}
              href={`/provider/orders?venue=${item.code.toLowerCase()}`}
              selected={venue === item.code}
            >
              {item.name}
            </ChipLink>
          ))}
        </ChipRow>
      ) : null}
      <KitchenBoard
        venueCode={venue}
        initialOrders={orders.status === 'fulfilled' ? orders.value : []}
        initialError={orders.status === 'rejected' ? apiErrorMessage(orders.reason) : null}
      />
    </StaffPage>
  );
}
