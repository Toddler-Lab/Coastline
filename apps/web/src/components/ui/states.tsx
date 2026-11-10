import { cn } from '@/lib/cn';
import { buttonClass } from './button';

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 rounded-xl border border-dashed border-line-strong/70 p-6',
        className,
      )}
    >
      <p className="font-display text-[16px] text-foam">{title}</p>
      <p className="max-w-prose text-[13px] leading-relaxed text-mist">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title = 'Could not load this',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 p-6',
        className,
      )}
      role="alert"
    >
      <p className="font-display text-[16px] text-foam">{title}</p>
      <p className="max-w-prose text-[13px] leading-relaxed text-mist">{message}</p>
      {onRetry ? (
        <button type="button" className={buttonClass('secondary', 'sm')} onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-lg', className)} aria-hidden />;
}

export function InlineSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-mist" role="status">
      <span
        aria-hidden
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-sea border-t-transparent"
      />
      {label}
    </span>
  );
}
