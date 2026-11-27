'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Info, LifeBuoy, List, TriangleAlert } from 'lucide-react';
import type { BeachPointDetail, BeachPointSummary } from '@coastline/api-contracts';
import {
  CANCEL_CUTOFF_MINUTES,
  MAX_ADVANCE_DAYS,
  MAX_BEDS_PER_ORDER,
  MAX_HOURS_PER_ITEM,
} from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import {
  bedWindowState,
  bedsTotalMinor,
  isBedSelectable,
  shortPointName,
  windowIsComplete,
  windowSlotStarts,
  type BedWindowState,
} from '@/lib/booking';
import { saveDraft } from '@/lib/checkout';
import { cn } from '@/lib/cn';
import {
  formatDateKey,
  formatIsoTime,
  formatMoney,
  formatTimeRange,
  hoursRange,
} from '@/lib/format';
import { layoutBeds } from '@/lib/map-layout';
import { spotHref } from '@/lib/places';
import MapCanvas from '@/components/map/map-canvas';
import type { MapBedData, MapPointData } from '@/components/map/coast-map';
import { Button } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { ChoiceGroup } from '@/components/ui/display';
import { Field, Select } from '@/components/ui/field';
import { ErrorState, Notice, Skeleton } from '@/components/ui/feedback-states';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/components/patterns/session';
import { DateStrip } from '@/components/patterns/booking-flow-shell';
import { HelpSheet } from '@/components/patterns/help-drawer';

const STATE_LABEL: Record<BedWindowState | 'selected', string> = {
  free: 'Free',
  booked: 'Booked',
  mine: 'Yours',
  off: 'Out of service',
  selected: 'Selected',
};

const fetcher = <T,>(path: string) => clientApi<T>(path);

