'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ReservationDto } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

/**
 * Two-step tourist cancellation. The API enforces the 60-minute cutoff and
 * refunds the demo deposit by reversal; this only explains it first.
 */
export function ReservationCancel({
  publicRef,
  depositMinor,
}: {
  publicRef: string;
  depositMinor: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refundCopy =
    depositMinor > 0
      ? `The demo deposit of ${formatMoney(depositMinor)} is refunded in full; no real money moves.`
      : 'No deposit was taken for this table.';

  async function cancel() {
    setPending(true);
    setError(null);
    try {
      await clientApi<ReservationDto>(
        `/dining/reservations/${encodeURIComponent(publicRef)}/cancel`,
        { method: 'POST', body: JSON.stringify({ reason: reason.trim() || undefined }) },
      );
      toast.push(
        depositMinor > 0
          ? 'Reservation cancelled. A simulated refund was issued.'
          : 'Reservation cancelled.',
        'success',
      );
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The booking API is offline. Start the API on port 3001, then try again.',
      );
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-3 print:hidden">
        <p className="text-[11px] leading-relaxed text-mist">
          Cancel free until 60 minutes before the start. {refundCopy}
        </p>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Cancel reservation
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-danger/35 bg-danger/5 p-4 print:hidden">
      <div>
        <p className="text-[13px] font-semibold text-foam">Cancel this reservation?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-mist">
          The table is released immediately. {refundCopy} This cannot be undone.
        </p>
      </div>
      <div>
        <label htmlFor="reservation-cancel-reason" className="label mb-1.5 block">
          Reason (optional)
        </label>
        <textarea
          id="reservation-cancel-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          maxLength={250}
          placeholder="Plans changed…"
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
          Keep reservation
        </Button>
        <Button variant="danger" loading={pending} onClick={cancel}>
          Confirm cancellation
        </Button>
      </div>
    </div>
  );
}
