'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Info, Umbrella } from 'lucide-react';
import type { DeliverableBedDto, DiningVenueDetail } from '@coastline/api-contracts';
import { MAX_FOOD_ITEM_QUANTITY, MAX_FOOD_ORDER_LINES } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { saveDraft } from '@/lib/checkout';
import { cartTotalMinor, orderableItems } from '@/lib/dining/delivery';
import { formatIsoTime, formatMoney, hoursRange, toDhaka } from '@/lib/format';
import { sunbedPickerHref } from '@/lib/places';
import { Button, buttonClass } from '@/components/ui/button';
import { ChoiceGroup, Stepper } from '@/components/ui/display';
import { Field, TextArea } from '@/components/ui/field';
import { EmptyState, ErrorState, Notice, Skeleton } from '@/components/ui/feedback-states';
import { useSession } from '@/components/patterns/session';
import { FlowShell } from '@/components/patterns/booking-flow-shell';
import { OrderSummary } from '@/components/patterns/order-summary';

const STEPS = ['Deliver to', 'Choose food'];

type Beds =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; beds: DeliverableBedDto[] };

export function FoodOrderFlow({ venue, backHref }: { venue: DiningVenueDetail; backHref: string }) {
  const router = useRouter();
  const { user } = useSession();
  const canBook = user?.role === 'TOURIST';
  const [step, setStep] = useState(0);
  const [beds, setBeds] = useState<Beds>({ state: 'loading' });
  const [bedId, setBedId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [openNow, setOpenNow] = useState(true);

  const loadBeds = useCallback(async () => {
    if (!canBook) {
      setBeds({ state: 'ready', beds: [] });
      return;
    }
    setBeds({ state: 'loading' });
    try {
      const all = await clientApi<DeliverableBedDto[]>('/dining/delivery/beds');
      const here = all.filter((bed) => bed.beachPointCode === venue.beachPointCode);
      setBeds({ state: 'ready', beds: here });
      setBedId((current) =>
        here.some((bed) => bed.orderItemId === current) ? current : (here[0]?.orderItemId ?? null),
      );
    } catch (error) {
      setBeds({
        state: 'error',
        message:
          error instanceof ApiError ? error.message : 'Your sunbed bookings could not be checked.',
      });
    }
  }, [venue.beachPointCode, canBook]);

  useEffect(() => {
    void loadBeds();
    const hour = toDhaka(new Date()).getUTCHours();
    setOpenNow(venue.openHour <= hour && hour < venue.closeHour);
  }, [loadBeds, venue.openHour, venue.closeHour]);

  const items = useMemo(() => orderableItems(venue), [venue]);
  const lines = items.filter((item) => (quantities[item.id] ?? 0) > 0);
  const totalMinor = cartTotalMinor(items, quantities);
  const bed =
    beds.state === 'ready' ? (beds.beds.find((item) => item.orderItemId === bedId) ?? null) : null;
  const when = bed
    ? `To sunbed ${bed.sunbedCode} · ${bed.beachPointName}`
    : 'To your booked sunbed';
  const cancellation = 'Cancel free until the kitchen starts preparing.';
  const draftLines = lines.map((item) => ({
    label: `${quantities[item.id]} × ${item.name}`,
    amountMinor: item.priceMinor * (quantities[item.id] ?? 0),
  }));

  function setQuantity(id: string, value: number) {
    setQuantities((current) => {
      const next = { ...current, [id]: value };
      const used = Object.values(next).filter((quantity) => quantity > 0).length;
      return used > MAX_FOOD_ORDER_LINES ? current : next;
    });
  }

  function goToCheckout() {
    if (!bed || lines.length === 0) return;
    const id = saveDraft({
      service: 'food',
      title: venue.name,
      subtitle: 'Food delivered to your sunbed',
      when,
      lines: draftLines,
      totalMinor,
      currency: venue.currency,
      cancellation,
      backHref: `${backHref}/book?mode=order`,
      request: {
        kind: 'food',
        body: {
          orderItemId: bed.orderItemId,
          venueId: venue.id,
          lines: lines.map((item) => ({ menuItemId: item.id, quantity: quantities[item.id] ?? 0 })),
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
      subtitle="Delivery to your sunbed"
      when={when}
      lines={draftLines}
      totalMinor={totalMinor}
      cancellation={cancellation}
      emptyHint="Add something from the menu."
    />
  );

  const noBeds = beds.state === 'ready' && beds.beds.length === 0;

  return (
    <FlowShell
      title={`Order from ${venue.name}`}
      step={step}
      steps={STEPS}
      onBack={() => setStep(0)}
      exitHref={backHref}
      summary={summary}
      footer={
        step === 0 ? (
          <Button size="lg" block disabled={!bed} onClick={() => setStep(1)}>
            Choose food
          </Button>
        ) : (
          <Button
            size="lg"
            block
            disabled={!canBook || !bed || lines.length === 0}
            onClick={goToCheckout}
          >
            {lines.length === 0 ? 'Add an item' : `Continue · ${formatMoney(totalMinor)}`}
          </Button>
        )
      }
    >
      {!canBook ? (
        <Notice
          tone="warn"
          icon={Info}
          className="mb-5"
          title="Switch to a visitor account to order"
        >
          Food goes to a visitor&apos;s booked sunbed. Open the account menu to switch.
        </Notice>
      ) : null}
      {!openNow ? (
        <Notice tone="warn" icon={Clock} className="mb-5" title="The kitchen is closed now">
          It delivers {hoursRange(venue.openHour, venue.closeHour)}.
        </Notice>
      ) : null}

      {step === 0 ? (
        beds.state === 'loading' ? (
          <Skeleton className="h-24" />
        ) : beds.state === 'error' ? (
          <ErrorState message={beds.message} onRetry={() => void loadBeds()} />
        ) : noBeds ? (
          <EmptyState
            icon={Umbrella}
            title="You need a sunbed booking here"
            body={`Food is delivered to a sunbed you have booked${venue.beachPointName ? ` at ${venue.beachPointName}` : ''}, during your booked hours.`}
            action={
              venue.beachPointCode ? (
                <Link
                  href={sunbedPickerHref({ code: venue.beachPointCode })}
                  className={buttonClass('primary')}
                >
                  Book a sunbed
                </Link>
              ) : null
            }
          />
        ) : (
          <ChoiceGroup
            name="bed"
            legend="Your sunbed"
            value={bedId}
            onChange={setBedId}
            columns={2}
            options={beds.beds.map((item) => ({
              value: item.orderItemId,
              label: `Sunbed ${item.sunbedCode}`,
              hint: `${item.beachPointName} · until ${formatIsoTime(item.endAt)}${item.status === 'CHECKED_IN' ? ' · checked in' : ''}`,
            }))}
          />
        )
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing on the menu right now"
          body="Try again later or pick another venue."
        />
      ) : (
        <div className="space-y-6">
          <ul className="divide-y divide-line rounded-md border border-line bg-surface">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body">{item.name}</p>
                  {item.description ? (
                    <p className="text-body-sm text-muted">{item.description}</p>
                  ) : null}
                  <p className="tabular text-body-sm">
                    {formatMoney(item.priceMinor, item.currency)}
                  </p>
                </div>
                <Stepper
                  label={item.name}
                  value={quantities[item.id] ?? 0}
                  min={0}
                  max={MAX_FOOD_ITEM_QUANTITY}
                  onChange={(value) => setQuantity(item.id, value)}
                />
              </li>
            ))}
          </ul>
          <Field
            label="Note for the kitchen"
            htmlFor="food-note"
            optional
            hint="Less spicy, extra lemon"
          >
            <TextArea
              id="food-note"
              value={note}
              maxLength={300}
              rows={2}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
          <div className="lg:hidden">{summary}</div>
        </div>
      )}
    </FlowShell>
  );
}
