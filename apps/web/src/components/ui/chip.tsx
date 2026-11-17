import Link from 'next/link';
import { cn } from '@/lib/cn';

const CHIP =
  'inline-flex h-11 flex-none items-center gap-2 whitespace-nowrap rounded-full border px-4 text-label transition-colors';

export function chipClass(selected = false, className?: string): string {
  return cn(
    CHIP,
    selected
      ? 'border-primary bg-primary-soft text-primary'
      : 'border-line bg-surface text-fg hover:bg-surface-alt',
    className,
  );
}

/** Filter or choice chip. Selection is announced with aria-pressed. */
export function Chip({
  selected = false,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={chipClass(selected, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ChipLink({
  href,
  selected = false,
  className,
  children,
}: {
  href: string;
  selected?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'page' : undefined}
      className={chipClass(selected, className)}
    >
      {children}
    </Link>
  );
}

/** Horizontally scrolling chip row that bleeds to the screen edge on phones. */
export function ChipRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('bleed-row scrollbar-none flex gap-2 overflow-x-auto py-1', className)}
    >
      {children}
    </div>
  );
}
