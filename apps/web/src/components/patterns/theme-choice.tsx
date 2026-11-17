'use client';

import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { applyTheme, type ThemePreference } from '@/lib/theme';
import { cn } from '@/lib/cn';

const OPTIONS: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

export function ThemeChoice({ initial }: { initial: ThemePreference }) {
  const [theme, setTheme] = useState(initial);
  return (
    <fieldset className="rounded-md border border-line bg-surface p-4">
      <legend className="sr-only">Theme</legend>
      <p aria-hidden className="mb-3 text-label">
        Theme
      </p>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => {
          const checked = option.value === theme;
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border text-label has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                checked
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-line hover:bg-surface-alt',
              )}
            >
              <input
                type="radio"
                name="theme"
                className="sr-only"
                checked={checked}
                onChange={() => {
                  setTheme(option.value);
                  applyTheme(option.value);
                }}
              />
              <option.icon aria-hidden className="size-5" />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
