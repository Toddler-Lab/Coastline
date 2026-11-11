import type { Metadata } from 'next';
import Link from 'next/link';
import type { AdminFoodOrderDto, DiningAdminVenueDto } from '@coastline/api-contracts';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DiningKitchenBoard } from '@/components/admin/dining-kitchen-board';
import { readParam } from '@/components/admin/utils';
import { serverApi } from '@/lib/api';
import { diningErrorMessage } from '@/lib/dining/admin';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Kitchen queue' };

export default async function AdminDiningKitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  const params = await searchParams;
  const venueCode = readParam(params.venueCode)?.toUpperCase() ?? '';
  const query = venueCode ? `?venueCode=${encodeURIComponent(venueCode)}` : '';

  const [ordersResult, venuesResult] = await Promise.allSettled([
    serverApi<AdminFoodOrderDto[]>(`/admin/dining/food-orders${query}`, viewer.userId),
    serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId),
  ]);
  const venues =
    venuesResult.status === 'fulfilled'
      ? venuesResult.value
          .filter((venue) => venue.deliveryEnabled || venue.code === venueCode)
          .map((venue) => ({ code: venue.code, name: venue.name }))
      : [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dining"
        className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist hover:text-foam"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Dining desk
      </Link>
      <AdminPageHeader
        eyebrow="Operations · dining"
        title="Kitchen queue"
        description="Sunbed food orders by stage. Advance an order as it moves through the kitchen; only placed orders can be cancelled, which refunds the simulated payment."
      />
      <DiningKitchenBoard
        venueCode={venueCode}
        venues={venues}
        initialOrders={ordersResult.status === 'fulfilled' ? ordersResult.value : null}
        initialError={
          ordersResult.status === 'rejected' ? diningErrorMessage(ordersResult.reason) : null
        }
      />
    </div>
  );
}
