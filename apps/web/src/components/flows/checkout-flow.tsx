'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CircleCheck,
  CircleX,
  CreditCard,
  Info,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from 'lucide-react';
import { ApiError } from '@/lib/api';
import { describeConflictDetails } from '@/lib/booking';
import {
  PAYMENT_METHODS,
  clearDraft,
  loadDraft,
  placeDraft,
  type CheckoutDraft,
  type PaymentMethodId,
  type PlacedBooking,
} from '@/lib/checkout';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { Button, buttonClass } from '@/components/ui/button';
import { Card, DetailRows } from '@/components/ui/display';
import { EmptyState, Notice, Skeleton } from '@/components/ui/states';
import { useSession } from '@/components/patterns/session';
import { FlowShell } from '@/components/patterns/flow';
import { OrderSummary } from '@/components/patterns/order-summary';
import { useOnline } from '@/components/patterns/visitor-nav';

type Phase = 'review' | 'contact' | 'pay' | 'gateway' | 'done';

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      const conflict = describeConflictDetails(error.details);
      return conflict
        ? `Someone booked ${conflict} a moment ago. Go back and pick another option.`
        : `${error.message} Go back and pick another option.`;
    }
    return error.message;
  }
  return 'We could not reach Coastline. Nothing was charged. Check your connection and try again.';
}

