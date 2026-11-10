'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderDto } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

/**
 * Inline, two-step cancellation. The API enforces the 60-minute cutoff; the
 * copy explains it before the visitor commits.
 */
export function CancelOrder({ publicRef, totalMinor }: { publicRef: string; totalMinor: number }) {
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
      await clientApi<OrderDto>(`/orders/${encodeURIComponent(publicRef)}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      toast.push('Booking cancelled. A simulated refund was issued.', 'success');
      setOpen(false);
      router.refresh();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('The booking API is offline. Start the API on port 3001, then try again.');
      }
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-3 print:hidden">
        <p className="text-[11px] leading-relaxed text-mist">
          Cancel free until 60 minutes before the earliest booked hour. The mock charge of{' '}
          {formatMoney(totalMinor)} is refunded in full; no real money moves.
        </p>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Cancel booking
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-danger/35 bg-danger/5 p-4 print:hidden">
      <div>
        <p className="text-[13px] font-semibold text-foam">Cancel this booking?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-mist">
          All beds in {publicRef} are released immediately and a simulated refund of{' '}
          {formatMoney(totalMinor)} is recorded. This cannot be undone.
        </p>
      </div>

      <div>
        <label htmlFor="cancel-reason" className="label mb-1.5 block">
          Reason (optional)
        </label>
        <textarea
          id="cancel-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Weather changed, plans moved…"
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
          Keep booking
        </Button>
        <Button variant="danger" loading={pending} onClick={cancel}>
          Confirm cancellation
        </Button>
      </div>
    </div>
  );
}
