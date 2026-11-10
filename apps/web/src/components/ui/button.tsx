import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sand';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-sea text-abyss hover:bg-sea-deep disabled:bg-sea/40 disabled:text-abyss/60 font-semibold',
  secondary: 'bg-raised/60 text-foam border border-line-strong hover:border-sea/60 hover:bg-raised',
  ghost: 'bg-transparent text-mist hover:bg-raised/60 hover:text-foam',
  danger: 'bg-danger/15 text-danger border border-danger/35 hover:bg-danger/25',
  sand: 'bg-sand text-abyss hover:bg-sand/85 font-semibold',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[12px] gap-1.5',
  md: 'h-11 px-4 text-[13px] gap-2',
  lg: 'h-12 px-5 text-[14px] gap-2',
  icon: 'h-11 w-11 justify-center',
};

export function buttonClass(
  variant: Variant = 'primary',
  size: Size = 'md',
  extra?: string,
): string {
  return cn(
    'inline-flex select-none items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={props.type ?? 'button'}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
