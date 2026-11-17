'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';
import type {
  DiningVenueDetail,
  TableAvailability,
  TableAvailabilityDto,
} from '@coastline/api-contracts';
import {
  MAX_RESERVATION_ADVANCE_DAYS,
  MAX_RESERVATION_HOURS,
  RESERVATION_CANCEL_CUTOFF_MINUTES,
} from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { saveDraft } from '@/lib/checkout';
import { maxConsecutiveHours } from '@/lib/dining/reservations';
import { formatDateKey, formatIsoTime, formatMoney, formatTimeRange } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ChoiceGroup, Stepper } from '@/components/ui/display';
import { Field, TextArea } from '@/components/ui/field';
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/states';
import { useSession } from '@/components/patterns/session';
import { DateStrip, FlowShell } from '@/components/patterns/flow';
import { OrderSummary } from '@/components/patterns/order-summary';

const STEPS = ['Date and party', 'Pick a time'];

type Load =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; data: TableAvailabilityDto };

/** Smallest table that seats the party and is free for the whole window. */
function bestTable(
  tables: TableAvailability[],
  startsAt: string,
  hours: number,
  party: number,
): TableAvailability | null {
  return (
    tables
      .filter((table) => table.seats >= party && maxConsecutiveHours(table, startsAt) >= hours)
      .sort((a, b) => a.seats - b.seats)[0] ?? null
  );
}

