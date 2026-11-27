'use client';

import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/feedback-states';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="page max-w-xl py-16">
      <ErrorState
        title="This page did not load"
        message="Something went wrong on our side. Anything you already paid for is safe in Trips."
        onRetry={reset}
      />
      <Link href="/trips" className={buttonClass('text', 'md', 'mt-4')}>
        Open Trips
      </Link>
    </main>
  );
}
