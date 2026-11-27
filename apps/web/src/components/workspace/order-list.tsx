'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import type { AdminOrderDto } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { orderToTrip } from '@/lib/trips';
import { SERVICES } from '@/lib/services';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { EmptyState, Notice } from '@/components/ui/feedback-states';
import { useToast } from '@/components/ui/toast';
import { ConfirmCancel } from './confirm-cancel';

/** Responsive booking list: a card per row on phones, a dense table on desktop. */
export function OrderList({
  orders: initial,
  mode,
}: {
  orders: AdminOrderDto[];
  mode: 'desk' | 'admin';
}) {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setOrders(initial), [initial]);

  async function act(order: AdminOrderDto, action: 'check-in' | 'cancel', reason?: string) {
    setPending(order.publicRef);
    setErrors((current) => ({ ...current, [order.publicRef]: '' }));
    try {
      const updated = await clientApi<AdminOrderDto>(
        `/admin/orders/${encodeURIComponent(order.publicRef)}/${action}`,
        {
          method: 'POST',
          body: JSON.stringify(action === 'cancel' ? { reason } : {}),
        },
      );
      setOrders((current) =>
        current.map((item) => (item.publicRef === order.publicRef ? updated : item)),
      );
      toast.push(
        action === 'cancel'
          ? `${order.publicRef} cancelled and refunded.`
          : `${order.publicRef} checked in.`,
        'success',
      );
      router.refresh();
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [order.publicRef]: error instanceof ApiError ? error.message : 'Could not reach Coastline.',
      }));
    } finally {
      setPending(null);
    }
  }

  if (orders.length === 0) {
    return <EmptyState title="No bookings" body="Nothing matches this day and filter." />;
  }

  return (
    <Card as="div" className="divide-y divide-line">
      {orders.map((order) => {
        const trip = orderToTrip(order);
        const Icon = SERVICES[trip.service].icon;
        const reserved =
          order.items.some((item) => item.status === 'RESERVED') ||
          (order.hotelBookings ?? []).some((item) => item.status === 'RESERVED');
        const canCheckIn = order.status === 'CONFIRMED' && reserved;
        const status =
          order.status === 'CANCELLED'
            ? { tone: 'danger' as const, label: 'Cancelled' }
            : !reserved
              ? { tone: 'success' as const, label: 'Checked in' }
              : trip.status;
        const busy = pending === order.publicRef;
        return (
          <div key={order.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <Icon aria-hidden className="hidden size-6 flex-none text-primary md:block" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="text-title-sm">{order.tourist.name}</span>
                <StatusBadge tone={status.tone} label={status.label} />
              </p>
              <p className="text-body-sm text-muted">
                {trip.title} · {trip.subtitle}
              </p>
              <p className="tabular text-body-sm">
                {trip.timeLabel} · <span className="font-mono text-muted">{order.publicRef}</span>
              </p>
            </div>
            {mode === 'admin' ? (
              <div className="text-body-sm md:w-36 md:text-right">
                <p className="tabular">{formatMoney(order.totalMinor, order.currency)}</p>
                <p className="font-mono text-caption text-muted">
                  {order.payments
                    .map((payment) => payment.provider)
                    .filter((value, index, list) => list.indexOf(value) === index)
                    .join(', ') || '—'}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {canCheckIn ? (
                <Button loading={busy} onClick={() => void act(order, 'check-in')}>
                  <LogIn aria-hidden className="size-5" /> Check in
                </Button>
              ) : null}
              {mode === 'admin' && order.status === 'CONFIRMED' ? (
                <ConfirmCancel
                  label="Cancel"
                  title={`Cancel ${order.publicRef}?`}
                  result={`The booking is cancelled and ${formatMoney(order.totalMinor, order.currency)} refunded. The guest sees it in Trips.`}
                  disabled={busy}
                  onConfirm={(reason) => act(order, 'cancel', reason)}
                />
              ) : null}
            </div>
            {errors[order.publicRef] ? (
              <Notice tone="danger" className="md:basis-full">
                {errors[order.publicRef]}
              </Notice>
            ) : null}
          </div>
        );
      })}
    </Card>
  );
}
