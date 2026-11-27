import type { AdminOrderDto, AdminOrderListDto, BeachPointSummary } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { dhakaDateKey, isDateKey } from '@/lib/format';
import { shortPointName } from '@/lib/booking';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { ErrorState } from '@/components/ui/feedback-states';
import { DateNav } from './date-nav';
import { OrderList } from './order-list';
import { StaffPage } from './staff-page-shell';

/** Shared by Desk arrivals and Admin bookings; the mode decides the actions. */
export async function OrdersPage({
  base,
  title,
  description,
  mode,
  searchParams,
}: {
  base: string;
  title: string;
  description: string;
  mode: 'desk' | 'admin';
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const today = dhakaDateKey();
  const date =
    typeof searchParams.date === 'string' && isDateKey(searchParams.date)
      ? searchParams.date
      : today;
  const point =
    typeof searchParams.point === 'string' ? searchParams.point.toUpperCase() : undefined;
  const viewer = await getViewer();
  let orders: AdminOrderDto[];
  let points: BeachPointSummary[] = [];
  try {
    const search = new URLSearchParams({ date });
    if (point) search.set('pointCode', point);
    const [list, pointList] = await Promise.all([
      serverApi<AdminOrderListDto>(`/admin/orders?${search}`, viewer.userId),
      serverApi<BeachPointSummary[]>('/admin/beach-points', viewer.userId).catch(() => []),
    ]);
    orders = list.orders;
    points = pointList;
  } catch (error) {
    return (
      <StaffPage title={title}>
        <ErrorState message={apiErrorMessage(error)} retryHref={base} />
      </StaffPage>
    );
  }
  const href = (code?: string) => {
    const search = new URLSearchParams();
    if (date !== today) search.set('date', date);
    if (code) search.set('point', code.toLowerCase());
    const text = search.toString();
    return text ? `${base}?${text}` : base;
  };

  return (
    <StaffPage
      title={title}
      description={description}
      actions={
        <DateNav base={base} date={date} today={today} params={{ point: point?.toLowerCase() }} />
      }
    >
      {points.length > 1 ? (
        <ChipRow label="Spot" className="mb-4">
          <ChipLink href={href()} selected={!point}>
            All spots
          </ChipLink>
          {points.map((item) => (
            <ChipLink key={item.code} href={href(item.code)} selected={point === item.code}>
              {shortPointName(item.name)}
            </ChipLink>
          ))}
        </ChipRow>
      ) : null}
      <OrderList orders={orders} mode={mode} />
    </StaffPage>
  );
}