export function TableFlow({
  venue,
  today,
  backHref,
}: {
  venue: DiningVenueDetail;
  today: string;
  backHref: string;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(today);
  const [party, setParty] = useState(2);
  const [hours, setHours] = useState(1);
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [reload, setReload] = useState(0);
  const [nowMs, setNowMs] = useState(0);
  const canBook = user?.role === 'TOURIST';

  useEffect(() => setNowMs(Date.now()), [load]);

  useEffect(() => {
    let cancelled = false;
    setLoad({ state: 'loading' });
    clientApi<TableAvailabilityDto>(
      `/dining/venues/${encodeURIComponent(venue.code)}/availability?date=${date}`,
    )
      .then((data) => !cancelled && setLoad({ state: 'ready', data }))
      .catch((error: unknown) => {
        if (!cancelled)
          setLoad({
            state: 'error',
            message: error instanceof ApiError ? error.message : 'Tables could not be loaded.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [venue.code, date, reload]);

  const data = load.state === 'ready' ? load.data : null;
  const maxSeats = data ? Math.max(1, ...data.tables.map((table) => table.seats)) : 12;

  const times = useMemo(() => {
    if (!data || data.tables.length === 0) return [];
    const starts = data.tables[0].slots.map((slot) => slot.startsAt);
    return starts.map((start) => {
      const past = nowMs > 0 && Date.parse(start) <= nowMs;
      const table = past ? null : bestTable(data.tables, start, hours, party);
      return { start, table };
    });
  }, [data, hours, party, nowMs]);

  useEffect(() => {
    if (startsAt && !times.some((time) => time.start === startsAt && time.table)) setStartsAt(null);
  }, [times, startsAt]);

  const chosen = times.find((time) => time.start === startsAt)?.table ?? null;
  const depositMinor = data?.depositMinor ?? venue.reservationDepositMinor;
  const endIso = startsAt ? new Date(Date.parse(startsAt) + hours * 3_600_000).toISOString() : null;
  const when = `${formatDateKey(date)}${startsAt && endIso ? ` · ${formatTimeRange(startsAt, endIso)}` : ''} · ${party} ${party === 1 ? 'guest' : 'guests'}`;
  const cancellation = `Free cancellation until ${RESERVATION_CANCEL_CUTOFF_MINUTES} minutes before your table time${depositMinor > 0 ? '; the deposit is refunded in full' : ''}.`;
  const lines =
    depositMinor > 0
      ? [
          {
            label: 'Table deposit',
            detail: 'Paid now, held by the venue',
            amountMinor: depositMinor,
          },
        ]
      : [];

  function goToCheckout() {
    if (!chosen || !startsAt) return;
    const id = saveDraft({
      service: 'food',
      title: venue.name,
      subtitle: `Table ${chosen.code} · seats ${chosen.seats}`,
      when,
      lines,
      totalMinor: depositMinor,
      currency: data?.currency ?? venue.currency,
      payNowLabel: depositMinor > 0 ? 'Deposit to pay now' : undefined,
      cancellation,
      backHref: `${backHref}/book?mode=table`,
      request: {
        kind: 'table',
        body: {
          tableId: chosen.id,
          startsAt,
          hours,
          partySize: party,
          note: note.trim() || undefined,
          paymentMethod: 'MOCK',
        },
      },
    });
    router.push(`/checkout/${id}`);
  }

  const summary = (
    <OrderSummary
      service="food"
      title={venue.name}
      subtitle={chosen ? `Table ${chosen.code}` : 'Table reservation'}
      when={when}
      lines={lines}
      totalMinor={depositMinor}
      payNowLabel="Deposit to pay now"
      cancellation={cancellation}
      emptyHint="No deposit needed. You pay at the venue."
    />
  );

  return (
    <FlowShell
      title={`Reserve at ${venue.name}`}
      step={step}
      steps={STEPS}
      onBack={() => setStep(0)}
      exitHref={backHref}
      summary={summary}
      footer={
        step === 0 ? (
          <Button
            size="lg"
            block
            onClick={() => setStep(1)}
            disabled={load.state !== 'ready' || data?.tables.length === 0}
          >
            See times
          </Button>
        ) : (
          <Button size="lg" block disabled={!canBook || !chosen} onClick={goToCheckout}>
            {chosen && startsAt ? `Continue · ${formatIsoTime(startsAt)}` : 'Pick a time'}
          </Button>
        )
      }
    >
      {!canBook ? (
        <Notice
          tone="warn"
          icon={Info}
          className="mb-5"
          title="Switch to a visitor account to book"
        >
          You are using a staff account. Open the account menu to switch.
        </Notice>
      ) : null}

      {step === 0 ? (
        <div className="space-y-6">
          <DateStrip
            today={today}
            days={MAX_RESERVATION_ADVANCE_DAYS + 1}
            value={date}
            onChange={setDate}
            label="Date"
          />
          <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface p-4">
            <div>
              <p className="text-label">Guests</p>
              <p className="text-body-sm text-muted">Largest table seats {maxSeats}</p>
            </div>
            <Stepper label="guests" value={party} min={1} max={maxSeats} onChange={setParty} />
          </div>
          <ChoiceGroup
            name="hours"
            legend="How long"
            value={hours}
            onChange={setHours}
            columns={3}
            options={Array.from({ length: MAX_RESERVATION_HOURS }, (_, index) => ({
              value: index + 1,
              label: `${index + 1} ${index === 0 ? 'hour' : 'hours'}`,
            }))}
          />
          {load.state === 'error' ? (
            <ErrorState message={load.message} onRetry={() => setReload((n) => n + 1)} />
          ) : null}
          {data && data.tables.length === 0 ? (
            <EmptyState
              title="No tables open for booking"
              body="This venue has no tables open for reservations right now."
            />
          ) : null}
        </div>
      ) : load.state === 'loading' ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4" aria-busy>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-14" />
          ))}
        </div>
      ) : load.state === 'error' ? (
        <ErrorState message={load.message} onRetry={() => setReload((n) => n + 1)} />
      ) : (
        <div className="space-y-6">
          <p className="text-body-sm text-muted">
            {formatDateKey(date)} · {party} {party === 1 ? 'guest' : 'guests'} · {hours}{' '}
            {hours === 1 ? 'hour' : 'hours'}
          </p>
          {times.some((time) => time.table) ? (
            <ChoiceGroup
              name="start"
              legend="Start time"
              value={startsAt}
              onChange={setStartsAt}
              columns={4}
              options={times.map((time) => ({
                value: time.start,
                label: formatIsoTime(time.start),
                hint: time.table ? undefined : 'Full',
                disabled: !time.table,
              }))}
            />
          ) : (
            <EmptyState
              title="No free tables for this choice"
              body="Try fewer hours, a smaller party or another day."
              action={
                <Button variant="secondary" onClick={() => setStep(0)}>
                  Change date or party
                </Button>
              }
            />
          )}
          <Field
            label="Note for the venue"
            htmlFor="table-note"
            optional
            hint="Allergies, a high chair, a birthday"
          >
            <TextArea
              id="table-note"
              value={note}
              maxLength={500}
              rows={2}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <div className="lg:hidden">{summary}</div>
          {depositMinor === 0 ? null : (
            <p className="text-body-sm text-muted">
              Deposit {formatMoney(depositMinor)} is taken at checkout.
            </p>
          )}
        </div>
      )}
    </FlowShell>
  );
}
