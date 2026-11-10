import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="label">{eyebrow}</p>
        <h1 className="mt-2 text-[28px] leading-[1.05] sm:text-[34px]">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-mist">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-end gap-2">{actions}</div> : null}
    </div>
  );
}
