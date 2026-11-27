'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Users } from 'lucide-react';
import type { AdminReservationDto } from '@coastline/api-contracts';
import { clientApi } from '@/lib/api';
import {
  RESERVATION_STATUS_LABELS,
  diningErrorMessage,
  reservationStatusTone,
} from '@/lib/dining/admin';
import { formatDateTime, formatMoney, formatTimeRange } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { EmptyState, Notice } from '@/components/ui/feedback-states';
import { useToast } from '@/components/ui/toast';
import { ConfirmCancel } from './confirm-cancel';

export function ReservationDesk({
  reservations: initial,
}: {
  reservations: AdminReservationDto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [reservations, setReservations] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setReservations(initial), [initial]);

  async function run(ref: string, action: 'check-in' | 'cancel', reason?: string) {
    setPending(ref);
    setErrors((current) => ({ ...current, [ref]: '' }));
    try {
      const updated = await clientApi<AdminReservationDto>(
        `/admin/dining/reservations/${encodeURIComponent(ref)}/${action}`,
        {
          method: 'POST',
          body: JSON.stringify(action === 'cancel' ? { reason } : {}),
        },
      );
      setReservations((current) =>
        current.map((item) => (item.publicRef === ref ? updated : item)),
      );
      toast.push(
        action === 'cancel' ? `${ref} cancelled. Any deposit was refunded.` : `${ref} checked in.`,
        'success',
      );
      router.refresh();
    } catch (error) {
      setErrors((current) => ({ ...current, [ref]: diningErrorMessage(error) }));
    } finally {
      setPending(null);
    }
  }

  if (reservations.length === 0) {
    return (
      <EmptyState
        title="No reservations"
        body="Nothing matches this day and venue. Try another date."
      />
    );
  }

  return (
    <Card as="div" className="divide-y divide-line">
      {[...reservations]
        .sort((a, b) => a.startAt.localeCompare(b.startAt))
        .map((item) => {
          const busy = pending === item.publicRef;
          return (
            <div key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="tabular text-title-sm">
                      {formatTimeRange(item.startAt, item.endAt)}
                    </span>
                    <StatusBadge
                      tone={reservationStatusTone(item.status)}
                      label={RESERVATION_STATUS_LABELS[item.status]}
                    />
                    <span className="font-mono text-caption text-muted">{item.publicRef}</span>
                  </p>
                  <p className="text-body">
                    {item.tourist.name}
                    <span className="text-muted">
                      {' '}
                      · {item.venue.name}, table {item.table.code}
                    </span>
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 text-body-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Users aria-hidden className="size-4" /> {item.partySize} guests
                    </span>
                    <span>
                      Deposit{' '}
                      {item.depositMinor > 0
                        ? formatMoney(item.depositMinor, item.currency)
                        : 'none'}
                      {item.payments[0] ? (
                        <span className="font-mono"> · {item.payments[0].provider}</span>
                      ) : null}
                    </span>
                  </p>
                  {item.note ? (
                    <p className="text-body-sm italic text-muted">“{item.note}”</p>
                  ) : null}
                  {item.checkedInAt ? (
                    <p className="text-body-sm text-success">
                      Checked in {formatDateTime(item.checkedInAt)}
                    </p>
                  ) : null}
                  {item.cancelledAt ? (
                    <p className="text-body-sm text-danger">
                      Cancelled {formatDateTime(item.cancelledAt)}
                      {item.cancelReason ? ` · ${item.cancelReason}` : ''}
                    </p>
                  ) : null}
                </div>
                {item.status === 'CONFIRMED' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="md"
                      loading={busy}
                      onClick={() => void run(item.publicRef, 'check-in')}
                    >
                      <LogIn aria-hidden className="size-5" /> Check in
                    </Button>
                    <ConfirmCancel
                      label="Cancel"
                      title={`Cancel ${item.publicRef}?`}
                      result={`The table is released${item.depositMinor > 0 ? ' and the deposit refunded' : ''}. The guest sees it in Trips.`}
                      disabled={busy}
                      onConfirm={(reason) => run(item.publicRef, 'cancel', reason)}
                    />
                  </div>
                ) : null}
              </div>
              {errors[item.publicRef] ? (
                <Notice tone="danger" className="mt-3">
                  {errors[item.publicRef]}
                </Notice>
              ) : null}
            </div>
          );
        })}
    </Card>
  );
}
