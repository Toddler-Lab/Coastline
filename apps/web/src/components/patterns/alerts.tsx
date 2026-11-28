import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import type { SpotAlertDto } from '@coastline/api-contracts';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

const STYLE = {
  INFO: { box: 'border-info/30 bg-info/6', icon: Info, iconClass: 'text-info', label: 'Notice' },
  CAUTION: { box: 'border-warn/40 bg-warn/8', icon: CircleAlert, iconClass: 'text-warn', label: 'Caution' },
  DANGER: { box: 'border-danger/40 bg-danger/8', icon: TriangleAlert, iconClass: 'text-danger', label: 'Warning' },
} as const;

/** One alert: label + icon + text, never colour alone. */
export function AlertBanner({ alert, className }: { alert: SpotAlertDto; className?: string }) {
  const style = STYLE[alert.severity];
  const Icon = style.icon;
  return (
    <div
      role={alert.severity === 'DANGER' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-[inset_0_1px_0_var(--glass-rim)]', style.box, className)}
    >
      <Icon aria-hidden className={cn('mt-0.5 size-5 flex-none', style.iconClass)} />
      <div className="min-w-0 text-body-sm">
        <p className="text-label">
          <span className="sr-only">{style.label}: </span>
          {alert.title}
        </p>
        {alert.body ? <p className="text-muted">{alert.body}</p> : null}
        {alert.endsAt ? <p className="text-caption text-muted">Until {formatDateTime(alert.endsAt)}</p> : null}
      </div>
    </div>
  );
}

export function AlertList({ alerts, className }: { alerts: SpotAlertDto[]; className?: string }) {
  if (alerts.length === 0) return null;
  return (
    <div className={cn('space-y-2', className)}>
      {alerts.map((alert) => (
        <AlertBanner key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
