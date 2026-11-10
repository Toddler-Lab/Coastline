'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import type {
  BeachPointDetail,
  BeachPointSummary,
  CreateOrderRequest,
  OrderDto,
  SessionUser,
} from '@coastline/api-contracts';
import { MAX_BEDS_PER_ORDER } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatDateKey, formatLongDateKey } from '@/lib/format';
import {
  bedWindowState,
  bedsTotalMinor,
  dateStrip,
  describeConflictDetails,
  isBedSelectable,
  windowIsComplete,
  windowLabel,
  windowSlotStarts,
} from '@/lib/booking';
import { layoutBeds } from '@/lib/map-layout';
import MapCanvas from '@/components/map/map-canvas';
import type { MapBedData, MapPointData } from '@/components/map/coast-map';
import { useToast } from '@/components/ui/toast';
import { BedLegend } from './bed-legend';
import { BookingPanel, type BookingPanelProps } from './booking-panel';
import { PointRail } from './point-rail';

const OFFLINE_HINT = 'The booking API is offline. Start the API on port 3001, then try again.';

function fetchJson<T>(path: string): Promise<T> {
  return clientApi<T>(path);
}

export interface BeachMapExperienceProps {
  initialPoints: BeachPointSummary[];
  initialDate: string;
  /** Today in Dhaka, from the server, so hydration and the strip agree. */
  today: string;
  initialPointCode: string | null;
  viewer: SessionUser | null;
}

/**
 * The map-first booking surface. Selection, date and URL live here; the map,
 * rail and panel are presentational so the mobile sheet and desktop rails stay
 * in lockstep.
 */
