import Link from 'next/link';
import { CloudOff, LoaderCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

export function Spinner({ label, className }: { label: string; className?: string }) {
  return (
    <p role="status" className={cn('flex items-center gap-2 text-body-sm text-muted', className)}>
      <LoaderCircle aria-hidden className="size-5 animate-spin text-primary" />
      {label}
    </p>
  );
}

type EmptyAction = { label: string; href: string };

function isLinkAction(value: unknown): value is EmptyAction {
  return typeof value === 'object' && value !== null && 'href' in value && 'label' in value;
}

/** One sentence on why it is empty and, when there is one, one action. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: React.ReactNode;
  action?: EmptyAction | React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-md border border-dashed border-line px-6 py-10 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-surface-alt text-muted">
          <Icon aria-hidden className="size-6" />
        </span>
      ) : null}
      <p className="text-title-sm">{title}</p>
      {body ? <p className="mt-1 max-w-md text-body-sm text-muted">{body}</p> : null}
      {action ? (
        <div className="mt-4">
          {isLinkAction(action) ? (
            <Link href={action.href} className={buttonClass('secondary')}>
              {action.label}
            </Link>
          ) : (
            (action as React.ReactNode)
          )}
        </div>
      ) : null}
    </div>
  );
}

/** What failed, a way to retry, and the reference of anything already paid. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  retryHref,
  onRetry,
  reference,
  className,
}: {
  title?: string;
  message: string;
  retryHref?: string;
  onRetry?: () => void;
  reference?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn('rounded-md border border-danger/30 bg-danger/6 px-5 py-6', className)}
    >
      <div className="flex gap-3">
        <CloudOff aria-hidden className="mt-0.5 size-6 flex-none text-danger" />
        <div className="min-w-0">
          <p className="text-title-sm">{title}</p>
          <p className="mt-1 text-body-sm text-muted">{message}</p>
          {reference ? (
            <p className="mt-2 text-body-sm">
              Your reference: <span className="font-mono">{reference}</span>
            </p>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={buttonClass('secondary', 'md', 'mt-4')}
            >
              Try again
            </button>
          ) : retryHref ? (
            <a href={retryHref} className={buttonClass('secondary', 'md', 'mt-4')}>
              Try again
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const NOTICE_TONES = {
  info: { box: 'border-info/30 bg-info/6', icon: 'text-info' },
  warn: { box: 'border-warn/35 bg-warn/8', icon: 'text-warn' },
  danger: { box: 'border-danger/30 bg-danger/6', icon: 'text-danger' },
  success: { box: 'border-success/30 bg-success/6', icon: 'text-success' },
} as const;

export function Notice({
  tone = 'info',
  icon: Icon,
  title,
  children,
  className,
}: {
  tone?: keyof typeof NOTICE_TONES;
  icon?: LucideIcon;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn('flex gap-3 rounded-md border px-4 py-3', NOTICE_TONES[tone].box, className)}
    >
      {Icon ? (
        <Icon aria-hidden className={cn('mt-0.5 size-5 flex-none', NOTICE_TONES[tone].icon)} />
      ) : null}
      <div className="min-w-0 text-body-sm">
        {title ? <p className="text-label text-fg">{title}</p> : null}
        {children ? <div className={cn('text-muted', title && 'mt-0.5')}>{children}</div> : null}
      </div>
    </div>
  );
}
