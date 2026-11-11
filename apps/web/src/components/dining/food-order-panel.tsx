'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, Clock, MapPin, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import type {
  CreateFoodOrderRequest,
  DeliverableBedDto,
  DiningVenueDetail,
  FoodOrderDto,
  SessionUser,
} from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { formatMoney, hourLabel, toDhaka } from '@/lib/format';
import { cartTotalMinor, foodOrderHref, formatDhakaClock, orderableItems } from '@/lib/dining/delivery';
import { FoodCart } from '@/components/dining/food-cart';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/field';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { ErrorState, InlineSpinner } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';

export interface FoodOrderPanelProps {
  venue: DiningVenueDetail;
  /** Null when the API could not resolve the demo persona. */
  viewer: SessionUser | null;
}

const NOTE_MAX = 300;

/**
 * Sunbed food delivery for one venue. Self-contained: it loads the tourist's
 * deliverable sunbed bookings in the browser, builds a cart from the venue
 * menu and places the order. Prices shown are display estimates; the API
 * re-prices every line from the database and takes a simulated charge.
 */
export function FoodOrderPanel({ venue, viewer }: FoodOrderPanelProps) {
  if (!venue.deliveryEnabled) {
    return null;
  }

  return (
    <Panel
      className="p-4 sm:p-5"
      role="region"
      aria-label={`Order food from ${venue.name} to your sunbed`}
    >
      <PanelHeader
        eyebrow="Sunbed delivery"
        title="Order to your sunbed"
        right={<Badge tone="sand">Demo</Badge>}
      />
      <div className="mt-4">
        {!viewer || viewer.role !== 'TOURIST' ? (
          <div className="flex items-start gap-2 rounded-xl border border-sand/30 bg-sand/5 px-3 py-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 flex-none text-sand" />
            <p className="text-[12px] leading-relaxed text-mist">
              {viewer
                ? 'You are viewing as admin. Food is delivered to a tourist’s booked sunbed, so switch persona to a tourist in the header to place an order.'
                : 'The demo persona could not be resolved. Pick a tourist persona in the header to order food to a sunbed.'}
            </p>
          </div>
        ) : (
          <TouristFoodOrder venue={venue} />
        )}
      </div>
    </Panel>
  );
}

type BedsState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; beds: DeliverableBedDto[] };

