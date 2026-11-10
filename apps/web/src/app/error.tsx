'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-6">
      <p className="label">Something broke</p>
      <h1 className="text-3xl">The beach map lost its bearings.</h1>
      <p className="max-w-prose text-[13.5px] leading-relaxed text-mist">
        This is usually a stopped API or a lost database connection. Start the API, then try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
