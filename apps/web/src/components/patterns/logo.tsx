import Link from 'next/link';
import { cn } from '@/lib/cn';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8', className)}>
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <path
        d="M6 19.5c2.6 0 2.6-2 5.2-2s2.6 2 5.2 2 2.6-2 5.2-2 2.6 2 4.4 2"
        fill="none"
        stroke="var(--on-primary)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="21" cy="11" r="3.2" fill="var(--on-primary)" />
    </svg>
  );
}

export function Logo({
  href = '/',
  label = 'Coastline',
  className,
}: {
  href?: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn('inline-flex h-11 items-center gap-2 rounded-sm pr-2 text-title-sm', className)}
      aria-label={`${label} home`}
    >
      <LogoMark />
      <span aria-hidden>{label}</span>
    </Link>
  );
}
