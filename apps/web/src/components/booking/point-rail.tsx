import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { shortPointName } from '@/lib/booking';
import type { BeachPointSummary } from '@coastline/api-contracts';
import { Panel } from '@/components/ui/panel';

/** The numbered survey index. Pins on the map use the same 01–06 order. */
export function PointRail({
  points,
  selectedCode,
  onSelect,
  dateLabel,
  footer,
  className,
  listClassName,
  direction = 'right',
}: {
  points: BeachPointSummary[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  dateLabel: string;
  footer?: React.ReactNode;
  className?: string;
  listClassName?: string;
  direction?: 'right' | 'down';
}) {
  const isDown = direction === 'down';

  return (
    <Panel className={cn('flex min-h-0 flex-col overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-2.5 border-b border-line px-3.5 pb-3 pt-3.5 sm:px-4 sm:pb-3.5 sm:pt-4">
        <div>
          <p className="label">Survey · 01</p>
          <h2 className="mt-1 text-[16px] sm:text-[17px]">Beach points</h2>
        </div>
        <span className="mt-0.5 flex-none rounded-full border border-line bg-raised/40 px-2 py-0.5 font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.1em] text-mist">
          {dateLabel}
        </span>
      </div>

      <ul className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5', listClassName)}>
        {points.length === 0 ? (
          <li className="px-2 py-4 text-[12px] leading-relaxed text-mist">
            No beach points are published for this date.
          </li>
        ) : null}
        {points.map((point, index) => {
          const selected = selectedCode === point.code;
          return (
            <li key={point.code}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(point.code)}
                className={cn(
                  'group relative flex min-h-[56px] w-full items-center gap-2.5 sm:gap-3 rounded-xl border px-2.5 py-2 text-left transition-colors',
                  selected
                    ? 'border-sand/45 bg-sand/10'
                    : 'border-transparent hover:border-line hover:bg-raised/50',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid h-7 w-7 flex-none place-items-center rounded-full border font-mono text-[10px] font-semibold',
                    selected
                      ? 'border-sand bg-sand text-abyss'
                      : 'border-line-strong bg-abyss/60 text-sea',
                  )}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] sm:text-[13px] font-semibold text-foam">
                    {shortPointName(point.name)}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[8.5px] sm:text-[9px] uppercase tracking-[0.06em] text-mist">
                    <span className={point.freeBeds > 0 ? 'text-success' : 'text-mist'}>
                      {point.freeBeds} free
                    </span>{' '}
                    / {point.totalBeds} · {point.referenceSlotLabel}
                  </span>
                </span>

                <span className="flex-none text-right">
                  <span className="block font-mono text-[10px] sm:text-[10.5px] text-foam">
                    {formatMoney(point.defaultHourlyPriceMinor)}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block font-mono text-[8px] sm:text-[8.5px] uppercase tracking-[0.1em]',
                      selected ? 'text-sand font-semibold' : 'text-mist/70',
                    )}
                  >
                    {selected
                      ? isDown
                        ? 'Sunbeds open ↓'
                        : 'Sunbeds open →'
                      : isDown
                        ? 'Select beds ↓'
                        : 'Select beds →'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {footer ? (
        <div className="border-t border-line px-3 py-2 sm:px-3.5 sm:py-2.5">{footer}</div>
      ) : null}
    </Panel>
  );
}
