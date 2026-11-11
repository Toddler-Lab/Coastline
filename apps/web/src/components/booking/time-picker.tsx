'use client';

import { useId } from 'react';
import type { BeachPointDetail, SunbedAvailability } from '@coastline/api-contracts';
import { MAX_HOURS_PER_ITEM } from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { hourLabel } from '@/lib/format';
import {
  conflictsInWindow,
  durationLabel,
  windowIsComplete,
  windowLabel,
  windowSlotStarts,
} from '@/lib/booking';

/**
 * One start + duration for the whole order. Start options and durations are
 * disabled when they run past closing or clash on any selected bed, so the
 * button can never submit an invalid window.
 */
export function TimePicker({
  detail,
  startIso,
  hours,
  onStartChange,
  onHoursChange,
  selectedBeds,
  nowMs,
}: {
  detail: BeachPointDetail;
  startIso: string | null;
  hours: number;
  onStartChange: (iso: string) => void;
  onHoursChange: (hours: number) => void;
  selectedBeds: SunbedAvailability[];
  nowMs: number;
}) {
  const selectId = useId();
  const headingId = useId();
  const closing = hourLabel(detail.closeHour);
  const selectedWindow = startIso ? windowSlotStarts(detail.slots, startIso, hours) : [];
  const windowReady = startIso ? windowIsComplete(detail.slots, startIso, hours) : false;
  const selectedConflicts = selectedBeds.flatMap((bed) => conflictsInWindow(bed, selectedWindow));

  const startOptions = detail.slots.map((slot) => {
    const startsAt = Date.parse(slot.startsAt);
    const isPast = nowMs > 0 && startsAt <= nowMs;
    const fits = windowIsComplete(detail.slots, slot.startsAt, hours);
    const slotWindow = windowSlotStarts(detail.slots, slot.startsAt, hours);
    const clashes = selectedBeds.some((bed) => conflictsInWindow(bed, slotWindow).length > 0);
    const disabled = isPast || !fits || clashes;
    const suffix = isPast ? 'past' : !fits ? 'past closing' : clashes ? 'clashes' : null;
    return { slot, disabled, suffix };
  });

  const anyStart = startOptions.some((option) => !option.disabled);

  return (
    <section aria-labelledby={headingId} className="space-y-3 sm:space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h3 id={headingId} className="label text-foam/80">
          Time window
        </h3>
        <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist/70">
          {detail.openHour !== undefined ? `${hourLabel(detail.openHour)}–${closing}` : null}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-2.5 sm:gap-3">
        <div className="min-w-0">
          <label htmlFor={selectId} className="label mb-1.5 block">
            Start
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={startIso ?? ''}
              onChange={(event) => onStartChange(event.target.value)}
              className="h-10 sm:h-11 w-full appearance-none rounded-lg border border-line-strong bg-abyss/70 pl-2.5 sm:pl-3 pr-7 sm:pr-8 font-mono text-[11.5px] sm:text-[12px] text-foam transition-colors focus:border-sea/60 focus:outline-none focus-visible:outline-2 focus-visible:outline-sea/70 disabled:opacity-50"
            >
              {startIso ? null : <option value="">No start time</option>}
              {startOptions.map(({ slot, disabled, suffix }) => (
                <option key={slot.startsAt} value={slot.startsAt} disabled={disabled}>
                  {slot.label}
                  {suffix ? ` · ${suffix}` : ''}
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className="pointer-events-none absolute right-2.5 sm:right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-mist"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="flex-none">
          <p className="label mb-1.5">Hours</p>
          <div role="group" aria-label="Booking duration in hours" className="flex gap-1">
            {Array.from({ length: MAX_HOURS_PER_ITEM }, (_, index) => index + 1).map((value) => {
              const fits = startIso ? windowIsComplete(detail.slots, startIso, value) : false;
              const slotWindow = startIso ? windowSlotStarts(detail.slots, startIso, value) : [];
              const clashes = selectedBeds.some(
                (bed) => conflictsInWindow(bed, slotWindow).length > 0,
              );
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={hours === value}
                  aria-label={`${durationLabel(value)}${clashes ? ', clashes with a selected bed' : ''}`}
                  disabled={!fits || clashes}
                  onClick={() => onHoursChange(value)}
                  className={cn(
                    'h-10 w-8 sm:h-11 sm:w-10 rounded-lg border font-mono text-[10.5px] sm:text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    hours === value
                      ? 'border-sea bg-sea text-abyss font-semibold'
                      : 'border-line bg-abyss/45 text-mist hover:border-sea/45 hover:text-foam',
                  )}
                >
                  {value}h
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!anyStart ? (
        <p className="rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-[11px] leading-relaxed text-warn">
          No bookable hours remain on this date. Choose another day in the strip above.
        </p>
      ) : null}

      {startIso && windowReady ? (
        <div className="rounded-lg border border-line bg-abyss/40 px-3 py-2.5">
          <p className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[11px] text-foam">{windowLabel(startIso, hours)}</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist">
              {durationLabel(hours)}
            </span>
          </p>
          {selectedConflicts.length > 0 ? (
            <p className="mt-1.5 text-[10.5px] text-danger">
              This window clashes with a selected bed at {selectedConflicts.join(', ')}.
            </p>
          ) : null}
        </div>
      ) : startIso ? (
        <p className="text-[10.5px] text-danger">That window runs past closing time ({closing}).</p>
      ) : null}

      <div>
        <p className="label mb-1.5">Availability for selected beds</p>
        {selectedBeds.length === 0 ? (
          <p className="text-[11px] text-mist/75">Select a bed to check it against the window.</p>
        ) : (
          <ul className="space-y-1">
            {selectedBeds.map((bed) => {
              const conflicts = windowReady ? conflictsInWindow(bed, selectedWindow) : [];
              return (
                <li
                  key={bed.id}
                  className="flex min-h-7 items-center justify-between gap-3 border-b border-line/60 pb-1 last:border-0"
                >
                  <span className="font-mono text-[10.5px] text-foam">{bed.code}</span>
                  <span
                    className={cn(
                      'font-mono text-[9px] uppercase tracking-[0.08em]',
                      conflicts.length > 0 ? 'text-danger' : 'text-success',
                    )}
                  >
                    {conflicts.length > 0
                      ? `Booked at ${conflicts.join(', ')}`
                      : startIso && windowReady
                        ? `Free ${windowLabel(startIso, hours)}`
                        : 'Awaiting time'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
