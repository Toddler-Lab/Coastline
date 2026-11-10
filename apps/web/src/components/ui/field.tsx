import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="label block text-foam/80">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-mist">{hint}</p>
      ) : null}
    </div>
  );
}

const CONTROL =
  'w-full rounded-lg border border-line-strong bg-abyss/70 px-3 text-[13px] text-foam placeholder:text-mist/50 transition-colors focus:border-sea/60 focus:outline-none focus-visible:outline-2 focus-visible:outline-sea/70 disabled:opacity-50';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, 'h-11', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, 'h-11 appearance-none pr-8', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, 'min-h-24 py-2.5', className)} {...props} />;
}

export function Checkbox({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn('flex min-h-11 items-center gap-2.5 text-[13px]', className)}>
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-line-strong bg-abyss accent-[var(--color-sea)]"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
