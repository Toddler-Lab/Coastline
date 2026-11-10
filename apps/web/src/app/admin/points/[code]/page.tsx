import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MAX_ADVANCE_DAYS,
  type BeachPointDetail,
  type BeachPointSummary,
} from '@coastline/api-contracts';
import { ArrowLeft, ArrowRight, Pencil, Ticket } from 'lucide-react';
import { AdminDateJump } from '@/components/admin/admin-date-jump';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { SunbedsManager } from '@/components/admin/sunbeds-manager';
import {
  formatCoordinates,
  normalizeDateKey,
  pointHours,
  readParam,
} from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { ErrorState } from '@/components/ui/states';
import { ApiError, serverApi } from '@/lib/api';
import { addDays, dhakaDateKey, formatMoney } from '@/lib/format';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Beach point' };

export default async function AdminPointDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  const { code } = await params;
  const query = await searchParams;
  const today = dhakaDateKey();
  const date = normalizeDateKey(readParam(query.date), today);
  const maxDate = addDays(today, MAX_ADVANCE_DAYS);
  const upperCode = code.toUpperCase();

  let points: BeachPointSummary[] | null = null;
  let listFailure: string | null = null;
  try {
    points = await serverApi<BeachPointSummary[]>(
      `/admin/beach-points?date=${date}`,
      viewer.userId,
    );
  } catch (error) {
    listFailure =
      error instanceof ApiError ? error.message : 'The beach point could not be loaded.';
  }

  if (!points) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/points"
          className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist hover:text-foam"
        >
          <ArrowLeft aria-hidden className="h-4 w-4" />
          All beach points
        </Link>
        <ErrorState
          title="Beach point unavailable"
          message={listFailure ?? 'The API did not answer.'}
        />
      </div>
    );
  }

  const point = points.find((entry) => entry.code.toUpperCase() === upperCode);
  if (!point) {
    notFound();
  }

  let detail: BeachPointDetail | null = null;
  let detailFailure: string | null = null;
  try {
    detail = await serverApi<BeachPointDetail>(
      `/beach-points/${encodeURIComponent(point.code)}?date=${date}`,
      viewer.userId,
    );
  } catch (error) {
    detailFailure = error instanceof ApiError ? error.message : 'Availability could not be loaded.';
  }

  const facts: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: 'Status',
      value: (
        <Badge tone={point.isActive ? 'success' : 'warn'}>
          {point.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      label: 'Coordinates',
      value: (
        <span className="font-mono tabular-nums">
          {formatCoordinates(point.latitude, point.longitude)}
        </span>
      ),
    },
    {
      label: 'Hours (Dhaka)',
      value: (
        <span className="font-mono tabular-nums">
          {pointHours(point.openHour, point.closeHour)}
        </span>
      ),
    },
    {
      label: 'Default price',
      value: (
        <span className="font-mono tabular-nums">
          {formatMoney(point.defaultHourlyPriceMinor)}
          <span className="ml-1 text-[10px] text-mist">/hr · {point.currency}</span>
        </span>
      ),
    },
    {
      label: `Free at ${point.referenceSlotLabel}`,
      value: (
        <span className="font-mono tabular-nums">
          {point.freeBeds}/{point.totalBeds}
          <span className="ml-1.5 text-[10px] text-mist">beds</span>
        </span>
      ),
    },
    {
      label: 'Sort order',
      value: <span className="font-mono tabular-nums">{point.sortOrder}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/points"
        className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist hover:text-foam"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        All beach points
      </Link>

      <AdminPageHeader
        eyebrow={`Operations · ${point.code}`}
        title={point.name}
        description={
          point.description ??
          'No tourist-facing description yet. Add one from the point editor so the map card reads well.'
        }
        actions={
          <AdminDateJump
            basePath={`/admin/points/${point.code}`}
            date={date}
            min={today}
            max={maxDate}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 lg:order-2">
          <Panel className="p-4">
            <PanelHeader eyebrow="Facts" title="Point record" />
            <dl className="mt-3 divide-y divide-line/70">
              {facts.map((fact) => (
                <div key={fact.label} className="flex items-baseline justify-between gap-3 py-2">
                  <dt className="label">{fact.label}</dt>
                  <dd className="text-right text-[12.5px] text-foam">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 grid gap-2">
              <Link
                href={`/admin/points?edit=${point.code}`}
                className={buttonClass('secondary', 'md', 'justify-start')}
              >
                <Pencil aria-hidden className="h-4 w-4 text-sea" />
                Edit point facts
              </Link>
              <Link
                href={`/admin/bookings?pointCode=${point.code}`}
                className={buttonClass('ghost', 'md', 'justify-start')}
              >
                <Ticket aria-hidden className="h-4 w-4 text-sand" />
                Bookings at this point
                <ArrowRight aria-hidden className="ml-auto h-4 w-4" />
              </Link>
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="label">Demo inventory</p>
            <p className="mt-2 text-[12px] leading-relaxed text-mist">
              Adding beds and changing prices writes to the demo database. Status changes are
              refused while future bookings hold a bed; cancelled orders release their slots.
            </p>
          </Panel>
        </div>

        <div className="min-w-0 lg:order-1">
          {detail ? (
            <SunbedsManager point={detail} />
          ) : (
            <ErrorState
              title={point.isActive ? 'Availability unavailable' : 'Point is inactive'}
              message={detailFailure ?? 'The availability grid could not be loaded for this point.'}
            />
          )}
          {!point.isActive ? (
            <p className="mt-3 rounded-xl border border-warn/30 bg-warn/5 p-3 text-[12px] leading-relaxed text-mist">
              Inactive points are hidden from tourists and cannot take new bookings. The inventory
              endpoint refuses to return a grid for them; reactivate the point from the editor to
              manage its beds.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
