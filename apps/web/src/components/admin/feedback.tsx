import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const TONES = {
  success: 'border-success/35 bg-success/5 text-foam',
  danger: 'border-danger/40 bg-danger/10 text-foam',
  info: 'border-sea/30 bg-sea/5 text-foam',
} as const;

const ICON_COLORS = {
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-sea',
} as const;

/**
 * Inline result for a mutation. Success uses a polite live region; failures
 * use `role="alert"` so the API's actionable detail is announced, never hidden
 * behind a toast.
 */
export function AdminNotice({
  tone,
  title,
  children,
  className,
}: {
  tone: 'success' | 'danger' | 'info';
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      aria-live="polite"
      className={cn('rounded-xl border p-3 text-[12.5px] leading-relaxed', TONES[tone], className)}
    >
      <span aria-hidden className={cn('mr-1.5 font-mono text-[10px]', ICON_COLORS[tone])}>
        {tone === 'success' ? 'OK' : tone === 'danger' ? '!' : 'i'}
      </span>
      {title ? <span className="font-semibold text-foam">{title} </span> : null}
      <span className="text-mist">{children}</span>
    </div>
  );
}

export function DetailList({
  items,
  label = 'API details',
  className,
}: {
  items: string[];
  label?: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn('mt-2', className)}>
      <p className="label">{label}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] text-mist">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
