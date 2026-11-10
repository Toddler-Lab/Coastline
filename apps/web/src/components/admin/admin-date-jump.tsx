'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Field, Input } from '@/components/ui/field';

/**
 * Client-side Dhaka date switch. It navigates with `?date=` so the server page
 * re-fetches; no client cache to invalidate.
 */
export function AdminDateJump({
  basePath,
  date,
  min,
  max,
  label = 'Dhaka date',
}: {
  basePath: string;
  date: string;
  min: string;
  max: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-end gap-2">
      <Field label={label} htmlFor="admin-date" className="min-w-[11rem]">
        <Input
          id="admin-date"
          type="date"
          value={date}
          min={min}
          max={max}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) return;
            startTransition(() => {
              router.replace(`${basePath}?date=${next}`, { scroll: false });
            });
          }}
        />
      </Field>
      <span role="status" aria-live="polite" className="sr-only">
        {pending ? 'Updating date' : ''}
      </span>
    </div>
  );
}
