'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, Info, Users } from 'lucide-react';
import type {
  DiningVenueDetail,
  ReservationDto,
  SessionUser,
  TableAvailabilityDto,
} from '@coastline/api-contracts';
import { MAX_RESERVATION_HOURS } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { dateStrip } from '@/lib/booking';
import { cn } from '@/lib/cn';
import { dhakaDateKey, formatLongDateKey, formatMoney } from '@/lib/format';
import {
  describeReservationConflict,
  maxConsecutiveHours,
  reservationHref,
  reservationWindowLabel,
} from '@/lib/dining/reservations';
import { DateStrip } from '@/components/booking/date-strip';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { ErrorState, InlineSpinner, Skeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';

export interface ReservationPanelProps {
  venue: DiningVenueDetail;
  /** Null when the API could not resolve the demo persona. */
  viewer: SessionUser | null;
}

type Load =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; data: TableAvailabilityDto };

/**
 * Table reservation flow for one venue: Dhaka date → table → start hour →
 * 1–3 hours → party size → demo deposit. Availability is fetched live; the
 * API re-validates everything and owns the deposit amount.
 */
export function ReservationPanel({ venue, viewer }: ReservationPanelProps) {
  const toast = useToast();
  const [today] = useState(() => dhakaDateKey());
  const days = useMemo(() => dateStrip(today, 8), [today]);
  const [date, setDate] = useState(today);
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);
  const [tableId, setTableId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [hours, setHours] = useState(1);
  const [partySize, setPartySize] = useState(2);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ReservationDto | null>(null);

  const canBook = viewer?.role === 'TOURIST';

  useEffect(() => {
    let cancelled = false;
    setLoad({ state: 'loading' });
    clientApi<TableAvailabilityDto>(
      `/dining/venues/${encodeURIComponent(venue.code)}/availability?date=${date}`,
    )
      .then((data) => {
        if (!cancelled) setLoad({ state: 'ready', data });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setLoad({
          state: 'error',
          message:
            caught instanceof ApiError
              ? caught.message
              : 'The booking API is offline. Start the API on port 3001, then try again.',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [venue.code, date, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const data = load.state === 'ready' ? load.data : null;
  const table = data?.tables.find((t) => t.id === tableId) ?? null;
  const maxHours = table && startsAt ? maxConsecutiveHours(table, startsAt) : 0;

  // Keep the selection valid when availability or the table changes.
  useEffect(() => {
    if (!data) return;
    if (tableId && !data.tables.some((t) => t.id === tableId)) {
      setTableId(null);
      setStartsAt(null);
    }
  }, [data, tableId]);
  useEffect(() => {
    if (startsAt && maxHours === 0) setStartsAt(null);
    else if (maxHours > 0 && hours > maxHours) setHours(maxHours);
  }, [startsAt, maxHours, hours]);
  useEffect(() => {
    if (table && partySize > table.seats) setPartySize(table.seats);
  }, [table, partySize]);

  function chooseDate(key: string) {
    setDate(key);
    setStartsAt(null);
    setError(null);
  }

  function chooseTable(id: string) {
    setTableId(id);
    setStartsAt(null);
    setError(null);
  }

  async function submit() {
    if (!table || !startsAt || maxHours === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const reservation = await clientApi<ReservationDto>('/dining/reservations', {
        method: 'POST',
        body: JSON.stringify({
          tableId: table.id,
          startsAt,
          hours,
          partySize,
          note: note.trim() || undefined,
          paymentMethod: 'MOCK',
        }),
      });
      setCreated(reservation);
      toast.push(`Table reserved · ${reservation.publicRef}`, 'success');
      reload();
    } catch (caught) {
      if (caught instanceof ApiError) {
        const conflict = caught.status === 409 ? describeReservationConflict(caught.details) : null;
        setError(conflict ?? caught.message);
        if (caught.status === 409) {
          setStartsAt(null);
          reload();
        }
      } else {
        setError('The booking API is offline. Start the API on port 3001, then try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const depositMinor = data?.depositMinor ?? venue.reservationDepositMinor;

  if (created) {
    return (
      <Panel className="p-4 sm:p-5" aria-live="polite">
        <div className="flex gap-3">
          <CircleCheck aria-hidden className="mt-0.5 h-5 w-5 flex-none text-success" />
          <div className="min-w-0">
            <p className="label">Table reserved</p>
            <p className="mt-1 break-all font-mono text-[18px] text-foam">{created.publicRef}</p>
            <p className="mt-1 text-[12px] text-mist">
              {created.venue.name} · Table {created.table.code} · {reservationWindowLabel(created)}{' '}
              · {created.partySize} {created.partySize === 1 ? 'guest' : 'guests'}
            </p>
            {created.depositMinor > 0 ? (
              <p className="mt-2 text-[11.5px] text-mist">
                Demo deposit of {formatMoney(created.depositMinor)} recorded · simulated payment, no
                real money moved.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`${reservationHref(created.publicRef)}?new=1`}
            className={buttonClass('primary', 'md')}
          >
            View reservation
          </Link>
          <Button
            variant="secondary"
            onClick={() => {
              setCreated(null);
              setStartsAt(null);
              setNote('');
            }}
          >
            Reserve another table
          </Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Reserve a table</p>
          <h2 className="mt-1 text-[19px]">Book by the hour</h2>
        </div>
        <Badge tone="sand">Demo deposit</Badge>
      </div>

      {!canBook ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-sand/30 bg-sand/5 px-3 py-2.5">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sand" />
          <p className="text-[11.5px] leading-relaxed text-mist">
            {viewer
              ? 'You are viewing as admin. Switch to a tourist persona in the header to reserve a table.'
              : 'Pick a tourist persona in the header to reserve a table. You can still browse free hours.'}
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        <DateStrip days={days} selected={date} onSelect={chooseDate} label="Choose a date" />
      </div>

      <div className="mt-5">
        {load.state === 'loading' ? (
          <div className="space-y-2">
            <InlineSpinner label="Loading tables" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : load.state === 'error' ? (
          <ErrorState title="Could not load tables" message={load.message} onRetry={reload} />
        ) : load.data.tables.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong/60 px-4 py-5 text-[12px] text-mist">
            No tables are open for reservations here right now.
          </p>
        ) : (
          <div className="space-y-5">
            <fieldset>
              <legend className="label mb-1.5">Table</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {load.data.tables.map((t) => {
                  const free = t.slots.filter((s) => s.available).length;
                  const active = t.id === tableId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => chooseTable(t.id)}
                      className={cn(
                        'flex min-h-14 flex-col items-start justify-center rounded-lg border px-3 py-2 text-left transition-colors',
                        active
                          ? 'border-sea bg-sea/15 text-foam'
                          : 'border-line bg-abyss/45 text-mist hover:border-sea/45 hover:text-foam',
                      )}
                    >
                      <span className="font-mono text-[12px] text-foam">{t.code}</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[11px]">
                        <Users aria-hidden className="h-3 w-3" />
                        {t.seats} seats · {free} free {free === 1 ? 'hour' : 'hours'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {table ? (
              <fieldset>
                <legend className="label mb-1.5">
                  Start time · {formatLongDateKey(load.data.date)} · Dhaka
                </legend>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {table.slots.map((slot) => {
                    const active = slot.startsAt === startsAt;
                    const inWindow =
                      startsAt !== null &&
                      Date.parse(slot.startsAt) >= Date.parse(startsAt) &&
                      Date.parse(slot.startsAt) < Date.parse(startsAt) + hours * 3_600_000;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        disabled={!slot.available}
                        aria-pressed={active}
                        aria-label={`${slot.label}${slot.available ? '' : ' (unavailable)'}`}
                        onClick={() => {
                          setStartsAt(slot.startsAt);
                          setError(null);
                        }}
                        className={cn(
                          'h-10 rounded-lg border font-mono text-[11.5px] transition-colors',
                          !slot.available
                            ? 'cursor-not-allowed border-line/50 bg-abyss/20 text-mist/40 line-through'
                            : active
                              ? 'border-sea bg-sea text-abyss'
                              : inWindow
                                ? 'border-sea/60 bg-sea/20 text-foam'
                                : 'border-line bg-abyss/45 text-foam hover:border-sea/45',
                        )}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10.5px] text-mist">
                  Struck-through hours are taken or already started.
                </p>
              </fieldset>
            ) : (
              <p className="text-[12px] text-mist">Choose a table to see its free hours.</p>
            )}

            {table && startsAt ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset>
                  <legend className="label mb-1.5">Duration</legend>
                  <div className="flex gap-1.5">
                    {Array.from({ length: MAX_RESERVATION_HOURS }, (_, i) => i + 1).map((h) => (
                      <button
                        key={h}
                        type="button"
                        disabled={h > maxHours}
                        aria-pressed={h === hours}
                        onClick={() => setHours(h)}
                        className={cn(
                          'h-11 flex-1 rounded-lg border text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                          h === hours
                            ? 'border-sea bg-sea text-abyss'
                            : 'border-line bg-abyss/45 text-foam hover:border-sea/45',
                        )}
                      >
                        {h} {h === 1 ? 'hour' : 'hours'}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <Field label="Party size" htmlFor="reservation-party">
                  <Select
                    id="reservation-party"
                    value={partySize}
                    onChange={(event) => setPartySize(Number(event.target.value))}
                  >
                    {Array.from({ length: table.seats }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'guest' : 'guests'}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Note (optional)"
                  htmlFor="reservation-note"
                  hint="Allergies, a high chair, a birthday…"
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="reservation-note"
                    value={note}
                    maxLength={500}
                    rows={2}
                    className="min-h-16"
                    onChange={(event) => setNote(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-line bg-abyss/40 px-3 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="label">Demo deposit · simulated payment</p>
          <p className="font-mono text-[15px] text-foam">
            {depositMinor > 0 ? formatMoney(depositMinor) : 'None'}
          </p>
        </div>
        <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
          {depositMinor > 0
            ? 'Taken by the mock provider when you reserve and refunded in full if you cancel at least 60 minutes before the start. No real money moves.'
            : 'This venue asks no deposit. Cancel up to 60 minutes before the start.'}
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-[11.5px] leading-relaxed text-danger"
        >
          {error}
        </p>
      ) : null}

      <Button
        className="mt-4 w-full"
        size="lg"
        loading={submitting}
        disabled={!canBook || !table || !startsAt || maxHours === 0}
        onClick={submit}
      >
        {startsAt && table
          ? `Reserve ${table.code} · ${hours} ${hours === 1 ? 'hour' : 'hours'}`
          : 'Reserve table'}
      </Button>
    </Panel>
  );
}
