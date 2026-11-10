'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminOrderDto, BeachPointSummary, OrderStatus } from '@coastline/api-contracts';
import {
  CalendarClock,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ScanLine,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import { AdminNotice, DetailList } from '@/components/admin/feedback';
import {
  checkedInSummary,
  detailMessages,
  displayPhase,
  errorMessage,
  itemIdsFrom,
  itemStatusTone,
  itemWindowGroups,
  itemWindowLabel,
  orderStatusTone,
  phaseTone,
} from '@/components/admin/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/field';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { ApiError, clientApi } from '@/lib/api';
import { formatDateKey, formatDateTime, formatMoney } from '@/lib/format';

const REF_PATTERN = /^BK-\d{8}-[A-Z2-7]{4}$/;

interface Filters {
  date: string;
  pointCode: string;
  status: OrderStatus | '';
  ref: string;
}

type Notice = {
  tone: 'success' | 'danger';
  title: string;
  message: string;
  details: string[];
};

function OrderCard({ order }: { order: AdminOrderDto }) {
  const router = useRouter();
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const summary = checkedInSummary(order);
  const phase = displayPhase(order);
  const windows = itemWindowGroups(order.items);
  const pointLabels = [
    ...new Set(order.items.map((item) => `${item.beachPointCode} · ${item.beachPointName}`)),
  ];

  const mutate = async (label: string, body: unknown) => {
    setBusy(label);
    setNotice(null);
    try {
      const updated = await clientApi<AdminOrderDto>(
        `/admin/orders/${encodeURIComponent(order.publicRef)}/${label === 'cancel' ? 'cancel' : 'check-in'}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
      router.refresh();
      return updated;
    } catch (error) {
      const api = error instanceof ApiError ? error : null;
      const details = api ? detailMessages(api.details) : [];
      const blockedIds = api ? itemIdsFrom(api.details) : [];
      const blockedCodes = blockedIds
        .map((id) => order.items.find((item) => item.id === id)?.sunbedCode)
        .filter((code): code is string => Boolean(code));
      if (blockedCodes.length > 0) {
        details.unshift(`Outside the check-in window: ${blockedCodes.join(', ')}`);
      }
      setNotice({
        tone: 'danger',
        title: label === 'cancel' ? 'Cancellation refused.' : 'Check-in refused.',
        message: errorMessage(error),
        details,
      });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const checkInAll = async () => {
    const updated = await mutate('all', {});
    if (!updated) return;
    const checked = updated.items.filter((item) => item.status === 'CHECKED_IN').length;
    const total = updated.items.filter((item) => item.status !== 'CANCELLED').length;
    toast.push(`Check-in recorded for ${order.publicRef}.`, 'success');
    setNotice({
      tone: 'success',
      title: 'Check-in recorded.',
      message: `${checked} of ${total} beds are checked in.`,
      details: [],
    });
  };

  const checkInItem = async (itemId: string, sunbedCode: string) => {
    const updated = await mutate(`item:${itemId}`, { itemIds: [itemId] });
    if (!updated) return;
    toast.push(`${sunbedCode} checked in.`, 'success');
    setNotice({
      tone: 'success',
      title: 'Check-in recorded.',
      message: `${sunbedCode} is checked in.`,
      details: [],
    });
  };

  const cancelOrder = async () => {
    const updated = await mutate('cancel', reason.trim() ? { reason: reason.trim() } : {});
    if (!updated) return;
    setCancelling(false);
    setReason('');
    toast.push(`${order.publicRef} cancelled.`, 'success');
    setNotice({
      tone: 'success',
      title: 'Booking cancelled.',
      message:
        'The beds are released and the mock refund is recorded. This action is audit-logged.',
      details: [],
    });
  };

  return (
    <article className="panel overflow-hidden">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-mono text-[13px] tracking-[0.05em] text-foam">
                {order.publicRef}
              </h3>
              <Badge tone={orderStatusTone(order.status)}>
                {order.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
              </Badge>
              <Badge tone={phaseTone(phase)}>{phase}</Badge>
              {summary.reservable > 0 ? (
                <Badge tone={summary.checkedIn === summary.reservable ? 'success' : 'neutral'}>
                  {summary.checkedIn}/{summary.reservable} checked in
                </Badge>
              ) : null}
            </div>
            <p className="mt-1.5 truncate text-[12.5px] text-foam">
              {order.tourist.name}
              {order.tourist.email ? (
                <span className="text-mist"> · {order.tourist.email}</span>
              ) : null}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[16px] tabular-nums text-foam">
              {formatMoney(order.totalMinor)}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist">
              Mock · {order.currency}
            </p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <p className="label">Point</p>
            {pointLabels.map((label) => (
              <p key={label} className="mt-1 text-[12px] text-foam">
                {label}
              </p>
            ))}
          </div>
          <div>
            <p className="label">Dhaka window</p>
            {windows.map((group) => (
              <p key={group.window} className="mt-1 font-mono text-[11.5px] tabular-nums text-foam">
                <span className="text-mist">{group.codes.join(', ')}</span>
                <span aria-hidden className="mx-1.5 text-mist/50">
                  ·
                </span>
                {group.window}
              </p>
            ))}
          </div>
        </div>

        {notice ? (
          <AdminNotice tone={notice.tone} title={notice.title} className="mt-3">
            {notice.message}
            <DetailList items={notice.details} />
          </AdminNotice>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {order.status === 'CONFIRMED' && summary.reserved > 0 ? (
            <Button onClick={checkInAll} loading={busy === 'all'} disabled={busy !== null}>
              Check in all
              <span className="font-mono text-[10px] opacity-70">({summary.reserved})</span>
            </Button>
          ) : null}
          <Button
            variant="secondary"
            aria-expanded={expanded}
            aria-controls={`order-details-${order.publicRef}`}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? (
              <>
                <ChevronUp aria-hidden className="h-4 w-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown aria-hidden className="h-4 w-4" />
                View details
              </>
            )}
          </Button>
          {order.status === 'CONFIRMED' && !cancelling ? (
            <Button variant="danger" onClick={() => setCancelling(true)} disabled={busy !== null}>
              Cancel
            </Button>
          ) : null}
        </div>

        {cancelling ? (
          <div className="mt-3 rounded-xl border border-danger/30 bg-danger/5 p-3">
            <Field
              label="Cancellation reason"
              htmlFor={`cancel-${order.publicRef}`}
              hint="Optional, up to 500 characters. The mock refund is recorded for the full total."
            >
              <Textarea
                id={`cancel-${order.publicRef}`}
                rows={2}
                maxLength={500}
                value={reason}
                placeholder="e.g. guest called to cancel"
                onChange={(event) => setReason(event.target.value)}
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="danger"
                onClick={cancelOrder}
                loading={busy === 'cancel'}
                disabled={busy !== null}
              >
                Confirm cancellation
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setCancelling(false);
                  setReason('');
                }}
                disabled={busy === 'cancel'}
              >
                <X aria-hidden className="h-4 w-4" />
                Keep booking
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div
          id={`order-details-${order.publicRef}`}
          className="border-t border-line bg-abyss/35 p-4"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0">
              <p className="label">Beds</p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-line text-mist">
                      <th
                        scope="col"
                        className="py-2 pr-3 font-mono text-[9px] uppercase tracking-[0.12em]"
                      >
                        Bed
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]"
                      >
                        Window
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]"
                      >
                        Bed state
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em]"
                      >
                        Checked in
                      </th>
                      <th
                        scope="col"
                        className="py-2 pl-3 text-right font-mono text-[9px] uppercase tracking-[0.12em]"
                      >
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-line/60 last:border-0">
                        <td className="whitespace-nowrap py-2 pr-3 font-mono text-[11px] text-foam">
                          {item.sunbedCode}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] tabular-nums text-mist">
                          {itemWindowLabel(item.startAt, item.endAt)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={itemStatusTone(item.status)}>
                            {item.status === 'CHECKED_IN'
                              ? 'Checked in'
                              : item.status === 'RESERVED'
                                ? 'Reserved'
                                : 'Cancelled'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-[10.5px] tabular-nums text-mist">
                          {item.checkedInAt ? formatDateTime(item.checkedInAt) : '—'}
                        </td>
                        <td className="py-2 pl-3 text-right">
                          {order.status === 'CONFIRMED' && item.status === 'RESERVED' ? (
                            <Button
                              size="sm"
                              className="min-h-11"
                              onClick={() => checkInItem(item.id, item.sunbedCode)}
                              loading={busy === `item:${item.id}`}
                              disabled={busy !== null}
                            >
                              Check in bed
                            </Button>
                          ) : (
                            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist">
                              {item.phase}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {order.status === 'CONFIRMED' ? (
                <p className="mt-2 text-[11px] leading-relaxed text-mist">
                  Check-in opens 60 minutes before a booking starts and closes when it ends. The API
                  returns a 422 for beds outside that window.
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <p className="label">Ticket</p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-foam">
                  <Ticket aria-hidden className="h-3.5 w-3.5 text-sand" />
                  {order.ticket?.code ?? 'No active ticket'}
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                  {order.ticket
                    ? 'QR payload issued to the guest; verify it in the ticket validator.'
                    : 'Cancelled orders have no usable ticket.'}
                </p>
              </div>
              <div>
                <p className="label">Simulated ledger</p>
                <ul className="mt-1 space-y-1">
                  {order.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-baseline justify-between gap-2 font-mono text-[10.5px] tabular-nums"
                    >
                      <span className="text-mist">
                        {payment.type} · {payment.provider}
                      </span>
                      <span className={payment.type === 'REFUND' ? 'text-warn' : 'text-foam'}>
                        {formatMoney(payment.amountMinor)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label">Timeline</p>
                <p className="mt-1 text-[11px] leading-relaxed text-mist">
                  Placed {formatDateTime(order.placedAt)}
                </p>
                {order.cancelledAt ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-mist">
                    Cancelled {formatDateTime(order.cancelledAt)}
                    {order.cancelReason ? ` · ${order.cancelReason}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function TicketValidator() {
  const router = useRouter();
  const toast = useToast();
  const [payload, setPayload] = useState('');
  const [reference, setReference] = useState('');
  const [result, setResult] = useState<AdminOrderDto | null>(null);
  const [error, setError] = useState<{ message: string; details: string[] } | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const validate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    const trimmed = payload.trim();
    if (!trimmed) {
      setError({ message: 'Paste the full ticket payload first.', details: [] });
      return;
    }

    setPending(true);
    try {
      const order = await clientApi<AdminOrderDto>('/admin/tickets/validate', {
        method: 'POST',
        body: JSON.stringify({ payload: trimmed }),
      });
      setResult(order);
      toast.push(`Ticket verified for ${order.publicRef}.`, 'success');
    } catch (caught) {
      setError({
        message: errorMessage(caught),
        details: caught instanceof ApiError ? detailMessages(caught.details) : [],
      });
    } finally {
      setPending(false);
    }
  };

  const checkInValidated = async () => {
    if (!result) return;
    setCheckingIn(true);
    setError(null);
    try {
      const updated = await clientApi<AdminOrderDto>(
        `/admin/orders/${encodeURIComponent(result.publicRef)}/check-in`,
        { method: 'POST', body: '{}' },
      );
      setResult(updated);
      toast.push(`Check-in recorded for ${updated.publicRef}.`, 'success');
      router.refresh();
    } catch (caught) {
      setError({
        message: errorMessage(caught),
        details: caught instanceof ApiError ? detailMessages(caught.details) : [],
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const findReference = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reference.trim().toUpperCase();
    if (!REF_PATTERN.test(trimmed)) {
      setError({ message: 'References look like BK-YYYYMMDD-XXXX.', details: [] });
      return;
    }
    router.push(`/admin/bookings?ref=${encodeURIComponent(trimmed)}`, { scroll: false });
  };

  const summary = result ? checkedInSummary(result) : null;

  return (
    <Panel id="ticket-validator" className="scroll-mt-28 p-4">
      <PanelHeader
        eyebrow="Gate"
        title="Ticket validator"
        right={<ScanLine aria-hidden className="h-4 w-4 text-coral" />}
      />
      <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
        Paste the QR payload from the guest&rsquo;s ticket. The signature is verified server-side;
        an edited payload is rejected.
      </p>

      <form onSubmit={validate} className="mt-3 space-y-3">
        <Field
          label="QR payload"
          htmlFor="ticket-payload"
          hint="Format: COASTLINE:<ref>:<signature>"
        >
          <Textarea
            id="ticket-payload"
            rows={3}
            value={payload}
            spellCheck={false}
            autoComplete="off"
            placeholder="COASTLINE:BK-20261022-ABCD:…"
            className="break-all font-mono text-[11px]"
            onChange={(event) => {
              setPayload(event.target.value);
              setResult(null);
              setError(null);
            }}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={pending}>
            <Search aria-hidden className="h-4 w-4" />
            Validate ticket
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setPayload('');
              setResult(null);
              setError(null);
            }}
            disabled={pending}
          >
            Clear
          </Button>
        </div>
      </form>

      {error ? (
        <AdminNotice tone="danger" title="Ticket not verified." className="mt-3">
          {error.message}
          <DetailList items={error.details} />
        </AdminNotice>
      ) : null}

      {result && summary ? (
        <div
          className="mt-3 rounded-xl border border-success/30 bg-success/5 p-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <CheckBadge />
            <span className="font-mono text-[11.5px] text-foam">{result.publicRef}</span>
            <Badge tone={orderStatusTone(result.status)}>
              {result.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
            </Badge>
          </div>
          <p className="mt-1 text-[12px] text-foam">{result.tourist.name}</p>
          <p className="mt-0.5 font-mono text-[10.5px] text-mist">
            {result.items.map((item) => item.sunbedCode).join(', ')} ·{' '}
            {itemWindowGroups(result.items)
              .map((group) => group.window)
              .join(' · ')}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-mist">
            {summary.checkedIn}/{summary.reservable} checked in
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.status === 'CONFIRMED' && summary.reserved > 0 ? (
              <Button
                size="sm"
                className="min-h-11"
                onClick={checkInValidated}
                loading={checkingIn}
              >
                Check in all reserved
              </Button>
            ) : null}
            <Link
              href={`/admin/bookings?ref=${encodeURIComponent(result.publicRef)}`}
              className={buttonClass('ghost', 'sm', 'min-h-11')}
              scroll={false}
            >
              Open in list
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-4 border-t border-line pt-3">
        <form onSubmit={findReference} className="space-y-2">
          <Field
            label="Reference lookup"
            htmlFor="ticket-reference"
            hint="Exact reference only; it opens the order without a signature."
          >
            <Input
              id="ticket-reference"
              value={reference}
              maxLength={64}
              autoComplete="off"
              placeholder="BK-20261022-ABCD"
              className="font-mono uppercase tracking-[0.06em]"
              onChange={(event) => {
                setReference(event.target.value.toUpperCase());
                setError(null);
              }}
            />
          </Field>
          <Button type="submit" variant="secondary">
            <Search aria-hidden className="h-4 w-4" />
            Find booking
          </Button>
        </form>
      </div>
    </Panel>
  );
}

function CheckBadge() {
  return (
    <span
      aria-hidden
      className="grid h-5 w-5 place-items-center rounded-full border border-success/40 bg-success/15 text-success"
    >
      <Check className="h-3 w-3" />
    </span>
  );
}

export function BookingsManager({
  orders,
  points,
  date,
  pointCode,
  status,
  ref,
  today,
  dates,
}: {
  orders: AdminOrderDto[];
  points: BeachPointSummary[];
  date: string;
  pointCode: string;
  status: OrderStatus | '';
  ref: string;
  today: string;
  dates: string[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Filters>({ date, pointCode, status, ref });
  const [refError, setRefError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDraft({ date, pointCode, status, ref });
    setRefError(null);
  }, [date, pointCode, status, ref]);

  const apply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextRef = draft.ref.trim().toUpperCase();
    if (nextRef && !REF_PATTERN.test(nextRef)) {
      setRefError('References look like BK-YYYYMMDD-XXXX.');
      return;
    }
    setRefError(null);

    const params = new URLSearchParams({ date: draft.date });
    if (draft.pointCode) params.set('pointCode', draft.pointCode);
    if (draft.status) params.set('status', draft.status);
    if (nextRef) params.set('ref', nextRef);

    startTransition(() => {
      router.push(`/admin/bookings?${params.toString()}`, { scroll: false });
    });
  };

  const filterLabels = [
    pointCode ? `point ${pointCode}` : null,
    status ? status.toLowerCase() : null,
    ref ? `ref ${ref}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <Panel className="p-4">
        <form onSubmit={apply} aria-busy={pending}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto] xl:items-end">
            <Field label="Dhaka date" htmlFor="booking-date" hint="Today + 7 days.">
              <Select
                id="booking-date"
                value={draft.date}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, date: event.target.value }))
                }
              >
                {dates.map((day) => (
                  <option key={day} value={day}>
                    {formatDateKey(day)}
                    {day === today ? ' · today' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Beach point" htmlFor="booking-point">
              <Select
                id="booking-point"
                value={draft.pointCode}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, pointCode: event.target.value }))
                }
              >
                <option value="">All points</option>
                {points.map((point) => (
                  <option key={point.id} value={point.code}>
                    {point.code} · {point.name}
                    {point.isActive ? '' : ' (inactive)'}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Order status" htmlFor="booking-status">
              <Select
                id="booking-status"
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as OrderStatus | '',
                  }))
                }
              >
                <option value="">All statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </Field>
            <Field
              label="Reference"
              htmlFor="booking-ref"
              error={refError ?? undefined}
              hint={ref ? 'Exact lookup ignores date and status.' : 'Exact booking ref.'}
            >
              <Input
                id="booking-ref"
                value={draft.ref}
                maxLength={64}
                autoComplete="off"
                placeholder="BK-20261022-ABCD"
                className="font-mono uppercase tracking-[0.06em]"
                onChange={(event) => {
                  setDraft((current) => ({ ...current, ref: event.target.value.toUpperCase() }));
                  setRefError(null);
                }}
              />
            </Field>
            <div className="flex items-center gap-2 xl:pb-0.5">
              <Button type="submit" loading={pending}>
                Apply filters
              </Button>
              <Link href="/admin/bookings" scroll={false} className={buttonClass('ghost', 'md')}>
                Reset
              </Link>
            </div>
          </div>
          <span role="status" aria-live="polite" className="sr-only">
            {pending ? 'Applying filters' : ''}
          </span>
        </form>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <aside className="order-first space-y-4 xl:order-last">
          <TicketValidator />
          <Panel className="p-4">
            <p className="label flex items-center gap-1.5">
              <Info aria-hidden className="h-3 w-3 text-sea" />
              Desk rules
            </p>
            <ul className="mt-2 space-y-1.5 text-[11.5px] leading-relaxed text-mist">
              <li>Check-in opens 60 minutes before start and closes at the booking end.</li>
              <li>Only reserved beds can be checked in; cancelled beds are refused.</li>
              <li>Admin cancellations bypass the tourist cutoff and refund the mock total.</li>
              <li>No walk-in booking flow exists in this MVP; guests book from the map.</li>
            </ul>
            <p className="mt-3 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-coral">
              <CalendarClock aria-hidden className="h-3 w-3" />
              All times Dhaka · demo data
            </p>
          </Panel>
        </aside>

        <div className="order-last min-w-0 space-y-3 xl:order-first">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="label">Arrivals</p>
              <h2 className="mt-1 text-[20px]">
                {orders.length} order{orders.length === 1 ? '' : 's'}
                <span className="ml-2 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-mist">
                  {formatDateKey(date)}
                  {filterLabels.length > 0 ? ` · ${filterLabels.join(' · ')}` : ''}
                </span>
              </h2>
            </div>
            {ref ? <Badge tone="sea">Exact reference lookup</Badge> : null}
          </div>

          {ref ? (
            <AdminNotice tone="info" title="Reference search.">
              Date, point and status filters are ignored while a reference is supplied; the API
              returns the exact booking if it exists.
            </AdminNotice>
          ) : null}

          {orders.length === 0 ? (
            <EmptyState
              title={ref ? 'No booking with that reference' : 'No bookings for these filters'}
              body={
                ref
                  ? 'Check the reference in the guest ticket, or clear the reference to browse the date.'
                  : 'Try another date, point or status. New bookings appear here as soon as they are paid in the demo.'
              }
            />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
