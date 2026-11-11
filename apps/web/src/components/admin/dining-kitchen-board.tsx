'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AdminFoodOrderDto,
  FoodOrderStatus,
  UpdateFoodOrderStatusRequest,
} from '@coastline/api-contracts';
import { ArrowRight, RefreshCw, Umbrella } from 'lucide-react';
import { DiningCancelControl } from '@/components/admin/dining-cancel-control';
import { AdminNotice } from '@/components/admin/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Select } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { ErrorState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
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
  type OpenFoodOrderStatus,
} from '@/lib/dining/admin';
import { formatIsoDate, formatMoney, toDhaka } from '@/lib/format';

const COLUMN_HINTS: Record<OpenFoodOrderStatus, string> = {
  PLACED: 'New, paid (simulated). Cancel only here.',
  PREPARING: 'On the stove.',
  READY: 'Waiting for a runner.',
};

function dhakaClock(iso: string): string {
  const shifted = toDhaka(new Date(iso));
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}

export function DiningKitchenBoard({
  venueCode,
  venues,
  initialOrders,
  initialError,
}: {
  venueCode: string;
  venues: Array<{ code: string; name: string }>;
  initialOrders: AdminFoodOrderDto[] | null;
  initialError: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<AdminFoodOrderDto[]>(initialOrders ?? []);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busyRef = useRef(false);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRefreshing(true);
    try {
      const query = venueCode ? `?venueCode=${encodeURIComponent(venueCode)}` : '';
      const next = await clientApi<AdminFoodOrderDto[]>(`/admin/dining/food-orders${query}`);
      setOrders(next);
      setLoadError(null);
      setRefreshedAt(new Date().toISOString());
    } catch (error) {
      setLoadError(diningErrorMessage(error));
    } finally {
      busyRef.current = false;
      setRefreshing(false);
    }
  }, [venueCode]);

  // A server re-render (venue filter change) hands down a fresh snapshot.
  useEffect(() => {
    setOrders(initialOrders ?? []);
    setLoadError(initialError);
  }, [initialOrders, initialError]);

  // Light polling while the tab is visible.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, KITCHEN_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const setStatus = async (
    order: AdminFoodOrderDto,
    status: UpdateFoodOrderStatusRequest['status'],
    reason?: string,
  ) => {
    const ref = order.publicRef;
    setPending(ref);
    setErrors((current) => ({ ...current, [ref]: '' }));
    try {
      const body: UpdateFoodOrderStatusRequest = reason ? { status, reason } : { status };
      const updated = await clientApi<AdminFoodOrderDto>(
        `/admin/dining/food-orders/${encodeURIComponent(ref)}/status`,
        { method: 'POST', body: JSON.stringify(body) },
      );
      setOrders((current) => current.map((entry) => (entry.publicRef === ref ? updated : entry)));
      toast.push(
        status === 'CANCELLED'
          ? `${ref} cancelled; demo payment refunded.`
          : `${ref} → ${FOOD_ORDER_STATUS_LABELS[status]}.`,
        'success',
      );
    } catch (error) {
      setErrors((current) => ({ ...current, [ref]: diningErrorMessage(error) }));
      // Someone else may have moved it; resync.
      void refresh();
    } finally {
      setPending(null);
    }
  };

  const columns = OPEN_FOOD_ORDER_STATUSES.map((status) => ({
    status,
    orders: orders
      .filter((order) => order.status === status)
      .sort((left, right) => Date.parse(left.placedAt) - Date.parse(right.placedAt)),
  }));
  const closedCount = orders.filter(
    (order) => order.status === 'DELIVERED' || order.status === 'CANCELLED',
  ).length;

  return (
    <div className="space-y-4">
      <Panel className="flex flex-wrap items-end justify-between gap-3 p-4">
        <Field label="Venue" htmlFor="kitchen-venue" className="min-w-[14rem]">
          <Select
            id="kitchen-venue"
            value={venueCode}
            onChange={(event) => {
              const next = event.target.value;
              router.replace(
                next
                  ? `/admin/dining/kitchen?venueCode=${encodeURIComponent(next)}`
                  : '/admin/dining/kitchen',
                { scroll: false },
              );
            }}
          >
            <option value="">All delivery venues</option>
            {venues.map((venue) => (
              <option key={venue.code} value={venue.code}>
                {venue.name} ({venue.code})
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center gap-3">
          <p className="text-[11.5px] text-mist" role="status" aria-live="polite">
            {refreshing
              ? 'Refreshing…'
              : refreshedAt
                ? `Updated ${dhakaClock(refreshedAt)} Dhaka · auto every ${KITCHEN_REFRESH_MS / 1000}s`
                : `Auto-refresh every ${KITCHEN_REFRESH_MS / 1000}s`}
          </p>
          <Button variant="secondary" size="sm" loading={refreshing} onClick={() => void refresh()}>
            <RefreshCw aria-hidden className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </Panel>

      {loadError ? <ErrorState title="Kitchen queue unavailable" message={loadError} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <section
            key={column.status}
            aria-labelledby={`kitchen-${column.status}`}
            className="panel flex flex-col p-3"
          >
            <header className="flex items-center justify-between gap-2 border-b border-line px-1 pb-2">
              <h2 id={`kitchen-${column.status}`} className="flex items-center gap-2 text-[15px]">
                <Badge tone={foodOrderStatusTone(column.status)}>
                  {FOOD_ORDER_STATUS_LABELS[column.status]}
                </Badge>
                <span className="font-mono text-[12px] text-mist">{column.orders.length}</span>
              </h2>
              <span className="text-[11px] text-mist">{COLUMN_HINTS[column.status]}</span>
            </header>

            {column.orders.length === 0 ? (
              <p className="px-1 py-6 text-center text-[12px] text-mist">Nothing here.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {column.orders.map((order) => {
                  const next = nextKitchenStatus(order.status);
                  const busy = pending === order.publicRef;
                  const advanceTo =
                    next && next !== 'PLACED' ? (next as Exclude<FoodOrderStatus, 'PLACED'>) : null;
                  return (
                    <li key={order.id} className="rounded-xl border border-line bg-abyss/40 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[11px] text-sea">{order.publicRef}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-foam">
                            <Umbrella aria-hidden className="h-3.5 w-3.5 text-sand" />
                            {order.delivery.sunbedCode}
                            <span className="text-mist">· {order.delivery.beachPointName}</span>
                          </p>
                        </div>
                        <p className="text-right text-[11px] text-mist">
                          {formatIsoDate(order.placedAt)}
                          <br />
                          <span className="font-mono text-foam">{dhakaClock(order.placedAt)}</span>
                        </p>
                      </div>
                      <ul className="mt-2 space-y-0.5 text-[12.5px]">
                        {order.lines.map((line) => (
                          <li key={line.id} className="flex justify-between gap-2">
                            <span className="text-foam">
                              <span className="font-mono text-sand">{line.quantity}×</span>{' '}
                              {line.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {order.note ? (
                        <p className="mt-1.5 text-[11.5px] italic text-mist">“{order.note}”</p>
                      ) : null}
                      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-mist">
                        {order.venue.name} · {order.tourist.name} ·{' '}
                        <span className="font-mono text-foam">{formatMoney(order.totalMinor)}</span>
                        <Badge tone="warn">Simulated</Badge>
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {advanceTo ? (
                          <Button
                            size="sm"
                            loading={busy}
                            disabled={busy}
                            onClick={() => setStatus(order, advanceTo)}
                          >
                            {FOOD_ORDER_ADVANCE_LABELS[advanceTo] ??
                              FOOD_ORDER_STATUS_LABELS[advanceTo]}
                            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                        {canKitchenCancel(order.status) ? (
                          <DiningCancelControl
                            label="Cancel"
                            confirmLabel="Cancel & refund"
                            pending={busy}
                            disabled={busy}
                            onConfirm={(reason) => setStatus(order, 'CANCELLED', reason)}
                          />
                        ) : null}
                      </div>
                      {errors[order.publicRef] ? (
                        <AdminNotice tone="danger" className="mt-2">
                          {errors[order.publicRef]}
                        </AdminNotice>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}
      </div>

      <p className="text-[11.5px] text-mist">
        {closedCount > 0
          ? `${closedCount} delivered or cancelled orders in this list are hidden from the queue. `
          : ''}
        Food prices are indicative demo prices; payments and refunds are mock transactions.
      </p>
    </div>
  );
}
