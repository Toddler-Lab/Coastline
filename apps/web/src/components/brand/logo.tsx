import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      className={cn('h-9 w-9', className)}
      role="img"
      aria-label="Coastline"
      fill="none"
    >
      <circle cx="22" cy="22" r="20" stroke="currentColor" strokeOpacity="0.28" />
      <path
        d="M8 28c4.4 0 4.4-4 8.8-4s4.4 4 8.8 4 4.4-4 8.8-4"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M8 34c4.4 0 4.4-3 8.8-3s4.4 3 8.8 3 4.4-3 8.8-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <path d="M22 10v7" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
      <circle cx="22" cy="8" r="2.6" fill="currentColor" />
    </svg>
  );
}
