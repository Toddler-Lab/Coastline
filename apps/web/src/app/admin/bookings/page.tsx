import type { Metadata } from 'next';
import {
  MAX_ADVANCE_DAYS,
  type AdminOrderListDto,
  type BeachPointSummary,
  type OrderStatus,
} from '@coastline/api-contracts';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { BookingsManager } from '@/components/admin/bookings-manager';
import { normalizeDateKey, readParam } from '@/components/admin/utils';
import { ErrorState } from '@/components/ui/states';
import { ApiError, serverApi } from '@/lib/api';
import { addDays, dhakaDateKey } from '@/lib/format';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Bookings & check-in' };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  const params = await searchParams;
  const today = dhakaDateKey();
  const dates = Array.from({ length: MAX_ADVANCE_DAYS + 1 }, (_, index) => addDays(today, index));
  const requestedDate = normalizeDateKey(readParam(params.date), today);
  const date = dates.includes(requestedDate) ? requestedDate : today;
  const pointCode = readParam(params.pointCode)?.toUpperCase() ?? '';
  const rawStatus = readParam(params.status);
  const status: OrderStatus | '' =
    rawStatus === 'CONFIRMED' || rawStatus === 'CANCELLED' ? rawStatus : '';
  const ref = readParam(params.ref)?.toUpperCase() ?? '';

  const query = new URLSearchParams({ date });
  if (pointCode) query.set('pointCode', pointCode);
  if (status) query.set('status', status);
  if (ref) query.set('ref', ref);

  let data: {
    orders: AdminOrderListDto['orders'];
    date: string;
    points: BeachPointSummary[];
  } | null = null;
  let failure: string | null = null;

  try {
    const [list, points] = await Promise.all([
      serverApi<AdminOrderListDto>(`/admin/orders?${query.toString()}`, viewer.userId),
      serverApi<BeachPointSummary[]>(`/admin/beach-points?date=${date}`, viewer.userId),
    ]);
    data = { orders: list.orders, date: list.date, points };
  } catch (error) {
    failure = error instanceof ApiError ? error.message : 'Bookings could not be loaded.';
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations · arrivals"
        title="Bookings & check-in"
        description="Filter the day's arrivals, check guests in bed by bed, cancel with a reason, and verify QR tickets at the gate. Payments and refunds are simulated."
      />
      {data ? (
        <BookingsManager
          orders={data.orders}
          points={data.points}
          date={data.date}
          pointCode={pointCode}
          status={status}
          ref={ref}
          today={today}
          dates={dates}
        />
      ) : (
        <ErrorState title="Bookings unavailable" message={failure ?? 'The API did not answer.'} />
      )}
    </div>
  );
}
