import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CircleCheck, Clock, Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { ReservationDto } from '@coastline/api-contracts';
import { ApiError, serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { durationLabel, paymentTypeLabel, phasePresentation } from '@/lib/booking';
import { formatDateTime, formatIsoDate, formatIsoTime, formatMoney } from '@/lib/format';
import {
  reservationHours,
  reservationStatusPresentation,
} from '@/lib/dining/reservations';
import { ApiOffline } from '@/components/booking/api-offline';
import { TicketQr } from '@/components/booking/ticket-qr';
import { ReservationCancel } from '@/components/dining/reservation-cancel';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { SiteFooter } from '@/components/site/site-footer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Reservation ${ref}`,
    description: 'Demo table reservation, simulated deposit and QR check-in code.',
  };
}

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ ref }, query] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();

  if (!viewer.user) {
    return (
      <Frame>
        <p className="label">Reservation</p>
        <h1 className="mt-2 text-3xl">Could not open this reservation.</h1>
        <div className="mt-4">
          <ApiOffline
            title="The API is offline"
            message="Start the API on port 3001, then try again. Reservations are fetched live so a stale QR can never be shown."
          />
        </div>
      </Frame>
    );
  }

  let reservation: ReservationDto;
  try {
    reservation = await serverApi<ReservationDto>(
      `/dining/reservations/${encodeURIComponent(ref)}`,
      viewer.userId,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Frame>
        <p className="label">Reservation</p>
        <h1 className="mt-2 text-3xl">Could not open this reservation.</h1>
        <div className="mt-4">
          <ApiOffline
            title="Reservation unavailable"
            message={
              error instanceof ApiError
                ? error.message
                : 'The booking API is offline. Start the API on port 3001, then try again.'
            }
          />
        </div>
      </Frame>
    );
  }

  const isNew = (Array.isArray(query.new) ? query.new[0] : query.new) === '1';
  const phase = phasePresentation(reservation.phase);
  const status = reservationStatusPresentation(reservation.status);
  const isTourist = viewer.user.role === 'TOURIST';
  const hours = reservationHours(reservation);

  return (
    <>
      <main className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <Link
          href="/bookings"
          className="inline-flex min-h-11 items-center gap-1.5 text-[12px] text-mist transition-colors hover:text-foam print:hidden"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          My bookings
        </Link>

        {isNew && reservation.status === 'CONFIRMED' ? (
          <div
            role="status"
            className="mt-4 flex gap-3 rounded-xl border border-success/35 bg-success/8 px-4 py-3"
          >
            <CircleCheck aria-hidden className="mt-0.5 h-4 w-4 flex-none text-success" />
            <p className="text-[13px] font-semibold text-foam">Table reserved</p>
          </div>
        ) : null}

        <header className="mt-5 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label">Table reservation · Asia/Dhaka</p>
            <h1 className="mt-2 break-all font-mono text-[24px] tracking-[0.02em] text-foam sm:text-[30px]">
              {reservation.publicRef}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge tone={phase.tone}>{phase.label}</Badge>
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone="sand">Demo deposit</Badge>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="label">Deposit · simulated</p>
            <p className="mt-1 font-display text-[32px] leading-none text-foam sm:text-[38px]">
              {reservation.depositMinor > 0 ? formatMoney(reservation.depositMinor) : 'None'}
            </p>
            <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist">
              Placed {formatDateTime(reservation.placedAt)}
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[348px_1fr] lg:items-start">
          <aside className="space-y-4">
            <Panel className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">Check-in</p>
                  <h2 className="mt-1 text-[19px]">Show this at the venue</h2>
                </div>
                <Badge tone={reservation.ticket ? 'success' : 'neutral'}>
                  {reservation.ticket ? 'Valid' : 'No QR'}
                </Badge>
              </div>
              <div className="mt-4">
                {reservation.ticket ? (
                  <TicketQr payload={reservation.ticket.payload} code={reservation.ticket.code} />
                ) : (
                  <div className="rounded-2xl border border-line bg-abyss/40 p-5 text-center">
                    <TriangleAlert aria-hidden className="mx-auto h-5 w-5 text-mist" />
                    <p className="mt-2 font-display text-[16px] text-foam">
                      {reservation.status === 'CHECKED_IN'
                        ? 'Already checked in'
                        : reservation.status === 'CANCELLED'
                          ? 'Reservation cancelled'
                          : 'Reservation ended'}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-mist">
                      The QR code is only shown while the reservation is confirmed and upcoming.
                      The reference above still works for the desk.
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-[10.5px] leading-relaxed text-mist">
                Demo ticket — not a real payment. Check-in opens 30 minutes before the start.
              </p>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-start gap-2">
                <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sea" />
                <div>
                  <p className="label">What to know</p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist">
                    This is a prototype demo. Deposits and refunds are simulated by a mock provider
                    and no real money moves. Times use Asia/Dhaka (UTC+6).
                  </p>
                </div>
              </div>

              {reservation.status === 'CANCELLED' ? (
                <div className="mt-3 rounded-xl border border-line bg-abyss/40 px-3 py-2.5">
                  <p className="text-[11px] text-foam">
                    Cancelled
                    {reservation.cancelledAt ? ` ${formatDateTime(reservation.cancelledAt)}` : ''}
                  </p>
                  {reservation.cancelReason ? (
                    <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                      Reason: {reservation.cancelReason}
                    </p>
                  ) : null}
                </div>
              ) : reservation.canCancel && isTourist ? (
                <div className="mt-4 border-t border-line pt-3">
                  <ReservationCancel
                    publicRef={reservation.publicRef}
                    depositMinor={reservation.depositMinor}
                  />
                </div>
              ) : isTourist && reservation.status === 'CONFIRMED' ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-abyss/40 px-3 py-2.5">
                  <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-mist" />
                  <p className="text-[10.5px] leading-relaxed text-mist">
                    Cancellation closed 60 minutes before the start. Ask the venue desk if you need
                    help on the day.
                  </p>
                </div>
              ) : !isTourist ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-sand/30 bg-sand/5 px-3 py-2.5">
                  <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sand" />
                  <p className="text-[10.5px] leading-relaxed text-mist">
                    You are viewing as admin. Cancellation here belongs to the tourist who reserved;
                    the venue desk uses the admin tools.
                  </p>
                </div>
              ) : null}
            </Panel>
          </aside>

          <div className="space-y-5">
            <Panel className="overflow-hidden">
              <div className="border-b border-line px-4 py-3.5">
                <p className="label">Venue</p>
                <h2 className="mt-1 text-[20px]">{reservation.venue.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-4">
                <Detail label="Date" value={formatIsoDate(reservation.startAt)} />
                <Detail
                  label="Time"
                  value={`${formatIsoTime(reservation.startAt)}–${formatIsoTime(reservation.endAt)}`}
                />
                <Detail label="Duration" value={durationLabel(hours)} />
                <Detail label="Table" value={reservation.table.code} />
                <Detail
                  label="Party"
                  value={`${reservation.partySize} ${reservation.partySize === 1 ? 'guest' : 'guests'}`}
                />
                {reservation.checkedInAt ? (
                  <Detail label="Checked in" value={formatDateTime(reservation.checkedInAt)} />
                ) : null}
              </div>
              {reservation.note ? (
                <div className="border-t border-line px-4 py-3">
                  <p className="label">Your note</p>
                  <p className="mt-1 whitespace-pre-line text-[12px] text-foam">
                    {reservation.note}
                  </p>
                </div>
              ) : null}
            </Panel>

            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
                <div>
                  <p className="label">Ledger</p>
                  <h2 className="mt-1 text-[19px]">Deposit payments</h2>
                </div>
                <Badge tone="neutral">Simulated</Badge>
              </div>
              {reservation.payments.length === 0 ? (
                <p className="px-4 py-5 text-[12px] text-mist">
                  No deposit was required, so no payment rows exist.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {reservation.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="text-[12px] text-foam">{paymentTypeLabel(payment.type)}</p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-mist">
                          {payment.provider} · {formatDateTime(payment.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={
                            payment.type === 'REFUND'
                              ? 'font-mono text-[12.5px] text-success'
                              : 'font-mono text-[12.5px] text-foam'
                          }
                        >
                          {payment.type === 'REFUND' ? '−' : ''}
                          {formatMoney(payment.amountMinor)}
                        </p>
                        <p className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mist">
                          Succeeded · mock
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">{children}</main>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist/70">{label}</p>
      <p className="mt-0.5 font-mono text-[11px] text-foam">{value}</p>
    </div>
  );
}
