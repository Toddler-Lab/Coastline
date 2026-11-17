import type { Metadata } from 'next';
import { OrdersPage } from '@/components/workspace/orders-page';

export const metadata: Metadata = { title: 'Bookings' };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <OrdersPage
      base="/admin/bookings"
      title="Bookings"
      description="All sunbed and room bookings by day, with payment provider. Table and food bookings are in the provider portal."
      mode="admin"
      searchParams={await searchParams}
    />
  );
}
