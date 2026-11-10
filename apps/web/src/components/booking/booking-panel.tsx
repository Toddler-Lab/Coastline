'use client';

import { Clock, Info, MapPin, TriangleAlert } from 'lucide-react';
import type {
  BeachPointDetail,
  BeachPointSummary,
  SunbedAvailability,
} from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { formatDateKey, formatMoney, hourLabel } from '@/lib/format';
import { shortPointName, type DateParts } from '@/lib/booking';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { ErrorState, Skeleton } from '@/components/ui/states';
import { BedPicker } from './bed-picker';
import { BookingSummary } from './booking-summary';
import { DateStrip } from './date-strip';
import { TimePicker } from './time-picker';

export interface BookingPanelProps {
  variant: 'rail' | 'sheet';
  point: BeachPointSummary | null;
  pointNumber: number | null;
  date: string;
  dateDays: DateParts[];
  onDateChange: (key: string) => void;
  detail: BeachPointDetail | null;
  isLoading: boolean;
  detailErrorText: string | null;
  onRetry: () => void;
  selectedIds: string[];
  selectedBeds: SunbedAvailability[];
  onToggleBed: (id: string) => void;
  onClear: () => void;
  startIso: string | null;
  onStartChange: (iso: string) => void;
  hours: number;
  onHoursChange: (hours: number) => void;
  windowStarts: string[];
  windowReady: boolean;
  windowText: string;
  nowMs: number;
  subtotalMinor: number;
  canPay: boolean;
  disabledReason: string | null;
  submitting: boolean;
  isAdmin: boolean;
  onPay: () => void;
  errorMessage: string | null;
  notice: string | null;
}

export function BookingPanel({
  variant,
  point,
  pointNumber,
  date,
  dateDays,
  onDateChange,
  detail,
  isLoading,
  detailErrorText,
  onRetry,
  selectedIds,
  selectedBeds,
  onToggleBed,
  onClear,
  startIso,
  onStartChange,
  hours,
  onHoursChange,
  windowStarts,
  windowReady,
  windowText,
  nowMs,
  subtotalMinor,
  canPay,
  disabledReason,
  submitting,
  isAdmin,
  onPay,
  errorMessage,
  notice,
}: BookingPanelProps) {
  const rail = variant === 'rail';

  return (
    <Panel
      className={cn(
        'flex min-h-0 flex-col overflow-hidden',
        rail ? 'h-full' : 'max-h-[calc(100dvh-var(--header-height)-24px)]',
      )}
      aria-busy={isLoading || undefined}
    >
      <div className="border-b border-line px-5 pb-4 pt-5">
        {point ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="label">
                Point {pointNumber !== null ? String(pointNumber).padStart(2, '0') : '—'} ·{' '}
                {point.code}
              </p>
              <Badge tone={point.freeBeds > 0 ? 'success' : 'neutral'}>
                {point.freeBeds}/{point.totalBeds} free
              </Badge>
            </div>
            <h2 className="mt-1.5 text-[24px]">{shortPointName(point.name)}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist">
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden className="h-3 w-3 text-sea" />
                {hourLabel(point.openHour)}–{hourLabel(point.closeHour)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="h-3 w-3 text-sea" />
                <span className="font-mono">{point.code}</span>
              </span>
              <span className="font-mono text-[10.5px] text-sand">
                {formatMoney(point.defaultHourlyPriceMinor)} / bed-hour
              </span>
            </div>
            {point.description ? (
              <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-mist">
                {point.description}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="label">Booking · 02</p>
            <h2 className="mt-1.5 text-[24px]">Choose a stretch</h2>
            <p className="mt-2 max-w-[34ch] text-[12px] leading-relaxed text-mist">
              Pick a numbered pin on the map, or a beach point in the list, to open its beds and
              hourly availability.
            </p>
          </>
        )}

        <div className="mt-4">
          <DateStrip days={dateDays} selected={date} onSelect={onDateChange} />
        </div>
      </div>

      <div className={cn('flex-1 overflow-y-auto px-5 py-4', rail ? 'min-h-0' : 'min-h-[360px]')}>
        {!point ? (
          <div className="space-y-4">
            <ol className="space-y-3">
              {[
                ['01', 'Pick a beach point', 'Six stretches from Sugandha down to Teknaf.'],
                ['02', 'Choose beds and hours', 'Up to six beds, one shared start and duration.'],
                ['03', 'Show the demo ticket', 'Pay by mock provider, then open the QR ticket.'],
              ].map(([step, title, body]) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-[10px] text-sea">{step}</span>
                  <span>
                    <span className="block text-[12.5px] font-semibold text-foam">{title}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-mist">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="rounded-xl border border-line bg-abyss/35 p-3">
              <p className="label mb-1">Demo rules</p>
              <p className="text-[11px] leading-relaxed text-mist">
                Payments are simulated. Times shown in Asia/Dhaka (UTC+6), bookings up to 7 days
                ahead, cancellation free until 60 minutes before the first hour.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <BookingPanelSkeleton />
        ) : detailErrorText ? (
          <ErrorState
            title="Availability unavailable"
            message={detailErrorText}
            onRetry={onRetry}
          />
        ) : detail ? (
          <div className="space-y-5">
            {notice ? (
              <div className="flex gap-2 rounded-xl border border-sea/25 bg-sea/5 px-3 py-2.5">
                <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sea" />
                <p className="text-[11px] leading-relaxed text-mist">{notice}</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div
                role="alert"
                className="flex gap-2 rounded-xl border border-danger/35 bg-danger/5 px-3 py-2.5"
              >
                <TriangleAlert aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-danger" />
                <p className="text-[11px] leading-relaxed text-mist">{errorMessage}</p>
              </div>
            ) : null}

            <BedPicker
              detail={detail}
              selectedIds={selectedIds}
              windowStarts={windowStarts}
              windowReady={windowReady}
              windowText={windowText}
              onToggle={onToggleBed}
              onClear={onClear}
            />

            <div className="h-px bg-line" />

            <TimePicker
              detail={detail}
              startIso={startIso}
              hours={hours}
              onStartChange={onStartChange}
              onHoursChange={onHoursChange}
              selectedBeds={selectedBeds}
              nowMs={nowMs}
            />

            <p className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist/60">
              {formatDateKey(date)} · availability refreshes on submit
            </p>
          </div>
        ) : null}
      </div>

      {point && isLoading ? (
        <div className="border-t border-line bg-deep/70 px-5 py-4" aria-hidden>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="mt-3 h-11 w-full rounded-full" />
        </div>
      ) : point && detail && !detailErrorText ? (
        <div className="border-t border-line bg-deep/70 px-5 py-4">
          <BookingSummary
            selectedBeds={selectedBeds}
            hours={hours}
            subtotalMinor={subtotalMinor}
            canPay={canPay}
            submitting={submitting}
            disabledReason={disabledReason}
            isAdmin={isAdmin}
            onPay={onPay}
          />
        </div>
      ) : null}
    </Panel>
  );
}

/** Fixed-height placeholder keeps the panel from jumping when data lands. */
function BookingPanelSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }, (_, index) => (
            <Skeleton key={index} className="h-11" />
          ))}
        </div>
      </div>
      <div className="h-px bg-line" />
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-11" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-11 w-[184px]" />
        </div>
      </div>
      <Skeleton className="h-16" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}
