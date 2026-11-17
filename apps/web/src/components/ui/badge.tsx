import {
  CircleAlert,
  CircleCheck,
  CircleDot,
  CircleX,
  Clock,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/tone';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-alt text-muted',
  primary: 'bg-primary-soft text-primary',
  info: 'bg-info/12 text-info',
  success: 'bg-success/12 text-success',
  warn: 'bg-warn/14 text-warn',
  danger: 'bg-danger/12 text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-caption',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_ICONS: Record<Tone, LucideIcon> = {
  neutral: CircleDot,
  primary: CircleDot,
  info: Clock,
  success: CircleCheck,
  warn: CircleAlert,
  danger: CircleX,
};

/** Status never relies on colour alone: every status has a label and an icon. */
export function StatusBadge({
  tone,
  label,
  icon,
  className,
}: {
  tone: Tone;
  label: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const Icon = icon ?? STATUS_ICONS[tone] ?? Info;
  return (
    <Badge tone={tone} className={className}>
      <Icon aria-hidden className="size-3.5" />
      {label}
    </Badge>
  );
}
