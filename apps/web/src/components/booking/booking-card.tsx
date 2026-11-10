import Link from 'next/link';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import type { OrderDto } from '@coastline/api-contracts';
import { formatDateKey, formatMoney } from '@/lib/format';
import {
  isoDateKey,
  orderBedCodes,
  orderPhase,
  orderPointNames,
  orderWindow,
  phasePresentation,
  shortPointName,
} from '@/lib/booking';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';

export function BookingCard({ order }: { order: OrderDto }) {
  const phase = orderPhase(order);
  const presentation = phasePresentation(phase);
  const window = orderWindow(order);
  const points = orderPointNames(order).map(shortPointName);
  const beds = orderBedCodes(order);

  return (
    <article className="panel corner-ticks flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Booking reference</p>
          <p className="mt-1 font-mono text-[13px] tracking-[0.02em] text-foam">
            {order.publicRef}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={presentation.tone}>{presentation.label}</Badge>
          <Badge tone={order.status === 'CONFIRMED' ? 'sea' : 'danger'}>
            {order.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="text-[19px]">{points.join(' · ') || 'Beach booking'}</h3>
        {window ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist">
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="h-3 w-3 text-sea" />
              <span className="font-mono text-[11px] text-foam">
                {window.sameDhakaDay
                  ? `${formatDateKey(window.dateKey)} · ${window.timeLabel}`
                  : `${formatDateKey(window.dateKey)}–${formatDateKey(isoDateKey(window.endAt))} · ${window.timeLabel}`}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden className="h-3 w-3 text-sea" />
              {points.join(' · ')}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="flex flex-wrap gap-1.5" aria-label="Beds">
        {beds.map((code) => (
          <li
            key={code}
            className="rounded-md border border-line bg-abyss/50 px-2 py-1 font-mono text-[10px] text-mist"
          >
            {code}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="label">Total · demo</p>
          <p className="mt-0.5 font-display text-[20px] text-foam">
            {formatMoney(order.totalMinor)}
          </p>
        </div>
        <Link
          href={`/bookings/${encodeURIComponent(order.publicRef)}`}
          className={buttonClass('primary', 'md')}
        >
          Open ticket
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
