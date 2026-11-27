import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type {
  AdminFoodOrderDto,
  AdminReservationDto,
  DiningAdminOverviewDto,
} from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { dhakaDateKey, formatLongDateKey, formatMoney, formatTimeRange } from '@/lib/format';
import {
  FOOD_ORDER_STATUS_LABELS,
  foodOrderStatusTone,
  RESERVATION_STATUS_LABELS,
  reservationStatusTone,
} from '@/lib/dining/admin';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/display';
import { EmptyState, ErrorState } from '@/components/ui/feedback-states';
import { MetricCard, StaffPage } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Today' };

export default async function ProviderTodayPage() {
  const viewer = await getViewer();
  const today = dhakaDateKey();
  const [overview, reservations, orders] = await Promise.allSettled([
    serverApi<DiningAdminOverviewDto>(`/admin/dining/overview?date=${today}`, viewer.userId),
    serverApi<AdminReservationDto[]>(`/admin/dining/reservations?date=${today}`, viewer.userId),
    serverApi<AdminFoodOrderDto[]>('/admin/dining/food-orders', viewer.userId),
  ]);

  if (overview.status === 'rejected') {
    return (
      <StaffPage title="Today">
        <ErrorState message={apiErrorMessage(overview.reason)} retryHref="/provider" />
      </StaffPage>
    );
  }
  const stats = overview.value;
  const arrivals =
    reservations.status === 'fulfilled'
      ? reservations.value
          .filter((item) => item.status !== 'CANCELLED')
          .sort((a, b) => a.startAt.localeCompare(b.startAt))
      : [];
  const open =
    orders.status === 'fulfilled'
      ? orders.value.filter(
          (item) =>
            item.status === 'PLACED' || item.status === 'PREPARING' || item.status === 'READY',
        )
      : [];

  return (
    <StaffPage title="Today" description={formatLongDateKey(today)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Table arrivals"
          value={stats.reservationsToday}
          href="/provider/bookings"
        />
        <MetricCard label="Open food orders" value={stats.openFoodOrders} href="/provider/orders" />
        <MetricCard
          label="Food sales today"
          value={formatMoney(stats.foodRevenueMinor, stats.currency)}
          hint="Recorded payments; no money moved"
        />
        <MetricCard label="Venues" value={stats.venueCount} href="/provider/listings" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="arrivals-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="arrivals-title" className="text-title">
              Arrivals
            </h2>
            <Link
              href="/provider/bookings"
              className="inline-flex h-11 items-center text-label text-primary"
            >
              All bookings <ChevronRight aria-hidden className="size-5" />
            </Link>
          </div>
          {arrivals.length === 0 ? (
            <EmptyState title="No tables booked today" />
          ) : (
            <Card as="div" className="divide-y divide-line">
              {arrivals.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="tabular text-label">
                      {formatTimeRange(item.startAt, item.endAt)}
                    </p>
                    <p className="truncate text-body-sm text-muted">
                      {item.tourist.name} · {item.partySize} guests · {item.venue.name}, table{' '}
                      {item.table.code}
                    </p>
                  </div>
                  <StatusBadge
                    tone={reservationStatusTone(item.status)}
                    label={RESERVATION_STATUS_LABELS[item.status]}
                  />
                </div>
              ))}
            </Card>
          )}
        </section>

        <section aria-labelledby="orders-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="orders-title" className="text-title">
              Kitchen queue
            </h2>
            <Link
              href="/provider/orders"
              className="inline-flex h-11 items-center text-label text-primary"
            >
              Open kitchen <ChevronRight aria-hidden className="size-5" />
            </Link>
          </div>
          {open.length === 0 ? (
            <EmptyState title="No open orders" />
          ) : (
            <Card as="div" className="divide-y divide-line">
              {open.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-label">Sunbed {item.delivery.sunbedCode}</p>
                    <p className="truncate text-body-sm text-muted">
                      {item.lines.map((line) => `${line.quantity}× ${line.name}`).join(', ')}
                    </p>
                  </div>
                  <StatusBadge
                    tone={foodOrderStatusTone(item.status)}
                    label={FOOD_ORDER_STATUS_LABELS[item.status]}
                  />
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>
    </StaffPage>
  );
}
