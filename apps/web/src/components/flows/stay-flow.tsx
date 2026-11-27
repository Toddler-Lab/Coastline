'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BedDouble, Info, Users } from 'lucide-react';
import type { HotelDetailDto, RoomTypeDto } from '@coastline/api-contracts';
import { CANCEL_CUTOFF_MINUTES } from '@coastline/api-contracts';
import { ApiError, clientApi } from '@/lib/api';
import { saveDraft } from '@/lib/checkout';
import { cn } from '@/lib/cn';
import { addDays, formatDateKey, formatMoney, slotLabel } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Stepper } from '@/components/ui/display';
import { ErrorState, Notice, Skeleton } from '@/components/ui/feedback-states';
import { useSession } from '@/components/patterns/session';
import { DateStrip, FlowShell } from '@/components/patterns/booking-flow-shell';
import { OrderSummary } from '@/components/patterns/order-summary';

const STEPS = ['Dates and guests', 'Choose a room'];
const MAX_NIGHTS = 14;

type Rooms =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; rooms: RoomTypeDto[] };

export function StayFlow({
  hotel,
  today,
  backHref,
  initialRoomId,
}: {
  hotel: HotelDetailDto;
  today: string;
  backHref: string;
  initialRoomId?: string;
}) {
  const router = useRouter();
  const { user } = useSession();
  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(today);
  const [nights, setNights] = useState(1);
  const [guests, setGuests] = useState(2);
  const [roomId, setRoomId] = useState<string | null>(initialRoomId ?? null);
  const [rooms, setRooms] = useState<Rooms>({ state: 'loading' });
  const [reload, setReload] = useState(0);
  const checkOut = addDays(checkIn, nights);
  const maxGuests = Math.max(1, ...hotel.roomTypes.map((room) => room.maxGuests));
  const canBook = user?.role === 'TOURIST';

  useEffect(() => {
    if (step !== 1) return;
    let cancelled = false;
    setRooms({ state: 'loading' });
    clientApi<HotelDetailDto>(
      `/hotels/${encodeURIComponent(hotel.slug)}?checkInDate=${checkIn}&checkOutDate=${checkOut}`,
    )
      .then((data) => {
        if (!cancelled) setRooms({ state: 'ready', rooms: data.roomTypes });
      })
      .catch((error: unknown) => {
        if (!cancelled)
          setRooms({
            state: 'error',
            message: error instanceof ApiError ? error.message : 'Rooms could not be loaded.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [step, hotel.slug, checkIn, checkOut, reload]);

  const roomList = rooms.state === 'ready' ? rooms.rooms : [];
  const room = roomList.find((item) => item.id === roomId) ?? null;
  const roomFits = room ? room.maxGuests >= guests && room.availableRooms > 0 : false;

  useEffect(() => {
    if (
      rooms.state === 'ready' &&
      roomId &&
      !rooms.rooms.some(
        (item) => item.id === roomId && item.availableRooms > 0 && item.maxGuests >= guests,
      )
    ) {
      setRoomId(null);
    }
  }, [rooms, roomId, guests]);

  const when = `${formatDateKey(checkIn)} – ${formatDateKey(checkOut)} · ${nights} ${nights === 1 ? 'night' : 'nights'} · ${guests} ${guests === 1 ? 'guest' : 'guests'}`;
  const totalMinor = room ? room.basePriceMinor * nights : 0;
  const cancellation = `Free cancellation until ${CANCEL_CUTOFF_MINUTES} minutes before check-in (${slotLabel(hotel.checkInTime)}).`;

  const summary = (
    <OrderSummary
      service="stay"
      title={hotel.name}
      subtitle={room ? room.name : 'Choose a room'}
      when={when}
      lines={
        room
          ? [
              {
                label: `${formatMoney(room.basePriceMinor)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`,
                amountMinor: totalMinor,
              },
            ]
          : []
      }
      totalMinor={totalMinor}
      cancellation={cancellation}
      emptyHint="Pick a room to see the total."
    />
  );

  function goToCheckout() {
    if (!room || !roomFits) return;
    const id = saveDraft({
      service: 'stay',
      title: hotel.name,
      subtitle: `${room.name} · ${room.bedConfig}`,
      when,
      lines: [
        {
          label: `${room.name}`,
          detail: `${formatMoney(room.basePriceMinor)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`,
          amountMinor: totalMinor,
        },
      ],
      totalMinor,
      currency: room.currency,
      cancellation,
      backHref: `${backHref}/book`,
      request: {
        kind: 'stay',
        body: {
          hotelId: hotel.id,
          roomTypeId: room.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          guestsCount: guests,
        },
      },
    });
    router.push(`/checkout/${id}`);
  }

  return (
    <FlowShell
      title={hotel.name}
      step={step}
      steps={STEPS}
      onBack={() => setStep(0)}
      exitHref={backHref}
      summary={summary}
      footer={
        step === 0 ? (
          <Button size="lg" block onClick={() => setStep(1)}>
            See rooms for {nights} {nights === 1 ? 'night' : 'nights'}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 lg:hidden">
              <p className="tabular text-title-sm">{room ? formatMoney(totalMinor) : '—'}</p>
              <p className="text-caption text-muted">
                {nights} {nights === 1 ? 'night' : 'nights'} total
              </p>
            </div>
            <Button
              size="lg"
              className="lg:w-full"
              disabled={!canBook || !roomFits}
              onClick={goToCheckout}
            >
              Continue to checkout
            </Button>
          </div>
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
            days={21}
            value={checkIn}
            onChange={setCheckIn}
            label="Check-in"
          />
          <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface p-4">
            <div>
              <p className="text-label">Nights</p>
              <p className="text-body-sm text-muted">Check-out {formatDateKey(checkOut)}</p>
            </div>
            <Stepper label="nights" value={nights} min={1} max={MAX_NIGHTS} onChange={setNights} />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface p-4">
            <div>
              <p className="text-label">Guests</p>
              <p className="text-body-sm text-muted">Up to {maxGuests} in one room</p>
            </div>
            <Stepper label="guests" value={guests} min={1} max={maxGuests} onChange={setGuests} />
          </div>
          <p className="text-body-sm text-muted">
            Check-in from {slotLabel(hotel.checkInTime)}, check-out by{' '}
            {slotLabel(hotel.checkOutTime)}.
          </p>
        </div>
      ) : rooms.state === 'loading' ? (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : rooms.state === 'error' ? (
        <ErrorState message={rooms.message} onRetry={() => setReload((n) => n + 1)} />
      ) : (
        <fieldset>
          <legend className="sr-only">Room type</legend>
          <ul className="space-y-3">
            {roomList.map((item) => {
              const tooSmall = item.maxGuests < guests;
              const soldOut = item.availableRooms === 0;
              const disabled = tooSmall || soldOut;
              const selected = item.id === roomId;
              return (
                <li key={item.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-md border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary',
                      selected
                        ? 'border-primary bg-primary-soft'
                        : 'border-line bg-surface hover:bg-surface-alt',
                      disabled && 'cursor-not-allowed opacity-50 hover:bg-surface',
                    )}
                  >
                    <input
                      type="radio"
                      name="room"
                      className="mt-1 size-5 flex-none accent-[var(--primary)]"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => setRoomId(item.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-title-sm">{item.name}</span>
                      <span className="mt-0.5 flex flex-wrap gap-x-3 text-body-sm text-muted">
                        <span className="inline-flex items-center gap-1">
                          <Users aria-hidden className="size-4" /> Sleeps {item.maxGuests}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <BedDouble aria-hidden className="size-4" /> {item.bedConfig}
                        </span>
                      </span>
                      <span className="mt-1 block text-body-sm">
                        {soldOut
                          ? 'Sold out for these dates'
                          : tooSmall
                            ? `Too small for ${guests} guests`
                            : `${item.availableRooms} left for these dates`}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="tabular block text-title-sm">
                        {formatMoney(item.basePriceMinor * nights, item.currency)}
                      </span>
                      <span className="block text-caption text-muted">
                        {formatMoney(item.basePriceMinor, item.currency)} / night
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      <div className="mt-6 lg:hidden">{step === 1 && room ? summary : null}</div>
    </FlowShell>
  );
}
