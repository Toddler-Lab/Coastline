import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { FoodOrderDto } from '@coastline/api-contracts';
import { formatMoney } from '@/lib/format';
import { foodOrderHref, foodStatusPresentation, formatDhakaStamp } from '@/lib/dining/delivery';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';

export function FoodOrderCard({ order }: { order: FoodOrderDto }) {
  const status = foodStatusPresentation(order.status);
  const itemCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <article className="panel flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Food order</p>
          <p className="mt-1 font-mono text-[13px] tracking-[0.02em] text-foam">
            {order.publicRef}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div>
        <h3 className="text-[18px]">{order.venue.name}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist">
          <span className="inline-flex items-center gap-1.5">
            <MapPin aria-hidden className="h-3 w-3 text-sea" />
            Sunbed {order.delivery.sunbedCode} · {order.delivery.beachPointName}
          </span>
          <span className="font-mono text-[11px]">{formatDhakaStamp(order.placedAt)}</span>
        </p>
        <p className="mt-1.5 text-[12px] text-mist">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}:{' '}
          {order.lines.map((line) => `${line.quantity}× ${line.name}`).join(', ')}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
        <div>
          <p className="label">Total · demo</p>
          <p className="mt-0.5 font-display text-[20px] text-foam">
            {formatMoney(order.totalMinor)}
          </p>
        </div>
        <Link href={foodOrderHref(order.publicRef)} className={buttonClass('secondary', 'sm')}>
          Track order
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
