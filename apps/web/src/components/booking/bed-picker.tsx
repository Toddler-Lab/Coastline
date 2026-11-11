'use client';

import { useId } from 'react';
import type { BeachPointDetail } from '@coastline/api-contracts';
import { MAX_BEDS_PER_ORDER } from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { bedWindowState, conflictsInWindow, isBedSelectable } from '@/lib/booking';

const STATE_TEXT: Record<string, string> = {
  free: 'Free',
  booked: 'Booked',
  mine: 'Yours',
  off: 'Out of service',
};

const STATE_CLASS: Record<string, string> = {
  free: 'border-line-strong bg-abyss/45 text-foam hover:border-sea/55 hover:bg-sea/5',
  selected: 'border-sea bg-sea/15 text-sea ring-1 ring-sea/45',
  booked: 'border-danger/20 bg-[#2a1210]/55 text-mist/75',
  mine: 'border-warn/30 bg-warn/10 text-warn',
  off: 'border-dashed border-line bg-raised/15 text-mist/55',
};

/**
 * A keyboard/pointer-friendly alternative to the map pills. Every non-retired
 * bed is present; unavailable beds stay visible but disabled with a reason in
 * the accessible label.
 */
export function BedPicker({
  detail,
  selectedIds,
  windowStarts,
  windowReady,
  windowText,
  onToggle,
  onClear,
}: {
  detail: BeachPointDetail;
  selectedIds: string[];
  windowStarts: string[];
  windowReady: boolean;
  windowText: string;
  onToggle: (id: string) => void;
  onClear: () => void;
}) {
  const beds = detail.sunbeds;
  const headingId = useId();
  const freeCount = windowReady
    ? beds.filter((bed) => bedWindowState(bed, windowStarts) === 'free').length
    : 0;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h3 id={headingId} className="label text-foam/80">
            Beds
          </h3>
          <p className="mt-1 text-[11px] text-mist">
            {windowReady
              ? `${freeCount} of ${beds.length} free for this window`
              : 'Choose a start time to see bed availability.'}
          </p>
        </div>
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-mist">
          {selectedIds.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="flex h-11 items-center rounded-md px-2 text-mist underline decoration-line-strong underline-offset-4 transition-colors hover:text-foam"
            >
              Clear
            </button>
          ) : null}
          {selectedIds.length}/{MAX_BEDS_PER_ORDER}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {beds.map((bed) => {
          const selected = selectedIds.includes(bed.id);
          const state = windowReady ? bedWindowState(bed, windowStarts) : 'unknown';
          const selectable = windowReady && isBedSelectable(bed, windowStarts, windowReady);
          const tone = selected ? 'selected' : state === 'unknown' ? 'off' : state;
          const conflicts = windowReady ? conflictsInWindow(bed, windowStarts) : [];
          const stateText = windowReady
            ? state === 'free' && selected
              ? 'Selected'
              : (STATE_TEXT[state] ?? 'Unavailable')
            : 'Pick a time';
          const reason = conflicts.length > 0 ? ` Already booked at ${conflicts.join(', ')}.` : '';

          return (
            <button
              key={bed.id}
              type="button"
              aria-pressed={selected}
              aria-label={`${bed.code}, ${stateText}${windowReady ? ` for ${windowText}` : ''}.${reason}`}
              disabled={!selected && !selectable}
              onClick={() => onToggle(bed.id)}
              className={cn(
                'flex h-10 sm:h-11 min-w-0 flex-col items-start justify-center rounded-lg border px-1.5 sm:px-2 text-left transition-colors disabled:cursor-not-allowed',
                STATE_CLASS[tone],
                selected && 'disabled:opacity-100',
              )}
            >
              <span className="w-full truncate font-mono text-[10px] sm:text-[10.5px] leading-tight">
                {bed.code}
              </span>
              <span
                className={cn(
                  'w-full truncate font-mono text-[7px] sm:text-[7.5px] uppercase tracking-[0.08em] sm:tracking-[0.1em]',
                  selected
                    ? 'text-sea/80'
                    : state === 'free'
                      ? 'text-mist/70'
                      : state === 'booked'
                        ? 'text-danger/70'
                        : state === 'mine'
                          ? 'text-warn/75'
                          : 'text-mist/50',
                )}
              >
                {stateText}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2.5 sm:mt-3 text-[10px] sm:text-[10.5px] leading-relaxed text-mist/75">
        Beds labelled out of service cannot be booked. Yours are already held by this persona for
        the selected hours.
      </p>
    </section>
  );
}
