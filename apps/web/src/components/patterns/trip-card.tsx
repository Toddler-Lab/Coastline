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
        'flex items-center gap-3 rounded-md border bg-surface p-4 transition-colors hover:bg-surface-alt',
        trip.live ? 'border-primary' : 'border-line',
      )}
    >
      <span className="grid size-12 flex-none place-items-center rounded-full bg-primary-soft text-primary">
        <Icon aria-hidden className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-title-sm">{trip.title}</span>
        </span>
        <span className="block text-body-sm text-muted">{trip.subtitle}</span>
        <span className="mt-1 flex flex-wrap items-center gap-2 text-body-sm">
          <span className="tabular">{trip.timeLabel}</span>
          <StatusBadge tone={trip.status.tone} label={trip.status.label} />
        </span>
      </span>
      <span className="hidden flex-none text-right md:block">
        <span className="tabular block text-body">
          {trip.amountMinor > 0 ? formatMoney(trip.amountMinor, trip.currency) : '—'}
        </span>
        <span className="block font-mono text-caption text-muted">{trip.ref}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 flex-none text-muted" />
    </Link>
  );
}