export function BeachMapExperience({
  initialPoints,
  initialDate,
  today,
  initialPointCode,
  viewer,
}: BeachMapExperienceProps) {
  const router = useRouter();
  const toast = useToast();
  const isAdmin = viewer?.role === 'ADMIN';

  const [date, setDate] = useState(initialDate);
  const [selectedCode, setSelectedCode] = useState<string | null>(initialPointCode);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startIso, setStartIso] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const bookingPanelRef = useRef<HTMLDivElement | null>(null);

  const days = useMemo(() => dateStrip(today, 8), [today]);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Summary counts are date-sensitive: the API counts the reference slot.
  const { data: pointData } = useSWR<BeachPointSummary[]>(`/beach-points?date=${date}`, fetchJson, {
    fallbackData: date === initialDate ? initialPoints : undefined,
    keepPreviousData: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const points = pointData ?? initialPoints;

  const detailKey = selectedCode
    ? `/beach-points/${encodeURIComponent(selectedCode)}?date=${date}`
    : null;
  const {
    data: detailData,
    error: detailError,
    isLoading,
    mutate,
  } = useSWR<BeachPointDetail>(detailKey, fetchJson, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const detail =
    detailData && detailData.code === selectedCode && detailData.date === date ? detailData : null;

  const detailErrorText = detailError
    ? detailError instanceof ApiError
      ? detailError.message
      : OFFLINE_HINT
    : null;

  const selectedPoint = selectedCode
    ? (points.find((point) => point.code === selectedCode) ?? null)
    : null;

  const windowStarts = useMemo(
    () => (detail && startIso ? windowSlotStarts(detail.slots, startIso, hours) : []),
    [detail, startIso, hours],
  );
  const windowReady = useMemo(
    () => Boolean(detail && startIso && windowIsComplete(detail.slots, startIso, hours)),
    [detail, startIso, hours],
  );
  const windowText = startIso ? windowLabel(startIso, hours) : 'the selected window';

  const selectedBeds = useMemo(
    () => (detail ? detail.sunbeds.filter((bed) => selectedIds.includes(bed.id)) : []),
    [detail, selectedIds],
  );
  const subtotalMinor = bedsTotalMinor(selectedBeds, hours);
  const canPay =
    Boolean(viewer) &&
    !isAdmin &&
    Boolean(detail) &&
    windowReady &&
    selectedBeds.length > 0 &&
    subtotalMinor > 0 &&
    selectedBeds.every((bed) => bedWindowState(bed, windowStarts) === 'free');

  const disabledReason = !viewer
    ? 'Choose a demo persona in the header to place a booking.'
    : isAdmin
      ? null
      : selectedBeds.length === 0
        ? 'Select at least one bed to continue.'
        : !startIso
          ? 'Choose a start time for this date.'
          : !windowReady
            ? 'Choose a window that ends before the point closes.'
            : null;

  const selectedPointNumber = selectedPoint
    ? points.findIndex((point) => point.code === selectedPoint.code) + 1
    : null;

  // Pick a sensible first start once availability (and the real clock) arrives.
  useEffect(() => {
    if (!detail || detail.date !== date || nowMs === 0) {
      return;
    }
    setStartIso((current) => {
      const stillBookable =
        current &&
        detail.slots.some((slot) => slot.startsAt === current) &&
        Date.parse(current) > nowMs;
      if (stillBookable) {
        return current;
      }
      const future = detail.slots.filter((slot) => Date.parse(slot.startsAt) > nowMs);
      const withFreeBed = future.find((slot) =>
        detail.sunbeds.some(
          (bed) => bed.status === 'AVAILABLE' && !bed.bookedSlots.includes(slot.startsAt),
        ),
      );
      return (withFreeBed ?? future[0])?.startsAt ?? null;
    });
  }, [detail, date, nowMs]);

  // Availability can move under a selection (date change, refresh, 409). Remove
  // beds that are no longer free and say why rather than failing at payment.
  useEffect(() => {
    if (!detail || !startIso) {
      return;
    }
    const starts = windowSlotStarts(detail.slots, startIso, hours);
    if (starts.length !== hours) {
      return;
    }
    const byId = new Map(detail.sunbeds.map((bed) => [bed.id, bed] as const));
    const removed: string[] = [];
    const kept = selectedIds.filter((id) => {
      const bed = byId.get(id);
      if (bed && bedWindowState(bed, starts) === 'free') {
        return true;
      }
      if (bed) {
        removed.push(bed.code);
      }
      return false;
    });
    if (removed.length === 0) {
      return;
    }
    setSelectedIds(kept);
    setNotice(
      `${removed.join(', ')} ${removed.length === 1 ? 'is' : 'are'} no longer free for ${windowLabel(startIso, hours)} and ${removed.length === 1 ? 'was' : 'were'} removed from the selection. Availability was refreshed.`,
    );
  }, [detail, startIso, hours, selectedIds]);

  function syncUrl(code: string | null, nextDate: string) {
    const params = new URLSearchParams();
    if (code) {
      params.set('point', code);
    }
    params.set('date', nextDate);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }

  function selectPoint(code: string) {
    if (code === selectedCode) {
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    setSelectedCode(code);
    setSelectedIds([]);
    setStartIso(null);
    setNotice(null);
    setErrorMessage(null);
    syncUrl(code, date);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        bookingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 180);
    }
  }

  function changeDate(next: string) {
    if (next === date) {
      return;
    }
    const hadSelection = selectedIds.length > 0;
    setDate(next);
    setSelectedIds([]);
    setStartIso(null);
    setErrorMessage(null);
    setNotice(
      hadSelection ? `Date changed to ${formatLongDateKey(next)} — bed selection cleared.` : null,
    );
    syncUrl(selectedCode, next);
  }

  function toggleBed(id: string) {
    if (!detail) {
      return;
    }
    setErrorMessage(null);

    if (selectedIds.includes(id)) {
      setSelectedIds((current) => current.filter((bedId) => bedId !== id));
      return;
    }

    const bed = detail.sunbeds.find((item) => item.id === id);
    if (!bed || !isBedSelectable(bed, windowStarts, windowReady)) {
      return;
    }
    if (selectedIds.length >= MAX_BEDS_PER_ORDER) {
      toast.push(`Up to ${MAX_BEDS_PER_ORDER} beds in one order.`, 'info');
      return;
    }
    setSelectedIds((current) => [...current, id]);
  }

  function clearSelection() {
    setSelectedIds([]);
    setNotice(null);
    setErrorMessage(null);
  }

  function changeStart(iso: string) {
    setStartIso(iso || null);
    setErrorMessage(null);
  }

  function changeHours(next: number) {
    setHours(next);
    setErrorMessage(null);
  }

  async function pay() {
    if (!detail || !startIso || !canPay || submitting) {
      return;
    }

    const request: CreateOrderRequest = {
      items: selectedBeds.map((bed) => ({
        sunbedId: bed.id,
        startsAt: startIso,
        hours,
      })),
      paymentMethod: 'MOCK',
    };

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const order = await clientApi<OrderDto>('/orders', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      toast.push(`Booking ${order.publicRef} confirmed.`, 'success');
      router.push(`/bookings/${encodeURIComponent(order.publicRef)}?new=1`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          const conflict = describeConflictDetails(error.details);
          setErrorMessage(
            conflict
              ? `Another visitor took these hours first: ${conflict}. Availability has been refreshed — choose a different window or bed.`
              : `${error.message} Availability has been refreshed.`,
          );
          toast.push('Those hours were just taken. Availability refreshed.', 'danger');
          await mutate();
        } else if (error.status === 400 || error.status === 422) {
          setErrorMessage(error.message);
          await mutate();
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage(OFFLINE_HINT);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const mapPoints = useMemo<MapPointData[]>(
    () =>
      points.map((point) => ({
        code: point.code,
        name: point.name,
        latitude: point.latitude,
        longitude: point.longitude,
        freeBeds: point.freeBeds,
        totalBeds: point.totalBeds,
      })),
    [points],
  );

  const mapBeds = useMemo<MapBedData[]>(() => {
    if (!detail || !selectedCode) {
      return [];
    }
    return layoutBeds(detail).map((bed) => {
      const state = selectedIds.includes(bed.id)
        ? 'selected'
        : windowReady
          ? bedWindowState(bed.sunbed, windowStarts)
          : bed.sunbed.status === 'AVAILABLE'
            ? 'free'
            : 'off';
      return {
        id: bed.id,
        code: bed.code,
        latitude: bed.latitude,
        longitude: bed.longitude,
        state,
      };
    });
  }, [detail, selectedCode, selectedIds, windowReady, windowStarts]);

  const panelProps: Omit<BookingPanelProps, 'variant'> = {
    point: selectedPoint,
    pointNumber: selectedPointNumber,
    date,
    dateDays: days,
    onDateChange: changeDate,
    detail,
    isLoading,
    detailErrorText,
    onRetry: () => void mutate(),
    selectedIds,
    selectedBeds,
    onToggleBed: toggleBed,
    onClear: clearSelection,
    startIso,
    onStartChange: changeStart,
    hours,
    onHoursChange: changeHours,
    windowStarts,
    windowReady,
    windowText,
    nowMs,
    subtotalMinor,
    canPay,
    disabledReason,
    submitting,
    isAdmin,
    onPay: pay,
    errorMessage,
    notice,
  };

  const railProps = {
    points,
    selectedCode,
    onSelect: selectPoint,
    dateLabel: formatDateKey(date),
  };

  const legend = <BedLegend windowLabel={windowReady ? windowText : undefined} compact />;

  return (
    <main className="relative">
      <h1 className="sr-only">Book a sunbed on Cox&apos;s Bazar beach</h1>

      <div className="lg:relative lg:h-[calc(100dvh-var(--header-height)-var(--banner-height))] lg:overflow-hidden">
        <div className="sticky top-[var(--header-height)] z-20 h-[54dvh] min-h-[340px] w-full overflow-hidden border-b border-line lg:absolute lg:inset-0 lg:h-full lg:min-h-0 lg:border-0">
          <MapCanvas
            points={mapPoints}
            beds={mapBeds}
            selectedPointCode={selectedCode}
            onSelectPoint={selectPoint}
            onToggleBed={toggleBed}
          />

          <div className="pointer-events-none absolute left-3 top-3 z-10 lg:hidden">
            <div className="corner-ticks rounded-lg border border-line bg-abyss/78 px-2.5 py-1.5 backdrop-blur-md">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-mist">
                Coastline · survey 01
              </p>
              <p className="mt-0.5 font-mono text-[9.5px] text-foam">
                {formatDateKey(date)} · {points.length} points
              </p>
            </div>
          </div>

          <BedLegend
            windowLabel={windowReady ? windowText : undefined}
            compact
            className="absolute bottom-9 left-3 right-16 z-10 lg:hidden"
          />

          <div className="pointer-events-none absolute inset-0 z-30 hidden lg:block">
            <div className="pointer-events-auto absolute bottom-4 left-4 top-4 w-[304px]">
              <PointRail {...railProps} className="h-full" footer={legend} />
            </div>
            <div className="pointer-events-auto absolute bottom-28 right-4 top-4 w-[392px]">
              <BookingPanel variant="rail" {...panelProps} />
            </div>
          </div>
        </div>

        {/* Mobile: the map stays pinned while the sheet carries the point list. */}
        <section className="relative z-30 -mt-5 rounded-t-[26px] border-t border-line bg-abyss px-4 pb-6 pt-3 shadow-[0_-24px_60px_rgba(4,16,20,0.65)] lg:hidden">
          <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
          <PointRail
            {...railProps}
            className="mb-3"
            listClassName="max-h-[248px]"
            footer={
              <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist/70">
                Free counts use each point&apos;s next bookable hour · Asia/Dhaka
              </p>
            }
          />
          <div ref={bookingPanelRef} id="sunbeds-panel" className="scroll-mt-4">
            <BookingPanel variant="sheet" {...panelProps} />
          </div>
        </section>
      </div>
    </main>
  );
}
