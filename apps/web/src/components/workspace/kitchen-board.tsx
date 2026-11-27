'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, RefreshCw, Umbrella } from 'lucide-react';
import type {
  AdminFoodOrderDto,
  FoodOrderStatus,
  UpdateFoodOrderStatusRequest,
} from '@coastline/api-contracts';
import { clientApi } from '@/lib/api';
import {
  FOOD_ORDER_ADVANCE_LABELS,
  FOOD_ORDER_STATUS_LABELS,
  KITCHEN_REFRESH_MS,
  OPEN_FOOD_ORDER_STATUSES,
  canKitchenCancel,
  diningErrorMessage,
  foodOrderStatusTone,
  nextKitchenStatus,
} from '@/lib/dining/admin';
import { formatIsoTime, formatMoney } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { ErrorState, Notice } from '@/components/ui/feedback-states';
import { useToast } from '@/components/ui/toast';
import { ConfirmCancel } from './confirm-cancel';

const HINTS: Record<(typeof OPEN_FOOD_ORDER_STATUSES)[number], string> = {
  PLACED: 'New and paid. Only these can be cancelled.',
  PREPARING: 'Being cooked.',
  READY: 'Waiting for a runner.',
};

export function KitchenBoard({
  venueCode,
  initialOrders,
  initialError,
}: {
  venueCode: string;
  initialOrders: AdminFoodOrderDto[];
  initialError: string | null;
}) {
  const toast = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [loadError, setLoadError] = useState(initialError);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = useRef(false);

  useEffect(() => {
    setOrders(initialOrders);
    setLoadError(initialError);
  }, [initialOrders, initialError]);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRefreshing(true);
    try {
      const query = venueCode ? `?venueCode=${encodeURIComponent(venueCode)}` : '';
      setOrders(await clientApi<AdminFoodOrderDto[]>(`/admin/dining/food-orders${query}`));
      setLoadError(null);
      setRefreshedAt(new Date().toISOString());
    } catch (error) {
      setLoadError(diningErrorMessage(error));
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [venueCode]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, KITCHEN_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function setStatus(
    order: AdminFoodOrderDto,
    status: UpdateFoodOrderStatusRequest['status'],
    reason?: string,
  ) {
    const ref = order.publicRef;
    setPending(ref);
    setErrors((current) => ({ ...current, [ref]: '' }));
    try {
      const body: UpdateFoodOrderStatusRequest = reason ? { status, reason } : { status };
      const updated = await clientApi<AdminFoodOrderDto>(
        `/admin/dining/food-orders/${encodeURIComponent(ref)}/status`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      setOrders((current) => current.map((item) => (item.publicRef === ref ? updated : item)));
      toast.push(
        status === 'CANCELLED'
          ? `${ref} cancelled and refunded.`
          : `${ref}: ${FOOD_ORDER_STATUS_LABELS[status]}.`,
        'success',
      );
    } catch (error) {
      setErrors((current) => ({ ...current, [ref]: diningErrorMessage(error) }));
      void refresh();
    } finally {
      setPending(null);
    }
  }

  const columns = OPEN_FOOD_ORDER_STATUSES.map((status) => ({
    status,
    orders: orders
      .filter((order) => order.status === status)
      .sort((a, b) => a.placedAt.localeCompare(b.placedAt)),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="text-body-sm text-muted" role="status" aria-live="polite">
          {refreshing
            ? 'Refreshing…'
            : refreshedAt
              ? `Updated ${formatIsoTime(refreshedAt)}`
              : `Refreshes every ${KITCHEN_REFRESH_MS / 1000} s`}
        </p>
        <Button variant="secondary" loading={refreshing} onClick={() => void refresh()}>
          <RefreshCw aria-hidden className="size-5" /> Refresh
        </Button>
      </div>
      {loadError ? (
        <ErrorState
          title="Kitchen queue unavailable"
          message={loadError}
          onRetry={() => void refresh()}
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.status}
            aria-labelledby={`col-${column.status}`}
            className="rounded-md bg-surface-alt p-3"
          >
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 id={`col-${column.status}`} className="flex items-center gap-2 text-title-sm">
                <StatusBadge
                  tone={foodOrderStatusTone(column.status)}
                  label={FOOD_ORDER_STATUS_LABELS[column.status]}
                />
                <span className="tabular text-muted">{column.orders.length}</span>
              </h2>
            </header>
            <p className="mb-3 px-1 text-caption text-muted">{HINTS[column.status]}</p>
            {column.orders.length === 0 ? (
              <p className="px-1 py-6 text-center text-body-sm text-muted">Nothing here.</p>
            ) : (
              <ul className="space-y-2">
                {column.orders.map((order) => {
                  const next = nextKitchenStatus(order.status);
                  const advance =
                    next && next !== 'PLACED' ? (next as Exclude<FoodOrderStatus, 'PLACED'>) : null;
                  const isBusy = pending === order.publicRef;
                  return (
                    <li key={order.id}>
                      <Card className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-title-sm">
                            <Umbrella aria-hidden className="size-4 text-primary" /> Sunbed{' '}
                            {order.delivery.sunbedCode}
                          </p>
                          <span className="tabular text-body-sm text-muted">
                            {formatIsoTime(order.placedAt)}
                          </span>
                        </div>
                        <p className="text-caption text-muted">
                          {order.delivery.beachPointName} ·{' '}
                          <span className="font-mono">{order.publicRef}</span>
                        </p>
                        <ul className="mt-2 text-body-sm">
                          {order.lines.map((line) => (
                            <li key={line.id}>
                              <span className="tabular font-semibold">{line.quantity}×</span>{' '}
                              {line.name}
                            </li>
                          ))}
                        </ul>
                        {order.note ? (
                          <p className="mt-1 text-body-sm italic text-muted">“{order.note}”</p>
                        ) : null}
                        <p className="mt-2 text-caption text-muted">
                          {order.tourist.name} · {formatMoney(order.totalMinor, order.currency)}
                          {order.payments[0] ? (
                            <span className="font-mono"> · {order.payments[0].provider}</span>
                          ) : null}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {advance ? (
                            <Button loading={isBusy} onClick={() => void setStatus(order, advance)}>
                              {FOOD_ORDER_ADVANCE_LABELS[advance] ??
                                FOOD_ORDER_STATUS_LABELS[advance]}
                              <ArrowRight aria-hidden className="size-5" />
                            </Button>
                          ) : null}
                          {canKitchenCancel(order.status) ? (
                            <ConfirmCancel
                              label="Cancel"
                              title={`Cancel ${order.publicRef}?`}
                              result="The order is cancelled and the payment refunded. The guest sees it in Trips."
                              disabled={isBusy}
                              onConfirm={(reason) => setStatus(order, 'CANCELLED', reason)}
                            />
                          ) : null}
                        </div>
                        {errors[order.publicRef] ? (
                          <Notice tone="danger" className="mt-2">
                            {errors[order.publicRef]}
                          </Notice>
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