export function SunbedPicker({
  points,
  code,
  initialDate,
  today,
}: {
  points: BeachPointSummary[];
  code: string;
  initialDate: string;
  today: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useSession();
  const canBook = user?.role === 'TOURIST';
  const [date, setDate] = useState(initialDate);
  const [startIso, setStartIso] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);
  const point = points.find((item) => item.code === code) ?? points[0];

  useEffect(() => {
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<BeachPointDetail>(
    `/beach-points/${encodeURIComponent(code)}?date=${date}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: false, shouldRetryOnError: false },
  );
  const detail = data && data.code === code && data.date === date ? data : null;

  // First bookable start once availability and the real clock are known.
  useEffect(() => {
    if (!detail || nowMs === 0) return;
    setStartIso((current) => {
      if (
        current &&
        detail.slots.some((slot) => slot.startsAt === current) &&
        Date.parse(current) > nowMs
      )
        return current;
      const future = detail.slots.filter((slot) => Date.parse(slot.startsAt) > nowMs);
      const withFree = future.find((slot) =>
        detail.sunbeds.some(
          (bed) => bed.status === 'AVAILABLE' && !bed.bookedSlots.includes(slot.startsAt),
        ),
      );
      return (withFree ?? future[0])?.startsAt ?? null;
    });
  }, [detail, nowMs]);

  const windowStarts = useMemo(
    () => (detail && startIso ? windowSlotStarts(detail.slots, startIso, hours) : []),
    [detail, startIso, hours],
  );
  const windowReady = Boolean(
    detail && startIso && windowIsComplete(detail.slots, startIso, hours),
  );
  const selectedBeds = useMemo(
    () => (detail ? detail.sunbeds.filter((bed) => selectedIds.includes(bed.id)) : []),
    [detail, selectedIds],
  );
  const totalMinor = bedsTotalMinor(selectedBeds, hours);

  // Drop beds that stopped being free for the window, and say why.
  useEffect(() => {
    if (!detail || !windowReady) return;
    const removed = selectedBeds.filter((bed) => bedWindowState(bed, windowStarts) !== 'free');
    if (removed.length === 0) return;
    setSelectedIds((current) => current.filter((id) => !removed.some((bed) => bed.id === id)));
    setNotice(
      `${removed.map((bed) => bed.code).join(', ')} ${removed.length === 1 ? 'is' : 'are'} not free for this time and ${removed.length === 1 ? 'was' : 'were'} removed.`,
    );
  }, [detail, windowReady, windowStarts, selectedBeds]);

  function changeDate(next: string) {
    setDate(next);
    setStartIso(null);
    if (selectedIds.length) setNotice('Date changed, so your bed selection was cleared.');
    setSelectedIds([]);
    router.replace(`/sunbeds/${code.toLowerCase()}?date=${next}`, { scroll: false });
  }

  function toggleBed(id: string) {
    if (!detail) return;
    setNotice(null);
    if (selectedIds.includes(id)) {
      setSelectedIds((current) => current.filter((item) => item !== id));
      return;
    }
    const bed = detail.sunbeds.find((item) => item.id === id);
    if (!bed || !isBedSelectable(bed, windowStarts, windowReady)) return;
    if (selectedIds.length >= MAX_BEDS_PER_ORDER) {
      toast.push(`You can book up to ${MAX_BEDS_PER_ORDER} beds at once.`);
      return;
    }
    setSelectedIds((current) => [...current, id]);
  }

  function continueToCheckout() {
    if (!detail || !startIso || !windowReady || selectedBeds.length === 0) return;
    const end = new Date(Date.parse(startIso) + hours * 3_600_000).toISOString();
    const when = `${formatDateKey(date)} · ${formatTimeRange(startIso, end)}`;
    const id = saveDraft({
      service: 'sunbeds',
      title: `Sunbeds at ${detail.name}`,
      subtitle: selectedBeds.map((bed) => bed.code).join(', '),
      when,
      lines: selectedBeds.map((bed) => ({
        label: `Sunbed ${bed.code}`,
        detail: `${formatMoney(bed.hourlyPriceMinor, bed.currency)} × ${hours} ${hours === 1 ? 'hour' : 'hours'}`,
        amountMinor: bed.hourlyPriceMinor * hours,
      })),
      totalMinor,
      currency: detail.currency,
      cancellation: `Free cancellation until ${CANCEL_CUTOFF_MINUTES} minutes before ${formatIsoTime(startIso)}.`,
      backHref: `/sunbeds/${code.toLowerCase()}?date=${date}`,
      request: {
        kind: 'sunbed',
        body: {
          items: selectedBeds.map((bed) => ({ sunbedId: bed.id, startsAt: startIso, hours })),
          paymentMethod: 'MOCK',
        },
      },
    });
    router.push(`/checkout/${id}`);
  }

  const mapPoints = useMemo<MapPointData[]>(
    () =>
      points.map((item) => ({
        code: item.code,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        freeBeds: item.freeBeds,
        totalBeds: item.totalBeds,
      })),
    [points],
  );
  const mapBeds = useMemo<MapBedData[]>(() => {
    if (!detail) return [];
    return layoutBeds(detail).map((bed) => ({
      id: bed.id,
      code: bed.code,
      latitude: bed.latitude,
      longitude: bed.longitude,
      state: selectedIds.includes(bed.id)
        ? 'selected'
        : windowReady
          ? bedWindowState(bed.sunbed, windowStarts)
          : bed.sunbed.status === 'AVAILABLE'
            ? 'free'
            : 'off',
    }));
  }, [detail, selectedIds, windowReady, windowStarts]);

  const startOptions = (detail?.slots ?? []).map((slot) => {
    const past = nowMs > 0 && Date.parse(slot.startsAt) <= nowMs;
    const fits = detail ? windowIsComplete(detail.slots, slot.startsAt, hours) : false;
    return { slot, disabled: past || !fits, why: past ? 'past' : !fits ? 'after closing' : null };
  });
  const freeCount =
    detail && windowReady
      ? detail.sunbeds.filter((bed) => bedWindowState(bed, windowStarts) === 'free').length
      : null;

  return (
    <div className="page pb-36">
      {/* 2026 Coastal Header */}
      <div className="flex items-center gap-3 py-3 lg:py-5">
        <Link
          href={spotHref(point.destinationSlug, point.spotSlug)}
          aria-label={`Back to ${point.name}`}
          className="-ml-2 inline-flex size-11 items-center justify-center rounded-full bg-surface-alt/80 hover:bg-surface-alt transition-colors"
        >
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Beach Front
            </span>
            <span className="text-xs text-muted">
              {hoursRange(point.openHour, point.closeHour)}
            </span>
          </div>
          <h1 className="truncate text-xl font-extrabold text-fg md:text-2xl">
            {point.name}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setHelpOpen(true)}
          aria-label="Help & Safety"
          className="inline-flex size-11 items-center justify-center rounded-full bg-danger-soft/40 text-danger hover:bg-danger-soft transition-colors"
        >
          <LifeBuoy aria-hidden className="size-5" />
        </button>
      </div>

      <div className="mb-2">
        <ChipRow label="Beaches">
          {points.map((item) => (
            <Chip
              key={item.code}
              selected={item.code === code}
              onClick={() =>
                item.code !== code && router.push(`/sunbeds/${item.code.toLowerCase()}?date=${date}`)
              }
            >
              {shortPointName(item.name)}
            </Chip>
          ))}
        </ChipRow>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <DateStrip
            today={today}
            days={MAX_ADVANCE_DAYS + 1}
            value={date}
            onChange={changeDate}
            label="Date"
          />
          <Field label="Start Time" htmlFor="start" className="lg:w-44">
            <Select
              id="start"
              value={startIso ?? ''}
              disabled={!detail}
              onChange={(event) => {
                setStartIso(event.target.value || null);
                setNotice(null);
              }}
            >
              {startIso ? null : <option value="">No start time</option>}
              {startOptions.map(({ slot, disabled, why }) => (
                <option key={slot.startsAt} value={slot.startsAt} disabled={disabled}>
                  {formatIsoTime(slot.startsAt)}
                  {why ? ` (${why})` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <ChoiceGroup
            name="hours"
            legend="Duration"
            value={hours}
            onChange={setHours}
            columns={4}
            className="lg:w-64"
            options={Array.from({ length: MAX_HOURS_PER_ITEM }, (_, index) => ({
              value: index + 1,
              label: `${index + 1} h`,
              disabled: Boolean(
                detail && startIso && !windowIsComplete(detail.slots, startIso, index + 1),
              ),
            }))}
          />
        </div>
      </div>

      {notice ? (
        <Notice tone="info" icon={Info} className="mt-4">
          {notice}
        </Notice>
      ) : null}
      {!canBook ? (
        <Notice
          tone="warn"
          icon={Info}
          className="mt-4"
          title="Switch to a visitor account to book"
        >
          You can browse availability. Open the account menu to switch accounts.
        </Notice>
      ) : null}
      {detail && startOptions.every((option) => option.disabled) ? (
        <Notice
          tone="warn"
          icon={TriangleAlert}
          className="mt-4"
          title="No bookable hours left on this date"
        >
          Pick another day above.
        </Notice>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-md">
        <div className="h-[56dvh] min-h-[340px] lg:h-[540px]">
          <MapCanvas
            points={mapPoints}
            beds={mapBeds}
            selectedPointCode={code}
            onSelectPoint={(next) =>
              next !== code && router.push(`/sunbeds/${next.toLowerCase()}?date=${date}`)
            }
            onToggleBed={toggleBed}
          />
        </div>
        <ul
          aria-label="Map key"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line bg-surface/90 px-5 py-3 text-xs backdrop-blur-md"
        >
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-emerald-500 shadow-sm" />{' '}
            <span className="font-medium text-fg">Free</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-primary shadow-sm" />{' '}
            <span className="font-medium text-fg">Selected</span>
          </li>
          <li className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full border border-primary bg-primary/30"
            />{' '}
            <span className="font-medium text-fg">Yours</span>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-rose-500/80" />{' '}
            <span className="font-medium text-fg">Booked</span>
          </li>
          {freeCount !== null ? (
            <li className="ml-auto font-medium text-muted">
              <span className="tabular font-bold text-primary">{freeCount}</span> beds available for this time
            </li>
          ) : null}
        </ul>
      </div>

      <details className="group mt-4 rounded-2xl border border-line bg-surface shadow-sm" open>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-5 text-sm font-semibold text-fg">
          <List aria-hidden className="size-5 text-muted" />
          Sunbed Grid List
          <span className="text-xs font-normal text-muted">· choose beds directly without map</span>
        </summary>
        <div className="border-t border-line p-5">
          {isLoading && !detail ? (
            <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6" aria-busy>
              {Array.from({ length: 12 }, (_, index) => (
                <Skeleton key={index} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              message={
                error instanceof ApiError ? error.message : 'Availability could not be loaded.'
              }
              onRetry={() => void mutate()}
            />
          ) : detail ? (
            <fieldset>
              <legend className="sr-only">Sunbeds</legend>
              <div className="grid grid-cols-3 gap-2.5 md:grid-cols-6 lg:grid-cols-8">
                {detail.sunbeds.map((bed) => {
                  const selected = selectedIds.includes(bed.id);
                  const state: BedWindowState | 'selected' = selected
                    ? 'selected'
                    : windowReady
                      ? bedWindowState(bed, windowStarts)
                      : bed.status === 'AVAILABLE'
                        ? 'free'
                        : 'off';
                  const disabled = !selected && !isBedSelectable(bed, windowStarts, windowReady);
                  return (
                    <label
                      key={bed.id}
                      className={cn(
                        'relative flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border text-center transition-all duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                        state === 'selected' && 'border-primary bg-action-bg text-action-fg shadow-md scale-105',
                        state === 'free' && 'border-emerald-500/30 bg-surface hover:bg-emerald-500/5 hover:border-emerald-500',
                        state === 'mine' && 'border-dashed border-primary bg-primary/10',
                        (state === 'booked' || state === 'off') &&
                          'border-line/60 bg-surface-alt/60 text-muted opacity-60',
                        disabled && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selected}
                        disabled={disabled}
                        onChange={() => toggleBed(bed.id)}
                      />
                      <span className="tabular text-sm font-bold">{bed.code}</span>
                      <span className="text-[10px] uppercase tracking-wider">{STATE_LABEL[state]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </div>
      </details>

      {/* 2026 Floating Checkout Dock */}
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/90 pb-[max(14px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-xl shadow-2xl">
        <div className="page flex items-center gap-4">
          <div className="min-w-0 flex-1" aria-live="polite">
            {selectedBeds.length > 0 && startIso ? (
              <>
                <p className="tabular text-base font-extrabold text-fg">
                  {selectedBeds.length} {selectedBeds.length === 1 ? 'bed' : 'beds'} · {hours} {hours === 1 ? 'hr' : 'hrs'} ·{' '}
                  <span className="text-primary">{formatMoney(totalMinor)}</span>
                </p>
                <p className="truncate text-xs text-muted">
                  {formatDateKey(date)}, {formatIsoTime(startIso)} ·{' '}
                  {selectedBeds.map((bed) => bed.code).join(', ')}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted">Select open sunbeds on the map or grid above to reserve.</p>
            )}
          </div>
          <Button
            size="lg"
            className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105"
            disabled={!canBook || selectedBeds.length === 0 || !windowReady}
            onClick={continueToCheckout}
          >
            Confirm & Reserve →
          </Button>
        </div>
      </div>
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
