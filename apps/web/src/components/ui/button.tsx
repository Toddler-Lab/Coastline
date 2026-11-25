import { forwardRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-label transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'rounded-xl bg-action-bg text-action-fg shadow-sm hover:bg-action-bg/90 hover:scale-105 active:scale-100',
  secondary: 'border border-line bg-surface text-fg hover:bg-surface-alt',
  text: 'text-primary hover:bg-primary-soft',
  ghost: 'text-fg hover:bg-surface-alt',
  danger: 'bg-danger text-surface hover:brightness-110',
};

/* Every size keeps a 44 px touch target; `sm` is for dense staff tables. */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 min-w-9 px-3 text-[14px]',
  md: 'h-11 min-w-11 px-4',
  lg: 'h-12 min-w-12 px-6 text-[16px]',
};

export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    block,
    className,
    children,
    disabled,
    type,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, cn(block && 'w-full', className))}
      {...rest}
    >
      {loading ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
      {children}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary';
}

/** Square 44 px button with a required accessible label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-11 flex-none items-center justify-center rounded-full transition-colors disabled:opacity-50',
        variant === 'ghost' && 'text-fg hover:bg-surface-alt',
        variant === 'secondary' &&
          'border border-line bg-surface text-fg shadow-soft hover:bg-surface-alt',
        variant === 'primary' && 'bg-action-bg text-action-fg hover:bg-action-bg/90',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
