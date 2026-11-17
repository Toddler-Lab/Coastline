import type { Metadata } from 'next';
import Link from 'next/link';
import type { AdminOverviewDto, DiningAdminOverviewDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { dhakaDateKey, formatMoney, isDateKey } from '@/lib/format';
import { shortPointName } from '@/lib/booking';
import { DEFAULT_DESTINATION } from '@/lib/places';
import { Card } from '@/components/ui/display';
import { ErrorState } from '@/components/ui/states';
import { DateNav } from '@/components/workspace/date-nav';
import { MetricCard, StaffPage } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Overview' };

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const today = dhakaDateKey();
  const date = typeof query.date === 'string' && isDateKey(query.date) ? query.date : today;
  const viewer = await getViewer();
  const [sunbeds, dining] = await Promise.allSettled([
    serverApi<AdminOverviewDto>(`/admin/overview?date=${date}`, viewer.userId),
    serverApi<DiningAdminOverviewDto>(`/admin/dining/overview?date=${date}`, viewer.userId),
  ]);
  if (sunbeds.status === 'rejected') {
    return (
      <StaffPage title="Overview">
        <ErrorState message={apiErrorMessage(sunbeds.reason)} retryHref="/admin" />
      </StaffPage>
    );
  }
  const overview = sunbeds.value;
  const food = dining.status === 'fulfilled' ? dining.value : null;
  const occupancy =
    overview.capacitySlots > 0
      ? Math.round((overview.bookedSlots / overview.capacitySlots) * 100)
      : 0;

  return (
    <StaffPage
      title="Overview"
      description={`${DEFAULT_DESTINATION.name}. Amounts are recorded payments through the sandbox gateway; no money moved.`}
      actions={<DateNav base="/admin" date={date} today={today} />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Sunbed revenue"
          value={formatMoney(overview.revenueMinor, overview.currency)}
          href={`/admin/bookings${date === today ? '' : `?date=${date}`}`}
        />
        <MetricCard
          label="Sunbed occupancy"
          value={`${occupancy}%`}
          hint={`${overview.bookedSlots} of ${overview.capacitySlots} bed-hours`}
        />
        <MetricCard
          label="Food sales"
          value={food ? formatMoney(food.foodRevenueMinor, food.currency) : '—'}
          href="/provider/orders"
        />
        <MetricCard
          label="Table bookings"
          value={food ? food.reservationsToday : '—'}
          href="/provider/bookings"
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Beds in service"
          value={overview.availableBeds}
          hint={`${overview.totalBeds} total`}
        />
        <MetricCard label="Out of service" value={overview.outOfServiceBeds} />
        <MetricCard label="Open food orders" value={food ? food.openFoodOrders : '—'} />
        <MetricCard label="Venues" value={food ? food.venueCount : '—'} href="/provider/listings" />
      </div>

      <section aria-labelledby="spots-title" className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="spots-title" className="text-title">
            Spots
          </h2>
          <Link
            href={`/admin/destinations/${DEFAULT_DESTINATION.slug}`}
            className="text-label text-primary"
          >
            Manage
          </Link>
        </div>
        <Card as="div" className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-body-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Spot
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Free now
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Beds
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Price / hour
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {overview.points.map((point) => (
                <tr key={point.code}>
                  <th scope="row" className="px-4 py-3 font-semibold">
                    {shortPointName(point.name)}{' '}
                    <span className="font-mono text-caption text-muted">{point.code}</span>
                  </th>
                  <td className="tabular px-4 py-3 text-right">{point.freeBeds}</td>
                  <td className="tabular px-4 py-3 text-right">{point.totalBeds}</td>
                  <td className="tabular px-4 py-3 text-right">
                    {formatMoney(point.defaultHourlyPriceMinor, point.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </StaffPage>
  );
}
