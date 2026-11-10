import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function MetricCard({
  label,
  value,
  unit,
  hint,
  icon: Icon,
  tone = 'sea',
  children,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: 'sea' | 'sand' | 'coral' | 'mist';
  children?: ReactNode;
}) {
  const toneClass = {
    sea: 'border-sea/25 bg-sea/10 text-sea',
    sand: 'border-sand/30 bg-sand/10 text-sand',
    coral: 'border-coral/30 bg-coral/10 text-coral',
    mist: 'border-line-strong bg-raised/60 text-mist',
  }[tone];

  return (
    <section className="panel relative p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="label">{label}</p>
        <span
          aria-hidden
          className={cn('grid h-8 w-8 place-items-center rounded-lg border', toneClass)}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-3 flex items-baseline gap-1.5 font-mono text-[30px] leading-none tabular-nums text-foam">
        {value}
        {unit ? <span className="text-[12px] font-normal text-mist">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-2 text-[11.5px] leading-relaxed text-mist">{hint}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}
