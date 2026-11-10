import { cn } from '@/lib/cn';

const ITEMS = [
  { key: 'free', label: 'Free', dot: 'state-dot--free' },
  { key: 'booked', label: 'Booked', dot: 'state-dot--booked' },
  { key: 'mine', label: 'Yours', dot: 'state-dot--mine' },
  { key: 'selected', label: 'Selected', dot: 'state-dot--selected' },
  { key: 'off', label: 'Out of service', dot: 'state-dot--off' },
] as const;

/**
 * State is never carried by colour alone: every dot has a text label. The
 * window caption keeps the meaning of "free" honest when a bed is only free
 * for part of the day.
 */
export function BedLegend({
  windowLabel,
  className,
  compact = false,
}: {
  windowLabel?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-abyss/72 px-3 py-2 backdrop-blur-md',
        compact ? 'space-y-1' : 'space-y-2',
        className,
      )}
    >
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {ITEMS.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('state-dot', item.dot)} />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-mist">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      {windowLabel ? (
        <p className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-mist/70">
          Bed states for {windowLabel} · Dhaka time
        </p>
      ) : null}
    </div>
  );
}
