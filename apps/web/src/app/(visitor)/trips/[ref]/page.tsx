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
import { ErrorState } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';
import {
  AutoRefresh,
  CancelBooking,
  PrintButton,
  ProgressSteps,
  TicketQr,
} from '@/components/trips/trip-parts';

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
    <div className="page max-w-3xl">
      <PageHeader
        title="Ticket"
        subtitle={`${meta.label} · ${trip.ref}`}
        backHref="/trips"
        backLabel="Back to Trips"
        className="no-print lg:pt-6"
      />
      <div className="space-y-4">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line p-4">
            <span className="grid size-11 flex-none place-items-center rounded-full bg-primary-soft text-primary">
              <Icon aria-hidden className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title-sm">{trip.title}</p>
              <p className="text-body-sm text-muted">{trip.subtitle}</p>
            </div>
            <StatusBadge tone={trip.status.tone} label={trip.status.label} />
          </div>
          {ticket && trip.phase !== 'CANCELLED' ? (
            <div className="border-b border-dashed border-line bg-surface-alt px-4 py-6">
              <TicketQr payload={ticket.payload} code={ticket.code} />
              <p className="mt-3 text-center text-body-sm text-muted">
                Show this at the venue. Staff can also type the code.
              </p>
            </div>
          ) : (
            <div className="border-b border-line px-4 py-3">
              <p className="text-body-sm text-muted">
                Reference <span className="font-mono text-fg">{trip.ref}</span>
              </p>
            </div>
          )}
          <div className="px-4">
            <DetailRows rows={rows} />
          </div>
        </Card>

        {extra}

        <div className="no-print grid gap-2 md:grid-cols-2">
          {placeHref ? (
            <Link href={placeHref} className={buttonClass('secondary', 'md', 'w-full')}>
              <MapPin aria-hidden className="size-5" /> View place
            </Link>
          ) : null}
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noreferrer"
              className={buttonClass('secondary', 'md', 'w-full')}
            >
              <Navigation aria-hidden className="size-5" /> Directions
            </a>
          ) : null}
          {ticket ? <PrintButton /> : null}
          <Link
            href={`/help/report?ref=${encodeURIComponent(trip.ref)}`}
            className={buttonClass('text', 'md', 'w-full')}
          >
            <Flag aria-hidden className="size-5" /> Report a problem
          </Link>
        </div>

        <Card className="p-5">
          <h2 className="text-title-sm">Receipt</h2>
          <Receipt payments={payments} />
        </Card>

        {cancel ? <div className="no-print">{cancel}</div> : null}
      </div>
    </div>
  );
}