export function CheckoutFlow({ draftId }: { draftId: string }) {
  const { user } = useSession();
  const online = useOnline();
  const [draft, setDraft] = useState<CheckoutDraft | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>('review');
  const [method, setMethod] = useState<PaymentMethodId>('BKASH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [placed, setPlaced] = useState<PlacedBooking | null>(null);

  useEffect(() => setDraft(loadDraft(draftId)), [draftId]);

  if (draft === undefined) {
    return (
      <div className="page max-w-[640px] space-y-4 py-8" aria-busy>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (draft === null && !placed) {
    return (
      <div className="page max-w-[640px] py-10">
        <EmptyState
          title="This checkout has expired"
          body="Checkouts last while this tab is open. Start the booking again; nothing was charged."
          action={{ label: 'Back to Explore', href: '/' }}
        />
      </div>
    );
  }

  const free = (draft?.totalMinor ?? 0) === 0;
  const steps = free ? ['Review', 'Contact', 'Done'] : ['Review', 'Contact', 'Pay', 'Done'];
  const stepIndex =
    phase === 'review' ? 0 : phase === 'contact' ? 1 : phase === 'done' ? steps.length - 1 : 2;

  async function submit() {
    if (!draft) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await placeDraft(draft);
      clearDraft(draft.id);
      setPlaced(result);
      setPhase('done');
    } catch (caught) {
      setError(errorText(caught));
      setPhase(free ? 'contact' : 'pay');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'done' && placed) {
    const shownTotal = draft?.totalMinor ?? placed.totalMinor;
    return (
      <div className="page max-w-[640px] py-12">
        <div className="text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10 border border-emerald-500/20">
            <CircleCheck aria-hidden className="size-10" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-fg">Booking Confirmed!</h1>
          <p className="mt-1 text-sm text-muted">
            Your digital pass is ready in Trips. Show the QR ticket at the venue.
          </p>
        </div>
        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-xl">
          <DetailRows
            rows={[
              { label: 'Booking Reference', value: <span className="font-mono font-bold text-fg">{placed.ref}</span> },
              ...(draft ? [{ label: 'Booking', value: draft.title }] : []),
              ...(placed.totalMinor > 0
                ? [
                    {
                      label: 'Amount Paid',
                      value: formatMoney(placed.totalMinor, placed.currency),
                      strong: true,
                    },
                    {
                      label: 'Payment Gateway',
                      value: <span className="font-mono">{placed.provider ?? '—'}</span>,
                    },
                  ]
                : [{ label: 'Paid now', value: 'Nothing' }]),
            ]}
          />
        </div>
        {placed.totalMinor !== shownTotal ? (
          <Notice tone="info" icon={Info} className="mt-4" title="The final amount differs">
            The provider&apos;s current price was {formatMoney(placed.totalMinor, placed.currency)}{' '}
            instead of {formatMoney(shownTotal, placed.currency)}. The receipt in Trips shows what
            was recorded.
          </Notice>
        ) : null}
        <div className="mt-6 grid gap-3">
          <Link
            href={`/trips/${encodeURIComponent(placed.ref)}`}
            className="flex items-center justify-center rounded-2xl bg-action-bg px-6 py-4 font-bold text-action-fg shadow-lg shadow-primary/25 hover:bg-action-bg/90 transition-all"
          >
            Open Digital Ticket & QR Pass →
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center rounded-2xl border border-line bg-surface-alt px-6 py-3.5 font-semibold text-fg hover:bg-surface transition-all"
          >
            Keep Exploring Bangladesh
          </Link>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  const summary = (
    <OrderSummary
      service={draft.service}
      title={draft.title}
      subtitle={draft.subtitle}
      when={draft.when}
      lines={draft.lines}
      totalMinor={draft.totalMinor}
      currency={draft.currency}
      payNowLabel={draft.payNowLabel}
      cancellation={draft.cancellation}
      emptyHint="Nothing to pay now."
    />
  );
  const canBook = user?.role === 'TOURIST';
  const methodLabel = PAYMENT_METHODS.find((item) => item.id === method)?.label ?? method;

  const footer =
    phase === 'review' ? (
      <Button size="lg" block onClick={() => setPhase('contact')}>
        Continue
      </Button>
    ) : phase === 'contact' ? (
      free ? (
        <Button
          size="lg"
          block
          loading={submitting}
          disabled={!canBook || !online}
          onClick={() => void submit()}
        >
          Confirm booking
        </Button>
      ) : (
        <Button size="lg" block disabled={!canBook} onClick={() => setPhase('pay')}>
          Continue to payment
        </Button>
      )
    ) : phase === 'pay' ? (
      <Button
        size="lg"
        block
        disabled={!canBook || !online}
        onClick={() => {
          setError(null);
          setDeclined(false);
          setPhase('gateway');
        }}
      >
        Pay {formatMoney(draft.totalMinor, draft.currency)}
      </Button>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        <Button
          size="lg"
          variant="secondary"
          disabled={submitting}
          onClick={() => {
            setDeclined(true);
            setPhase('pay');
          }}
        >
          Decline
        </Button>
        <Button size="lg" loading={submitting} onClick={() => void submit()}>
          Approve
        </Button>
      </div>
    );

  return (
    <FlowShell
      title="Checkout"
      step={stepIndex}
      steps={steps}
      onBack={() => setPhase(phase === 'gateway' ? 'pay' : phase === 'pay' ? 'contact' : 'review')}
      exitHref={draft.backHref}
      summary={phase === 'review' ? undefined : summary}
      footer={footer}
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
      {!online ? (
        <Notice tone="warn" icon={TriangleAlert} className="mb-5" title="You are offline">
          Booking needs a connection. Your choices are kept on this screen.
        </Notice>
      ) : null}
      {error ? (
        <Notice tone="danger" icon={CircleX} className="mb-5" title="Booking not completed">
          {error}{' '}
          <Link href={draft.backHref} className="font-semibold text-fg underline">
            Change booking
          </Link>
        </Notice>
      ) : null}
      {declined && phase === 'pay' ? (
        <Notice tone="warn" icon={CircleX} className="mb-5" title="Payment declined">
          Nothing was charged and nothing was booked. Try again or choose another method.
        </Notice>
      ) : null}

      {phase === 'review' ? (
        <div className="space-y-4">
          {summary}
          <p className="text-body-sm text-muted">
            Prices are set by the provider. Coastline earns a commission from the provider on each
            booking; there is no extra fee for you.
          </p>
        </div>
      ) : phase === 'contact' ? (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-label text-muted">Booking for</p>
            <p className="mt-1 text-title-sm">{user?.name ?? 'Guest'}</p>
            {user?.email ? <p className="text-body-sm text-muted">{user.email}</p> : null}
          </Card>
          <p className="text-body-sm text-muted">
            The provider sees your name with the booking. Updates appear in Trips. Phone contact
            arrives with sign-in.
          </p>
        </div>
      ) : phase === 'pay' ? (
        <fieldset>
          <legend className="mb-3 text-label">Pay with</legend>
          <div className="grid gap-2">
            {PAYMENT_METHODS.map((item) => {
              const Icon = item.id === 'CARD' ? CreditCard : Smartphone;
              const selected = method === item.id;
              return (
                <label
                  key={item.id}
                  className={cn(
                    'flex min-h-16 cursor-pointer items-center gap-3 rounded-md border px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                    selected
                      ? 'border-primary bg-primary-soft'
                      : 'border-line bg-surface hover:bg-surface-alt',
                  )}
                >
                  <input
                    type="radio"
                    name="method"
                    checked={selected}
                    onChange={() => setMethod(item.id)}
                    className="size-5 accent-[var(--primary)]"
                  />
                  <Icon aria-hidden className="size-6 text-muted" />
                  <span className="flex-1">
                    <span className="block text-label">{item.label}</span>
                    <span className="block text-caption text-muted">{item.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-4 flex gap-2 text-body-sm text-muted">
            <ShieldCheck aria-hidden className="size-5 flex-none" />
            You confirm the payment on the gateway screen. Coastline never asks for card numbers,
            PINs or one-time codes.
          </p>
        </fieldset>
      ) : (
        <section
          aria-labelledby="gateway-title"
          className="overflow-hidden rounded-lg border-2 border-line bg-surface"
        >
          <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-alt px-5 py-3">
            <p id="gateway-title" className="text-label">
              Payment gateway
            </p>
            <span className="font-mono text-caption text-muted">Provider: SANDBOX</span>
          </header>
          <div className="space-y-4 p-5">
            <DetailRows
              rows={[
                { label: 'Merchant', value: 'Coastline' },
                { label: 'Method', value: methodLabel },
                { label: 'For', value: draft.title },
                {
                  label: 'Amount',
                  value: formatMoney(draft.totalMinor, draft.currency),
                  strong: true,
                },
              ]}
            />
            <Notice tone="info" icon={Info}>
              This is the sandbox gateway. Approving records the payment and no money moves. It
              never asks for card numbers, PINs or one-time codes.
            </Notice>
          </div>
        </section>
      )}
    </FlowShell>
  );
}
