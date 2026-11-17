import type { Metadata } from 'next';
import { OrdersPage } from '@/components/workspace/orders-page';

export const metadata: Metadata = { title: 'Arrivals' };

export default async function DeskArrivalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <OrdersPage
      base="/desk/arrivals"
      title="Arrivals"
      description="Sunbed and room bookings for the day. Check guests in as they arrive."
      mode="desk"
      searchParams={await searchParams}
    />
  );
}
