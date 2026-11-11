import { Check, CircleDot, X } from 'lucide-react';
import type { FoodOrderDto } from '@coastline/api-contracts';
import { foodOrderTimeline, formatDhakaStamp } from '@/lib/dining/delivery';
import { cn } from '@/lib/cn';

/** Placed → Preparing → Ready → Delivered (or Cancelled), with Asia/Dhaka times. */
export function FoodOrderTimeline({ order }: { order: FoodOrderDto }) {
  const steps = foodOrderTimeline(order);

  return (
    <ol className="space-y-0" aria-label="Order progress">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px',
                  step.state === 'done' ? 'bg-sea/60' : 'bg-line',
                )}
              />
            ) : null}
            <span
              aria-hidden
              className={cn(
                'relative z-10 flex h-7 w-7 flex-none items-center justify-center rounded-full border',
                step.state === 'done' && 'border-sea/50 bg-sea/15 text-sea',
                step.state === 'current' && 'border-sand/60 bg-sand/15 text-sand',
                step.state === 'pending' && 'border-line-strong text-mist/50',
                step.state === 'cancelled' && 'border-danger/50 bg-danger/15 text-danger',
              )}
            >
              {step.state === 'done' ? (
                <Check className="h-3.5 w-3.5" />
              ) : step.state === 'cancelled' ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <CircleDot className="h-3.5 w-3.5" />
              )}
            </span>
            <div className="pt-0.5">
              <p
                className={cn(
                  'text-[13px]',
                  step.state === 'pending' ? 'text-mist' : 'text-foam',
                  step.state === 'current' && 'font-semibold',
                )}
              >
                {step.label}
                {step.state === 'current' ? <span className="sr-only"> (current step)</span> : null}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-mist">
                {step.at ? formatDhakaStamp(step.at) : step.state === 'pending' ? 'Waiting' : '—'}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
