'use client';

import Link from 'next/link';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { addDays, formatDateKey, relativeDateLabel } from '@/lib/format';

/**
 * Flow page shape (design.md 4.1): one step per screen, progress at the top,
 * primary button at the bottom; centred 640 column with the order summary on
 * the right on expanded screens.
 */
export function FlowShell({
  title,
  step,
  steps,
  onBack,
  exitHref,
  summary,
  footer,
  children,
}: {
  title: string;
  step: number;
  steps: string[];
  onBack?: () => void;
  exitHref: string;
  summary?: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="page max-w-[1100px]">
      <div className="flex items-center gap-2 py-2 lg:py-4">
        {onBack && step > 0 ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Previous step"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-alt"
          >
            <ArrowLeft aria-hidden className="size-6" />
          </button>
        ) : (
          <Link
            href={exitHref}
            aria-label="Close"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-alt"
          >
            <X aria-hidden className="size-6" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-label">{title}</p>
          <p className="text-caption text-muted">
            Step {step + 1} of {steps.length} · {steps[step]}
          </p>
        </div>
      </div>
      <ol aria-label="Progress" className="flex gap-1.5">
        {steps.map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? 'step' : undefined}
            className={cn('h-1.5 flex-1 rounded-full', index <= step ? 'bg-primary' : 'bg-line')}
          >
            <span className="sr-only">
              {label}
              {index < step ? ' (done)' : index === step ? ' (current)' : ''}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] lg:gap-10">
        <div>
          <h1 className="text-title-lg">{steps[step]}</h1>
          <div className="mt-5">{children}</div>
          <div className="h-28 lg:hidden" aria-hidden />
          <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-soft lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {footer}
          </div>
        </div>
        {summary ? (
          <aside aria-label="Summary" className="hidden lg:block">
            <div className="sticky top-[calc(var(--topbar-h)+24px)]">{summary}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

/** Horizontal strip of day chips for Dhaka date keys. */
export function DateStrip({
  today,
  days,
  value,
  onChange,
  label,
  disabledBefore,
}: {
  today: string;
  days: number;
  value: string;
  onChange: (dateKey: string) => void;
  label: string;
  disabledBefore?: string;
}) {
  const keys = Array.from({ length: days }, (_, index) => addDays(today, index));
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-label">{label}</legend>
      <div className="bleed-row scrollbar-none flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {keys.map((key) => {
          const selected = key === value;
          const disabled = Boolean(disabledBefore && key < disabledBefore);
          const [weekday, day, month] = formatDateKey(key).split(' ');
          const relative = relativeDateLabel(key, today);
          return (
            <label
              key={key}
              className={cn(
                'relative flex h-16 w-16 flex-none cursor-pointer flex-col items-center justify-center rounded-md border text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                selected
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface hover:bg-surface-alt',
                disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              <input
                type="radio"
                name={label}
                value={key}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(key)}
                className="sr-only"
              />
              <span className="text-caption">{relative === 'Today' ? 'Today' : weekday}</span>
              <span className="tabular text-title-sm leading-6">{day}</span>
              <span className="text-caption text-muted">{month}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
