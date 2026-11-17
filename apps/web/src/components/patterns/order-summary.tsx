import { ScrollText } from 'lucide-react';
import type { DraftLine } from '@/lib/checkout';
import type { ServiceKey } from '@/lib/services';
import { SERVICES } from '@/lib/services';
import { formatMoney } from '@/lib/format';
import { Card } from '@/components/ui/display';

/** Price breakdown: lines, total and the cancellation rule, before paying. */
export function OrderSummary({
  service,
  title,
  subtitle,
  when,
  lines,
  totalMinor,
  currency = 'BDT',
  payNowLabel,
  cancellation,
  emptyHint,
}: {
  service: ServiceKey;
  title: string;
  subtitle?: string;
  when?: string;
  lines: DraftLine[];
  totalMinor: number;
  currency?: string;
  payNowLabel?: string;
  cancellation?: string;
  emptyHint?: string;
}) {
  const Icon = SERVICES[service].icon;
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 flex-none place-items-center rounded-full bg-primary-soft text-primary">
          <Icon aria-hidden className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-title-sm">{title}</p>
          {subtitle ? <p className="text-body-sm text-muted">{subtitle}</p> : null}
          {when ? <p className="text-body-sm">{when}</p> : null}
        </div>
      </div>
      {lines.length > 0 ? (
        <dl className="mt-4 divide-y divide-line border-t border-line">
          {lines.map((line, index) => (
            <div
              key={index}
              className="flex items-baseline justify-between gap-4 py-2.5 text-body-sm"
            >
              <dt>
                {line.label}
                {line.detail ? (
                  <span className="block text-caption text-muted">{line.detail}</span>
                ) : null}
              </dt>
              <dd className="tabular">{formatMoney(line.amountMinor, currency)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-title-sm">{payNowLabel ?? 'Total'}</dt>
            <dd className="tabular text-title">{formatMoney(totalMinor, currency)}</dd>
          </div>
        </dl>
      ) : emptyHint ? (
        <p className="mt-4 border-t border-line pt-3 text-body-sm text-muted">{emptyHint}</p>
      ) : null}
      {cancellation ? (
        <p className="mt-2 flex gap-2 text-caption text-muted">
          <ScrollText aria-hidden className="size-4 flex-none" />
          {cancellation}
        </p>
      ) : null}
    </Card>
  );
}
