'use client';

import { useRouter } from 'next/navigation';
import { ErrorState } from '@/components/ui/states';

/** Client-only retry so a server-rendered error can refresh without a full reload. */
export function ApiOffline({
  title = 'Could not load the beach map',
  message = 'The booking API is offline. Start the API on port 3001, then try again.',
}: {
  title?: string;
  message?: string;
}) {
  const router = useRouter();

  return (
    <ErrorState
      title={title}
      message={message}
      onRetry={() => {
        router.refresh();
      }}
    />
  );
}
