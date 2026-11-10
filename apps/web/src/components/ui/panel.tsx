import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('panel', className)} {...props} />;
}

export function PanelHeader({
  title,
  eyebrow,
  right,
  className,
}: {
  title: string;
  eyebrow?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        {eyebrow ? <p className="label mb-1">{eyebrow}</p> : null}
        <h2 className="text-[17px] leading-tight">{title}</h2>
      </div>
      {right}
    </div>
  );
}
