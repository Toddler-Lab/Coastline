import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'sea' | 'sand' | 'success' | 'warn' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'border-line text-mist bg-raised/40',
  sea: 'border-sea/35 text-sea bg-sea/10',
  sand: 'border-sand/40 text-sand bg-sand/10',
  success: 'border-success/35 text-success bg-success/10',
  warn: 'border-warn/40 text-warn bg-warn/10',
  danger: 'border-danger/40 text-danger bg-danger/10',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function StatusDot({ tone = 'neutral' }: { tone?: Tone }) {
  const color =
    tone === 'success'
      ? 'bg-success'
      : tone === 'danger'
        ? 'bg-danger'
        : tone === 'warn'
          ? 'bg-warn'
          : tone === 'sea'
            ? 'bg-sea'
            : 'bg-mist';
  return <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', color)} />;
}
