import type { Metadata } from 'next';
import Link from 'next/link';
import { MAX_ADVANCE_DAYS, type AdminOverviewDto } from '@coastline/api-contracts';
import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  Plus,
  ScanLine,
  Ticket,
  Wallet,
  Wrench,
} from 'lucide-react';
import { AdminDateJump } from '@/components/admin/admin-date-jump';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MetricCard } from '@/components/admin/metric-card';
import { normalizeDateKey, pointHours, readParam } from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { ApiError, serverApi } from '@/lib/api';
import { addDays, dhakaDateKey, formatLongDateKey, formatMoney } from '@/lib/format';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Overview' };

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    // The layout explains the role requirement; do not fetch admin data here.
    return null;
  }

  const params = await searchParams;
  const today = dhakaDateKey();
  const date = normalizeDateKey(readParam(params.date), today);
  const maxDate = addDays(today, MAX_ADVANCE_DAYS);

  let overview: AdminOverviewDto | null = null;
  let failure: string | null = null;

  try {
    overview = await serverApi<AdminOverviewDto>(`/admin/overview?date=${date}`, viewer.userId);
  } catch (error) {
    failure = error instanceof ApiError ? error.message : 'The overview could not be loaded.';
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          eyebrow="Operations · overview"
          title="Dusk report"
          description="Live inventory, mocked takings and the next slots across Cox's Bazar."
          actions={<AdminDateJump basePath="/admin" date={date} min={today} max={maxDate} />}
        />
        <ErrorState title="Overview unavailable" message={failure ?? 'The API did not answer.'} />
      </div>
    );
  }

  const fillPercent =
    overview.capacitySlots > 0
      ? Math.min(100, Math.round((overview.bookedSlots / overview.capacitySlots) * 1000) / 10)
      : 0;
  const isToday = date === today;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations · overview"
        title={
          <>
            Dusk report
            <span className="mt-1 block font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-mist">
              {formatLongDateKey(overview.date)}
              {isToday ? ' · today' : ''}
            </span>
          </>
        }
        description="Live inventory, mocked takings and the next slots across Cox's Bazar. Bed and slot counts cover active points only."
        actions={<AdminDateJump basePath="/admin" date={date} min={today} max={maxDate} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Beds on loan now"
          value={overview.bedsOnLoan}
          unit="beds"
          icon={BedDouble}
          tone="sea"
          hint={
            isToday
              ? 'Beds with an active slot in the current Dhaka hour.'
              : 'Live figure at request time, independent of the selected date.'
          }
        />
        <MetricCard
          label="Booked slots"
          value={overview.bookedSlots}
          unit={`/ ${overview.capacitySlots} slots`}
          icon={CalendarClock}
          tone="sand"
          hint={`${fillPercent}% of the date's hourly bed capacity is booked.`}
        >
          <div
            role="progressbar"
            aria-label="Booked slots against capacity"
            aria-valuemin={0}
            aria-valuemax={Math.max(1, overview.capacitySlots)}
            aria-valuenow={overview.bookedSlots}
            aria-valuetext={`${overview.bookedSlots} of ${overview.capacitySlots} slots booked`}
            className="h-1.5 w-full overflow-hidden rounded-full bg-raised"
          >
            <div className="h-full rounded-full bg-sea" style={{ width: `${fillPercent}%` }} />
          </div>
        </MetricCard>
        <MetricCard
          label="Available beds"
          value={overview.availableBeds}
          unit={`/ ${overview.totalBeds} beds`}
          icon={Wrench}
          tone="mist"
          hint={`${overview.outOfServiceBeds} out of service · retired beds excluded`}
        >
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-mist">
            {overview.outOfServiceBeds} down for maintenance
          </p>
        </MetricCard>
        <MetricCard
          label="Mock revenue"
          value={
            overview.revenueMinor < 0
              ? `−${formatMoney(Math.abs(overview.revenueMinor))}`
              : formatMoney(overview.revenueMinor)
          }
          icon={Wallet}
          tone="coral"
          hint={
            <>
              Simulated charges minus simulated refunds.
              <span className="ml-1.5 inline-flex rounded-full border border-coral/35 bg-coral/10 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-coral">
                Simulated
              </span>
            </>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line p-4">
            <PanelHeader
              eyebrow="Active points"
              title="Beach points"
              right={
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                  {overview.points.length} active
                </span>
              }
            />
          </div>

          {overview.points.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No active beach points"
                body="Add a point and its first sunbeds to start taking bookings."
                action={
                  <Link href="/admin/points" className={buttonClass('secondary', 'md')}>
                    Open beach points
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-mist">
                    <th
                      scope="col"
                      className="px-4 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                    >
                      Point
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                    >
                      Hours
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                    >
                      Free / beds
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
                    >
                      Default price
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-right font-mono text-[9.5px] uppercase tracking-[0.14em]"
                    >
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overview.points.map((point) => (
                    <tr
                      key={point.id}
                      className="border-b border-line/70 last:border-0 hover:bg-raised/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/points/${point.code}`}
                          className="group flex min-h-11 items-center gap-3"
                        >
                          <span className="rounded-md border border-line-strong bg-abyss/60 px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-sea">
                            {point.code}
                          </span>
                          <span className="font-medium text-foam group-hover:text-sea">
                            {point.name}
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] tabular-nums text-mist">
                        {pointHours(point.openHour, point.closeHour)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums">
                        <span className="text-foam">
                          {point.freeBeds}/{point.totalBeds}
                        </span>
                        <span className="ml-2 text-[10px] text-mist">
                          at {point.referenceSlotLabel}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums text-foam">
                        {formatMoney(point.defaultHourlyPriceMinor)}
                        <span className="ml-1 text-[10px] text-mist">/hr</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/points/${point.code}`}
                          aria-label={`Open ${point.name}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-mist transition-colors hover:bg-raised hover:text-sea"
                        >
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="border-t border-line px-4 py-2.5 text-[11px] text-mist">
            Free counts refer to each point&rsquo;s reference slot (the next bookable hour today).
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel className="p-4">
            <PanelHeader eyebrow="Shortcuts" title="Quick actions" />
            <div className="mt-3 flex flex-col gap-2">
              <Link
                href="/admin/points"
                className={buttonClass('secondary', 'md', 'justify-start')}
              >
                <Plus aria-hidden className="h-4 w-4 text-sea" />
                Add a beach point
              </Link>
              <Link
                href="/admin/bookings"
                className={buttonClass('secondary', 'md', 'justify-start')}
              >
                <Ticket aria-hidden className="h-4 w-4 text-sand" />
                Open bookings
              </Link>
              <Link
                href="/admin/bookings#ticket-validator"
                className={buttonClass('secondary', 'md', 'justify-start')}
              >
                <ScanLine aria-hidden className="h-4 w-4 text-coral" />
                Validate a ticket
              </Link>
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="label">Demo data</p>
            <p className="mt-2 text-[12px] leading-relaxed text-mist">
              This desk reads the same seeded demo database as the tourist app. Revenue and payments
              are simulated. Check-ins and cancellations are real state changes inside the demo.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="sea">Live inventory</Badge>
              <Badge tone="warn">Mock money</Badge>
              <Badge tone="neutral">No walk-ins</Badge>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
