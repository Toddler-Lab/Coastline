import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { TripItem } from '@/lib/trips';
import { SERVICES } from '@/lib/services';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';

export function TripCard({ trip }: { trip: TripItem }) {
  const Icon = SERVICES[trip.service].icon;
  return (
    <Link
      href={`/trips/${encodeURIComponent(trip.ref)}`}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg',
        trip.live ? 'border-primary/50 shadow-primary/5' : 'border-line',
      )}
    >
      <span className="grid size-12 flex-none place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
        <Icon aria-hidden className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-fg transition-colors group-hover:text-primary">
            {trip.title}
          </span>
          {trip.live ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          ) : null}
        </span>
        <span className="block truncate text-xs text-muted">{trip.subtitle}</span>
        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="tabular font-medium text-fg">{trip.timeLabel}</span>
          <StatusBadge tone={trip.status.tone} label={trip.status.label} />
        </span>
      </span>
      <span className="hidden flex-none text-right md:block">
        <span className="tabular block text-sm font-bold text-fg">
          {trip.amountMinor > 0 ? formatMoney(trip.amountMinor, trip.currency) : '—'}
        </span>
        <span className="block font-mono text-xs text-muted">{trip.ref}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 flex-none text-muted transition-colors group-hover:text-primary" />
    </Link>
  );
}
