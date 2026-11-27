import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flag, MapPin, Navigation } from 'lucide-react';
import type {
  BeachPointSummary,
  FoodOrderDto,
  OrderDto,
  PaymentDto,
  ReservationDto,
  TicketDto,
} from '@coastline/api-contracts';
import { CANCEL_CUTOFF_MINUTES, RESERVATION_CANCEL_CUTOFF_MINUTES } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, isNotFound } from '@/lib/places-server';
import {
  foodOrderToTrip,
  orderToTrip,
  reservationToTrip,
  tripRefKind,
  type TripItem,
} from '@/lib/trips';
import { foodOrderTimeline } from '@/lib/dining/delivery';
import { paymentTypeLabel } from '@/lib/booking';
import {
  hotelListingId,
  listingHref,
  spotHref,
  sunbedPickerHref,
  venueListingId,
} from '@/lib/places';
import { SERVICES } from '@/lib/services';
import { formatDateTime, formatIsoTime, formatMoney } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Card, DetailRows } from '@/components/ui/display';
import { ErrorState } from '@/components/ui/feedback-states';
import { PageHeader } from '@/components/patterns/spot-hub-sections';
import {
  AutoRefresh,
  CancelBooking,
  PrintButton,
  ProgressSteps,
  TicketQr,
} from '@/components/trips/trip-sections';

type Params = { ref: string };

type Loaded =
  | { kind: 'order'; order: OrderDto; trip: TripItem; place?: BeachPointSummary }
  | { kind: 'reservation'; reservation: ReservationDto; trip: TripItem }
  | { kind: 'food'; food: FoodOrderDto; trip: TripItem };

