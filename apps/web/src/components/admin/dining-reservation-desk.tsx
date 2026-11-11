'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminReservationDto, CancelReservationRequest } from '@coastline/api-contracts';
import { LogIn, Users } from 'lucide-react';
import { DiningCancelControl } from '@/components/admin/dining-cancel-control';
import { AdminNotice } from '@/components/admin/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { clientApi } from '@/lib/api';
import {
  RESERVATION_STATUS_LABELS,
  diningErrorMessage,
  reservationStatusTone,
} from '@/lib/dining/admin';
import { formatDateTime, formatIsoTime, formatMoney } from '@/lib/format';

type Action = 'check-in' | 'cancel';

export function DiningReservationDesk({
  reservations: initial,
}: {
  reservations: AdminReservationDto[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [reservations, setReservations] = useState(initial);
  const [pending, setPending] = useState<{ ref: string; action: Action } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A server refresh (filters, after an action) replaces the local copy.
  useEffect(() => setReservations(initial), [initial]);

  const run = async (ref: string, action: Action, reason?: string) => {
    setPending({ ref, action });
    setErrors((current) => ({ ...current, [ref]: '' }));
    try {
      const path = `/admin/dining/reservations/${encodeURIComponent(ref)}/${action}`;
      const body: CancelReservationRequest | Record<string, never> =
        action === 'cancel' ? { reason } : {};
      const updated = await clientApi<AdminReservationDto>(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setReservations((current) =>
        current.map((entry) => (entry.publicRef === ref ? updated : entry)),
      );
      toast.push(
        action === 'cancel' ? `${ref} cancelled; any demo deposit refunded.` : `${ref} checked in.`,
        'success',
      );
      router.refresh();
    } catch (error) {
      setErrors((current) => ({ ...current, [ref]: diningErrorMessage(error) }));
    } finally {
      setPending(null);
    }
  };

  if (reservations.length === 0) {
    return (
      <EmptyState
        title="No reservations"
        body="Nothing matches this day and these filters. Try another date or clear the filters."
      />
    );
  }

  const sorted = [...reservations].sort(
    (left, right) => Date.parse(left.startAt) - Date.parse(right.startAt),
  );

  return (
    <Panel className="overflow-hidden">
      <ul aria-label="Reservations" className="divide-y divide-line/70">
        {sorted.map((reservation) => {
          const ref = reservation.publicRef;
          const busy = pending?.ref === ref;
          const actionable = reservation.status === 'CONFIRMED';
          return (
            <li key={reservation.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[15px] tabular-nums text-foam">
                      {formatIsoTime(reservation.startAt)}–{formatIsoTime(reservation.endAt)}
                    </span>
                    <Badge tone={reservationStatusTone(reservation.status)}>
                      {RESERVATION_STATUS_LABELS[reservation.status]}
                    </Badge>
                    <span className="font-mono text-[11px] text-mist">{ref}</span>
                  </p>
                  <p className="text-[13px] text-foam">
                    {reservation.venue.name}
                    <span className="text-mist"> · table {reservation.table.code}</span>
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist">
                    <span className="inline-flex items-center gap-1">
                      <Users aria-hidden className="h-3.5 w-3.5" />
                      {reservation.partySize} guests
                    </span>
                    <span>{reservation.tourist.name}</span>
                    <span>
                      Deposit{' '}
                      {reservation.depositMinor > 0 ? (
                        <>
                          <span className="font-mono text-foam">
                            {formatMoney(reservation.depositMinor)}
                          </span>{' '}
                          <Badge tone="warn">Simulated</Badge>
                        </>
                      ) : (
                        'none'
                      )}
                    </span>
                  </p>
                  {reservation.note ? (
                    <p className="text-[12px] italic text-mist">“{reservation.note}”</p>
                  ) : null}
                  {reservation.checkedInAt ? (
                    <p className="text-[11.5px] text-success">
                      Checked in {formatDateTime(reservation.checkedInAt)}
                    </p>
                  ) : null}
                  {reservation.cancelledAt ? (
                    <p className="text-[11.5px] text-danger">
                      Cancelled {formatDateTime(reservation.cancelledAt)}
                      {reservation.cancelReason ? ` · ${reservation.cancelReason}` : ''}
                    </p>
                  ) : null}
                </div>

                {actionable ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      loading={busy && pending?.action === 'check-in'}
                      disabled={busy}
                      onClick={() => run(ref, 'check-in')}
                    >
                      <LogIn aria-hidden className="h-3.5 w-3.5" />
                      Check in
                    </Button>
                    <DiningCancelControl
                      label="Cancel"
                      confirmLabel="Cancel reservation"
                      pending={busy && pending?.action === 'cancel'}
                      disabled={busy}
                      onConfirm={(reason) => run(ref, 'cancel', reason)}
                    />
                  </div>
                ) : null}
              </div>
              {errors[ref] ? (
                <AdminNotice tone="danger" className="mt-3">
                  {errors[ref]}
                </AdminNotice>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line px-4 py-2.5 text-[11px] text-mist">
        Times are Asia/Dhaka. Deposits and refunds are mock payments; no real money moves.
      </p>
    </Panel>
  );
}
