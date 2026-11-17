import Link from 'next/link';
import { ChevronRight, Minus, Plus, Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

export function Card({
  as: Tag = 'div',
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: 'div' | 'section' | 'article' | 'li' | 'aside' }) {
  return (
    <Tag className={cn('rounded-md border border-line bg-surface', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** "Tk 1,250" with tabular figures. */
export function Money({
  minor,
  currency = 'BDT',
  className,
}: {
  minor: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={cn('tabular whitespace-nowrap', className)}>
      {formatMoney(minor, currency)}
    </span>
  );
}

/** Price with its unit always shown: "from Tk 3,500 / night". */
export function PriceUnit({
  minor,
  unit,
  from = false,
  currency,
  className,
}: {
  minor: number;
  unit?: string;
  from?: boolean;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={cn('text-body-sm text-muted', className)}>
      {from ? 'from ' : null}
      <Money minor={minor} currency={currency} className="text-title-sm text-fg" />
      {unit ? <span> / {unit}</span> : null}
    </span>
  );
}

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-body-sm', className)}>
      <Star aria-hidden className="size-4 fill-current text-warn" />
      <span className="tabular font-semibold">{value.toFixed(1)}</span>
      {count !== undefined ? <span className="text-muted">({count})</span> : null}
      <span className="sr-only">out of 5</span>
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid size-10 flex-none place-items-center rounded-full bg-primary-soft text-label text-primary',
        className,
      )}
    >
      {initials || '?'}
    </span>
  );
}

/** Quantity stepper with 44 px targets. */
export function Stepper({
  value,
  min = 0,
  max = 99,
  onChange,
  label,
  disabled,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center rounded-full border border-line bg-surface"
    >
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid size-11 place-items-center rounded-full text-fg hover:bg-surface-alt disabled:opacity-40"
      >
        <Minus aria-hidden className="size-5" />
      </button>
      <output aria-live="polite" className="tabular w-8 text-center text-label">
        {value}
      </output>
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid size-11 place-items-center rounded-full text-fg hover:bg-surface-alt disabled:opacity-40"
      >
        <Plus aria-hidden className="size-5" />
      </button>
    </div>
  );
}

export interface Choice<T extends string | number> {
  value: T;
  label: React.ReactNode;
  hint?: React.ReactNode;
  disabled?: boolean;
}

/** Single choice as a radio group of large tappable options. */
export function ChoiceGroup<T extends string | number>({
  name,
  legend,
  value,
  options,
  onChange,
  columns = 'auto',
  className,
}: {
  name: string;
  legend: string;
  value: T | null;
  options: Choice<T>[];
  onChange: (value: T) => void;
  columns?: 'auto' | 2 | 3 | 4;
  className?: string;
}) {
  const grid =
    columns === 2
      ? 'grid grid-cols-2 gap-2'
      : columns === 3
        ? 'grid grid-cols-3 gap-2'
        : columns === 4
          ? 'grid grid-cols-3 gap-2 md:grid-cols-4'
          : 'flex flex-wrap gap-2';
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="mb-2 text-label">{legend}</legend>
      <div className={grid}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={String(option.value)}
              className={cn(
                'relative flex min-h-11 cursor-pointer flex-col justify-center rounded-sm border px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                checked
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line bg-surface hover:bg-surface-alt',
                option.disabled && 'cursor-not-allowed opacity-45 hover:bg-surface',
              )}
            >
              <input
                type="radio"
                name={name}
                className="sr-only"
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
              />
              <span className="text-label">{option.label}</span>
              {option.hint ? <span className="text-caption text-muted">{option.hint}</span> : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Section with heading and an optional "All >" link. */
export function Section({
  id,
  title,
  description,
  href,
  hrefLabel = 'See all',
  className,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('scroll-mt-32', className)}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-title">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-body-sm text-muted">{description}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="-mr-2 inline-flex h-11 flex-none items-center gap-0.5 rounded-sm px-2 text-label text-primary hover:bg-primary-soft"
          >
            {hrefLabel}
            <ChevronRight aria-hidden className="size-5" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** Key/value rows for summaries and receipts. */
export function DetailRows({
  rows,
  className,
}: {
  rows: Array<{ label: React.ReactNode; value: React.ReactNode; strong?: boolean }>;
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-line', className)}>
      {rows.map((row, index) => (
        <div
          key={index}
          className={cn(
            'flex items-baseline justify-between gap-4 py-2.5',
            row.strong && 'text-title-sm',
          )}
        >
          <dt className={cn(!row.strong && 'text-body-sm text-muted')}>{row.label}</dt>
          <dd className="tabular text-right">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