async function load(ref: string): Promise<Loaded | { error: string } | null> {
  const kind = tripRefKind(ref);
  if (!kind) return null;
  const viewer = await getViewer();
  const path = encodeURIComponent(ref.toUpperCase());
  try {
    if (kind === 'order') {
      const order = await serverApi<OrderDto>(`/orders/${path}`, viewer.userId);
      let place: BeachPointSummary | undefined;
      const code = order.items[0]?.beachPointCode;
      if (code) {
        const points = await serverApi<BeachPointSummary[]>('/beach-points', viewer.userId).catch(
          () => [],
        );
        place = points.find((point) => point.code === code);
      }
      return { kind, order, trip: orderToTrip(order), place };
    }
    if (kind === 'reservation') {
      const reservation = await serverApi<ReservationDto>(
        `/dining/reservations/${path}`,
        viewer.userId,
      );
      return { kind, reservation, trip: reservationToTrip(reservation) };
    }
    const food = await serverApi<FoodOrderDto>(`/dining/food-orders/${path}`, viewer.userId);
    return { kind, food, trip: foodOrderToTrip(food) };
  } catch (error) {
    if (isNotFound(error)) return null;
    return { error: apiErrorMessage(error) };
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  return { title: `Ticket ${decodeURIComponent((await params).ref).toUpperCase()}` };
}

function Receipt({ payments }: { payments: PaymentDto[] }) {
  if (payments.length === 0)
    return <p className="text-body-sm text-muted">Nothing has been paid for this booking.</p>;
  return (
    <ul className="divide-y divide-line">
      {payments.map((payment) => (
        <li key={payment.id} className="flex items-start justify-between gap-4 py-3">
          <div>
            <p className="text-label">{paymentTypeLabel(payment.type)}</p>
            <p className="text-body-sm text-muted">{formatDateTime(payment.createdAt)}</p>
            <p className="text-caption text-muted">
              Provider <span className="font-mono">{payment.provider}</span>
              {payment.externalRef ? (
                <>
                  {' '}
                  · <span className="font-mono">{payment.externalRef}</span>
                </>
              ) : null}
            </p>
          </div>
          <p className="tabular whitespace-nowrap text-body">
            {payment.type === 'REFUND' ? '−' : ''}
            {formatMoney(payment.amountMinor, payment.currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function TripPage({ params }: { params: Promise<Params> }) {
  const ref = decodeURIComponent((await params).ref).toUpperCase();
  const data = await load(ref);
  if (!data) notFound();
  if ('error' in data) {
    return (
      <div className="page max-w-3xl py-10">
        <ErrorState
          title="This ticket could not be loaded"
          message={data.error}
          retryHref={`/trips/${ref}`}
          reference={ref}
        />
      </div>
    );
  }

  const { trip } = data;
  const meta = SERVICES[trip.service];
  const Icon = meta.icon;

  let ticket: TicketDto | null = null;
  let payments: PaymentDto[] = [];
  let rows: Array<{ label: string; value: React.ReactNode }> = [];
  let cancel: React.ReactNode = null;
  let placeHref: string | null = null;
  let directions: string | null = null;
  let extra: React.ReactNode = null;

  if (data.kind === 'order') {
    const { order } = data;
    ticket = order.ticket;
    payments = order.payments;
    const hotel = order.hotelBookings?.[0];
    if (hotel) {
      rows = [
        { label: 'Room', value: `${hotel.roomTypeName} · room ${hotel.roomNumber}` },
        { label: 'Dates', value: trip.timeLabel },
        { label: 'Guests', value: hotel.guestsCount },
      ];
      placeHref = listingHref(hotelListingId({ slug: hotel.hotelSlug }));
    } else {
      rows = [
        {
          label: 'Beds',
          value: [...new Set(order.items.map((item) => item.sunbedCode))].join(', '),
        },
        { label: 'Time', value: trip.timeLabel },
        ...(order.items.some((item) => item.checkedInAt)
          ? [
              {
                label: 'Checked in',
                value: formatDateTime(order.items.find((item) => item.checkedInAt)!.checkedInAt!),
              },
            ]
          : []),
      ];
      if (data.place) {
        placeHref = spotHref(data.place.destinationSlug, data.place.spotSlug);
        directions = `https://www.google.com/maps/dir/?api=1&destination=${data.place.latitude},${data.place.longitude}`;
      } else if (order.items[0]) {
        placeHref = sunbedPickerHref({ code: order.items[0].beachPointCode });
      }
    }
    if (order.canCancel) {
      cancel = (
        <CancelBooking
          path={`/orders/${encodeURIComponent(order.publicRef)}/cancel`}
          label="Cancel booking"
          result={`${hotel ? 'The room' : 'Your beds'} will be released and ${formatMoney(order.totalMinor, order.currency)} refunded to the original payment.`}
          deadline={`Free cancellation until ${CANCEL_CUTOFF_MINUTES} minutes before the start.`}
        />
      );
    }
  } else if (data.kind === 'reservation') {
    const { reservation } = data;
    ticket = reservation.ticket;
    payments = reservation.payments;
    rows = [
      { label: 'Table', value: reservation.table.code },
      { label: 'Time', value: trip.timeLabel },
      { label: 'Guests', value: reservation.partySize },
      ...(reservation.note ? [{ label: 'Note', value: reservation.note }] : []),
    ];
    placeHref = listingHref(venueListingId(reservation.venue));
    if (reservation.canCancel) {
      cancel = (
        <CancelBooking
          path={`/dining/reservations/${encodeURIComponent(reservation.publicRef)}/cancel`}
          label="Cancel reservation"
          result={
            reservation.depositMinor > 0
              ? `The table is released and the ${formatMoney(reservation.depositMinor, reservation.currency)} deposit refunded.`
              : 'The table is released.'
          }
          deadline={`Free cancellation until ${RESERVATION_CANCEL_CUTOFF_MINUTES} minutes before your table time.`}
        />
      );
    }
  } else {
    const { food } = data;
    payments = food.payments;
    rows = [
      {
        label: 'Deliver to',
        value: `Sunbed ${food.delivery.sunbedCode}, ${food.delivery.beachPointName}`,
      },
      ...food.lines.map((line) => ({
        label: `${line.quantity} × ${line.name}`,
        value: formatMoney(line.totalMinor, food.currency),
      })),
      { label: 'Total', value: formatMoney(food.totalMinor, food.currency) },
      ...(food.note ? [{ label: 'Note', value: food.note }] : []),
    ];
    placeHref = listingHref(venueListingId(food.venue));
    const steps = foodOrderTimeline(food).map((step) => ({
      label: step.label,
      at: step.at ? formatIsoTime(step.at) : null,
      state: step.state,
    }));
    extra = (
      <Card className="p-5">
        <h2 className="mb-4 text-title-sm">Order progress</h2>
        <ProgressSteps steps={steps} />
        {trip.live ? <AutoRefresh /> : null}
      </Card>
    );
    if (food.canCancel) {
      cancel = (
        <CancelBooking
          path={`/dining/food-orders/${encodeURIComponent(food.publicRef)}/cancel`}
          label="Cancel order"
          result={`The kitchen will not start it and ${formatMoney(food.totalMinor, food.currency)} is refunded.`}
          deadline="You can cancel until the kitchen starts preparing."
        />
      );
    }
  }

  return (
    <div className="page max-w-3xl pb-20">
      <PageHeader
        title="Digital Boarding Pass"
        subtitle={`${meta.label} · Reference ${trip.ref}`}
        backHref="/trips"
        backLabel="Back to Trips"
        className="no-print lg:pt-6"
      />
      <div className="space-y-5">
        {/* 2026 Boarding Pass Card */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface shadow-xl">
          {/* Airline-style pass header */}
          <div className="flex items-center justify-between border-b border-line bg-surface-alt/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden className="size-5" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  Coastline Pass · {meta.label}
                </span>
                <p className="font-mono text-xs font-bold text-fg">{trip.ref}</p>
              </div>
            </div>
            <StatusBadge tone={trip.status.tone} label={trip.status.label} />
          </div>

          {/* Main title & subtitle */}
          <div className="p-6">
            <h1 className="text-2xl font-extrabold text-fg">{trip.title}</h1>
            <p className="mt-1 text-sm text-muted">{trip.subtitle}</p>
          </div>

          {/* QR Code Section with Tear Line */}
          {ticket && trip.phase !== 'CANCELLED' ? (
            <div className="relative border-y border-dashed border-line bg-surface-alt/40 px-6 py-8">
              {/* Left and Right Notches */}
              <div className="absolute -left-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-line bg-bg shadow-inner" />
              <div className="absolute -right-3 top-1/2 size-6 -translate-y-1/2 rounded-full border border-line bg-bg shadow-inner" />

              <div className="mx-auto max-w-xs text-center">
                <div className="inline-block rounded-2xl bg-white p-4 shadow-md border border-black/5">
                  <TicketQr payload={ticket.payload} code={ticket.code} />
                </div>
                <p className="mt-3 text-xs font-medium text-muted">
                  Present this QR code to the on-site attendant for check-in.
                </p>
                {ticket.code ? (
                  <p className="mt-1.5 font-mono text-xs tracking-wider text-fg bg-surface inline-block px-3 py-1 rounded-full border border-line">
                    PASS CODE: <span className="font-bold">{ticket.code}</span>
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="border-b border-line px-6 py-3">
              <p className="text-xs text-muted">
                Reference ID: <span className="font-mono font-bold text-fg">{trip.ref}</span>
              </p>
            </div>
          )}

          {/* Details breakdown */}
          <div className="p-6">
            <DetailRows rows={rows} />
          </div>
        </div>

        {extra}

        <div className="no-print grid gap-2.5 sm:grid-cols-2">
          {placeHref ? (
            <Link href={placeHref} className={buttonClass('secondary', 'md', 'w-full justify-center rounded-xl')}>
              <MapPin aria-hidden className="size-4 mr-2" /> View place
            </Link>
          ) : null}
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noreferrer"
              className={buttonClass('secondary', 'md', 'w-full justify-center rounded-xl')}
            >
              <Navigation aria-hidden className="size-4 mr-2" /> Directions
            </a>
          ) : null}
          {ticket ? <PrintButton /> : null}
          <Link
            href={`/help/report?ref=${encodeURIComponent(trip.ref)}`}
            className={buttonClass('text', 'md', 'w-full justify-center text-muted hover:text-fg')}
          >
            <Flag aria-hidden className="size-4 mr-2" /> Report a problem
          </Link>
        </div>

        <Card className="rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-fg">Payment & Receipts</h2>
          <div className="mt-2">
            <Receipt payments={payments} />
          </div>
        </Card>

        {cancel ? <div className="no-print">{cancel}</div> : null}
      </div>
    </div>
  );
}
