'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FoodOrderDto } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

/** Two-step cancel, offered only while the API reports `canCancel` (order still PLACED). */
export function FoodOrderCancel({
  publicRef,
  totalMinor,
}: {
  publicRef: string;
  totalMinor: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function cancel() {
    setPending(true);
    setError(null);
    try {
      await clientApi<FoodOrderDto>(`/dining/food-orders/${encodeURIComponent(publicRef)}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      toast.push('Food order cancelled. A simulated refund was recorded.', 'success');
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The booking API is offline. Start the API on port 3001, then try again.',
      );
      // The kitchen may have started meanwhile; show the current state.
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-3">
        <p className="text-[11px] leading-relaxed text-mist">
          You can cancel until the kitchen starts preparing. The demo charge of{' '}
          {formatMoney(totalMinor)} is refunded in full; no real money moves.
        </p>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Cancel order
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-danger/35 bg-danger/5 p-4">
      <div>
        <p className="text-[13px] font-semibold text-foam">Cancel this food order?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-mist">
          {publicRef} is withdrawn from the kitchen and a simulated refund of{' '}
          {formatMoney(totalMinor)} is recorded. This cannot be undone.
        </p>
      </div>
      <div>
        <label htmlFor="food-cancel-reason" className="label mb-1.5 block">
          Reason (optional)
        </label>
        <textarea
          id="food-cancel-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          maxLength={250}
          placeholder="Ordered by mistake…"
          className="w-full rounded-lg border border-line-strong bg-abyss/70 px-3 py-2.5 text-[12px] text-foam placeholder:text-mist/50 focus:border-sea/60 focus:outline-none focus-visible:outline-2 focus-visible:outline-sea/70"
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-[11px] leading-relaxed text-danger"
        >
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Keep order
        </Button>
        <Button variant="danger" loading={pending} onClick={cancel}>
          Confirm cancellation
        </Button>
      </div>
    </div>
  );
}
