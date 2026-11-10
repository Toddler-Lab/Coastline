'use client';

import { cn } from '@/lib/cn';
import { formatLongDateKey } from '@/lib/format';
import type { DateParts } from '@/lib/booking';

/** Eight Dhaka days, laid out as one compact row so every date stays visible. */
export function DateStrip({
  days,
  selected,
  onSelect,
  label = 'Choose a date',
}: {
  days: DateParts[];
  selected: string;
  onSelect: (key: string) => void;
  label?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="label">{label}</p>
        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist/70">
          Dhaka · UTC+6
        </p>
      </div>
      <div role="group" aria-label={label} className="grid grid-cols-8 gap-1">
        {days.map((day) => {
          const active = day.key === selected;
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={active}
              aria-label={formatLongDateKey(day.key)}
              onClick={() => onSelect(day.key)}
              className={cn(
                'flex h-14 min-w-0 flex-col items-center justify-center rounded-lg border transition-colors',
                active
                  ? 'border-sea bg-sea text-abyss'
                  : 'border-line bg-abyss/45 text-mist hover:border-sea/45 hover:text-foam',
              )}
            >
              <span
                className={cn(
                  'font-mono text-[8px] uppercase tracking-[0.06em]',
                  active ? 'text-abyss/75' : 'text-mist/75',
                )}
              >
                {day.weekday}
              </span>
              <span className="font-display text-[16px] font-semibold leading-tight">
                {day.day}
              </span>
              <span
                className={cn(
                  'font-mono text-[7.5px] uppercase tracking-[0.08em]',
                  active ? 'text-abyss/70' : 'text-mist/60',
                )}
              >
                {day.month}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