function TouristFoodOrder({ venue }: { venue: DiningVenueDetail }) {
  const toast = useToast();
  const [beds, setBeds] = useState<BedsState>({ kind: 'loading' });
  const [bedId, setBedId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<FoodOrderDto | null>(null);

  const items = useMemo(() => orderableItems(venue), [venue]);
  const totalMinor = cartTotalMinor(items, quantities);
  const lines = Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));

  const loadBeds = useCallback(async () => {
    setBeds({ kind: 'loading' });
    try {
      const all = await clientApi<DeliverableBedDto[]>('/dining/delivery/beds');
      const here = all.filter((bed) => bed.beachPointCode === venue.beachPointCode);
      setBeds({ kind: 'ready', beds: here });
      setBedId((current) =>
        here.some((bed) => bed.orderItemId === current) ? current : (here[0]?.orderItemId ?? ''),
      );
    } catch (caught) {
      setBeds({
        kind: 'error',
        message:
          caught instanceof ApiError
            ? caught.message
            : 'The booking API is offline. Start the API on port 3001, then try again.',
      });
    }
  }, [venue.beachPointCode]);

  useEffect(() => {
    void loadBeds();
  }, [loadBeds]);

  function setQuantity(menuItemId: string, quantity: number) {
    setQuantities((current) => ({ ...current, [menuItemId]: Math.max(0, quantity) }));
  }

  async function placeOrder() {
    if (!bedId || lines.length === 0) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const body: CreateFoodOrderRequest = {
        orderItemId: bedId,
        venueId: venue.id,
        lines,
        note: note.trim() || undefined,
        paymentMethod: 'MOCK',
      };
      const order = await clientApi<FoodOrderDto>('/dining/food-orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setPlaced(order);
      setQuantities({});
      setNote('');
      toast.push(`Order ${order.publicRef} placed. Demo charge recorded.`, 'success');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The booking API is offline. Start the API on port 3001, then try again.',
      );
    } finally {
      setPending(false);
    }
  }

  if (placed) {
    return (
      <div role="status" className="space-y-3 rounded-xl border border-success/35 bg-success/8 p-4">
        <div className="flex items-start gap-2.5">
          <CircleCheck aria-hidden className="mt-0.5 h-4 w-4 flex-none text-success" />
          <div>
            <p className="text-[13px] font-semibold text-foam">
              Order {placed.publicRef} placed
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-mist">
              {placed.venue.name} will bring it to sunbed {placed.delivery.sunbedCode} at{' '}
              {placed.delivery.beachPointName}. Demo charge of {formatMoney(placed.totalMinor)}{' '}
              recorded — no real payment was taken.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={foodOrderHref(placed.publicRef)} className={buttonClass('primary', 'md')}>
            Track order
          </Link>
          <Button variant="secondary" onClick={() => setPlaced(null)}>
            Order something else
          </Button>
        </div>
      </div>
    );
  }

  if (beds.kind === 'loading') {
    return <InlineSpinner label="Checking your sunbed bookings" />;
  }

  if (beds.kind === 'error') {
    return (
      <ErrorState
        title="Could not check your sunbed bookings"
        message={beds.message}
        onRetry={() => void loadBeds()}
      />
    );
  }

  if (beds.beds.length === 0) {
    const mapHref = venue.beachPointCode
      ? `/?point=${encodeURIComponent(venue.beachPointCode)}`
      : '/';
    return (
      <div className="space-y-3 rounded-xl border border-dashed border-line-strong/70 p-4">
        <div className="flex items-start gap-2.5">
          <MapPin aria-hidden className="mt-0.5 h-4 w-4 flex-none text-sea" />
          <p className="text-[12px] leading-relaxed text-mist">
            Delivery goes to a sunbed you have booked
            {venue.beachPointName ? ` at ${venue.beachPointName}` : ' at this venue’s beach'}, during
            its booked hours. You have no sunbed booking there right now — book a bed first, then
            come back to order.
          </p>
        </div>
        <Link href={mapHref} className={buttonClass('secondary', 'md')}>
          Book a sunbed on the beach map
        </Link>
      </div>
    );
  }

  const dhakaHourNow = toDhaka(new Date()).getUTCHours();
  const openNow = venue.openHour <= dhakaHourNow && dhakaHourNow < venue.closeHour;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void placeOrder();
      }}
    >
      {!openNow ? (
        <p className="flex items-start gap-2 rounded-xl border border-warn/35 bg-warn/5 px-3 py-2.5 text-[11.5px] leading-relaxed text-mist">
          <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-warn" />
          The kitchen is closed now. It delivers between {hourLabel(venue.openHour)} and{' '}
          {hourLabel(venue.closeHour)} (Asia/Dhaka).
        </p>
      ) : null}

      <Field label="Deliver to" htmlFor="food-bed">
        <Select
          id="food-bed"
          value={bedId}
          onChange={(event) => setBedId(event.target.value)}
          disabled={pending}
        >
          {beds.beds.map((bed) => (
            <option key={bed.orderItemId} value={bed.orderItemId}>
              {bed.sunbedCode} · {bed.beachPointName} · until {formatDhakaClock(bed.endAt)}
              {bed.status === 'CHECKED_IN' ? ' · checked in' : ''}
            </option>
          ))}
        </Select>
      </Field>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong/70 px-3 py-4 text-[12px] text-mist">
          Nothing on the menu is available right now.
        </p>
      ) : (
        <div>
          <p className="label mb-1.5 flex items-center gap-1.5 text-foam/80">
            <UtensilsCrossed aria-hidden className="h-3 w-3" />
            Menu
          </p>
          <FoodCart items={items} quantities={quantities} onChange={setQuantity} disabled={pending} />
        </div>
      )}

      <Field label="Note for the kitchen (optional)" htmlFor="food-note">
        <Textarea
          id="food-note"
          value={note}
          maxLength={NOTE_MAX}
          rows={2}
          className="min-h-16"
          placeholder="Less spicy, extra lemon…"
          onChange={(event) => setNote(event.target.value)}
          disabled={pending}
        />
      </Field>

      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <p className="label">Demo charge · simulated payment</p>
        <p className="font-display text-[22px] text-foam">{formatMoney(totalMinor)}</p>
      </div>
      <p className="-mt-2 text-[10.5px] leading-relaxed text-mist">
        Indicative demo prices with no delivery fee. The amount is confirmed by the server and
        recorded with the mock provider; no real money moves. You can cancel until the kitchen
        starts preparing.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-danger/35 bg-danger/10 px-3 py-2 text-[11.5px] leading-relaxed text-danger"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full"
        loading={pending}
        disabled={!bedId || lines.length === 0}
      >
        Place order · {formatMoney(totalMinor)}
      </Button>
    </form>
  );
}
