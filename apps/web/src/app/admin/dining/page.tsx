import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MAX_RESERVATION_ADVANCE_DAYS,
  type DiningAdminOverviewDto,
} from '@coastline/api-contracts';
import { CalendarClock, ChefHat, Store, UtensilsCrossed, Wallet } from 'lucide-react';
import { AdminDateJump } from '@/components/admin/admin-date-jump';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MetricCard } from '@/components/admin/metric-card';
import { normalizeDateKey, readParam } from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { ErrorState } from '@/components/ui/states';
import { serverApi } from '@/lib/api';
import { diningErrorMessage } from '@/lib/dining/admin';
import { addDays, dhakaDateKey, formatLongDateKey, formatMoney } from '@/lib/format';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Dining' };

const DESKS = [
  {
    href: '/admin/dining/reservations',
    title: 'Reservation desk',
    body: 'Table bookings by day, with check-in and cancellation.',
    icon: CalendarClock,
  },
  {
    href: '/admin/dining/kitchen',
    title: 'Kitchen queue',
    body: 'Sunbed food orders moving from placed to delivered.',
    icon: ChefHat,
  },
  {
    href: '/admin/dining/venues',
    title: 'Venues & menus',
    body: 'Opening hours, deposits, toggles and menu prices.',
    icon: Store,
  },
] as const;

export default async function AdminDiningPage({
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
  const date = normalizeDateKey(readParam(params.date), today);
  const minDate = addDays(today, -30);
  const maxDate = addDays(today, MAX_RESERVATION_ADVANCE_DAYS);
  const isToday = date === today;

  let overview: DiningAdminOverviewDto | null = null;
  let failure: string | null = null;
  try {
    overview = await serverApi<DiningAdminOverviewDto>(
      `/admin/dining/overview?date=${date}`,
      viewer.userId,
    );
  } catch (error) {
    failure = diningErrorMessage(error);
  }

  const header = (
    <AdminPageHeader
      eyebrow="Operations · dining"
      title={
        <>
          Dining desk
          <span className="mt-1 block font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-mist">
            {formatLongDateKey(date)}
            {isToday ? ' · today' : ''}
          </span>
        </>
      }
      description="Restaurants, beach stalls and sunbed food delivery. Deposits, payments and revenue on this desk are simulated."
      actions={<AdminDateJump basePath="/admin/dining" date={date} min={minDate} max={maxDate} />}
    />
  );

  return (
    <div className="space-y-6">
      {header}

      {overview ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Active venues"
            value={overview.venueCount}
            unit="venues"
            icon={Store}
            tone="sea"
            hint="Inactive venues are hidden from tourists."
          />
          <MetricCard
            label="Table reservations"
            value={overview.reservationsToday}
            unit="bookings"
            icon={CalendarClock}
            tone="sand"
            hint={`Not cancelled, starting ${isToday ? 'today' : 'on this day'} (Dhaka time).`}
          />
          <MetricCard
            label="Open food orders"
            value={overview.openFoodOrders}
            unit="orders"
            icon={UtensilsCrossed}
            tone="mist"
            hint="Placed, preparing or ready right now, independent of the date."
          />
          <MetricCard
            label="Food revenue"
            value={formatMoney(overview.foodRevenueMinor)}
            icon={Wallet}
            tone="coral"
            hint={
              <>
                Prototype revenue from food orders placed on this day, cancellations excluded.
                <span className="ml-1.5 inline-flex rounded-full border border-coral/35 bg-coral/10 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-coral">
                  Simulated
                </span>
              </>
            }
          />
        </div>
      ) : (
        <ErrorState
          title="Dining overview unavailable"
          message={failure ?? 'The API did not answer.'}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="grid gap-3 sm:grid-cols-3">
          {DESKS.map((desk) => (
            <Link
              key={desk.href}
              href={desk.href}
              className="panel group flex min-h-32 flex-col gap-2 p-4 transition-colors hover:border-sea/50"
            >
              <span
                aria-hidden
                className="grid h-9 w-9 place-items-center rounded-lg border border-sea/25 bg-sea/10 text-sea"
              >
                <desk.icon className="h-4 w-4" />
              </span>
              <span className="text-[15px] text-foam group-hover:text-sea">{desk.title}</span>
              <span className="text-[12px] leading-relaxed text-mist">{desk.body}</span>
            </Link>
          ))}
        </div>

        <Panel className="p-4">
          <PanelHeader eyebrow="Demo data" title="What is simulated" />
          <p className="mt-2 text-[12px] leading-relaxed text-mist">
            Menu prices are indicative, reservation deposits and food payments are mock charges, and
            refunds are mock reversals. No real money moves. Every change made on this desk is
            audit-logged.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="warn">Mock money</Badge>
            <Badge tone="neutral">Indicative prices</Badge>
          </div>
          <Link
            href="/admin/dining/venues"
            className={buttonClass('secondary', 'md', 'mt-4 w-full justify-start')}
          >
            <Store aria-hidden className="h-4 w-4 text-sea" />
            Edit venues & menus
          </Link>
        </Panel>
      </div>
    </div>
  );
}
