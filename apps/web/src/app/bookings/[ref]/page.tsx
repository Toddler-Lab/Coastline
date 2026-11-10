import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CircleCheck, Clock, Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { OrderDto } from '@coastline/api-contracts';
import { ApiError, serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import {
  durationLabel,
  isoDateKey,
  itemStatusPresentation,
  orderPhase,
  orderWindow,
  paymentTypeLabel,
  phasePresentation,
  shortPointName,
} from '@/lib/booking';
import {
  formatDateTime,
  formatIsoDate,
  formatIsoTime,
  formatLongDateKey,
  formatMoney,
} from '@/lib/format';
import { ApiOffline } from '@/components/booking/api-offline';
import { CancelOrder } from '@/components/booking/cancel-order';
import { TicketQr } from '@/components/booking/ticket-qr';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { SiteFooter } from '@/components/site/site-footer';

/**
 * The app is dark-first; browsers drop backgrounds when printing, so the
 * ticket forces ink colours and hides the site chrome on paper.
 */
const PRINT_STYLES = `
@media print {
  header.sticky,
  footer {
    display: none !important;
  }
  main.ticket-print {
    max-width: none !important;
    padding: 0 !important;
  }
  .ticket-print .panel {
    background: #fff !important;
    border-color: #c8c8c8 !important;
    box-shadow: none !important;
  }
  .ticket-print h1,
  .ticket-print h2,
  .ticket-print h3,
  .ticket-print p,
  .ticket-print span,
  .ticket-print li,
  .ticket-print a {
    color: #14181b !important;
  }
  .ticket-print li {
    break-inside: avoid;
  }
}
`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}): Promise<Metadata> {
  const { ref } = await params;
  return {
    title: `Ticket ${ref}`,
    description: 'Demo sunbed ticket and QR check-in code.',
  };
}

export default async function TicketPage({
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
      <main className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <p className="label">Ticket</p>
        <h1 className="mt-2 text-3xl">Could not open this ticket.</h1>
        <div className="mt-4">
          <ApiOffline
            title="The API is offline"
            message="Start the API on port 3001, then try again. Tickets are fetched live so a stale QR can never be shown."
          />
        </div>
      </main>
    );
  }

  let order: OrderDto;
  try {
    order = await serverApi<OrderDto>(`/orders/${encodeURIComponent(ref)}`, viewer.userId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    const message =
      error instanceof ApiError
        ? error.message
        : 'The booking API is offline. Start the API on port 3001, then try again.';
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-16 sm:px-6">
        <p className="label">Ticket</p>
        <h1 className="mt-2 text-3xl">Could not open this ticket.</h1>
        <div className="mt-4">
          <ApiOffline title="Ticket unavailable" message={message} />
        </div>
      </main>
    );
  }

  const isNew = (Array.isArray(query.new) ? query.new[0] : query.new) === '1';
  const phase = orderPhase(order);
  const presentation = phasePresentation(phase);
  const window = orderWindow(order);
  const points = [...new Set(order.items.map((item) => item.beachPointName))];
  const isTourist = viewer.user.role === 'TOURIST';
  const showCancel = order.canCancel && isTourist;

  return (
    <>
      <style>{PRINT_STYLES}</style>
      <main className="ticket-print mx-auto w-full max-w-[1080px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <Link
          href="/bookings"
          className="inline-flex min-h-11 items-center gap-1.5 text-[12px] text-mist transition-colors hover:text-foam print:hidden"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          My bookings
        </Link>

        {isNew && order.status === 'CONFIRMED' ? (
          <div
            role="status"
            className="mt-4 flex gap-3 rounded-xl border border-success/35 bg-success/8 px-4 py-3"
          >
            <CircleCheck aria-hidden className="mt-0.5 h-4 w-4 flex-none text-success" />
            <div>
              <p className="text-[13px] font-semibold text-foam">Booking confirmed</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-mist">
                Your beds are reserved and the demo charge is recorded. Show the QR ticket at the
                bed — no real payment was taken.
              </p>
            </div>
          </div>
        ) : null}

        <header className="mt-5 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label">Ticket · Asia/Dhaka</p>
            <h1 className="mt-2 break-all font-mono text-[24px] tracking-[0.02em] text-foam sm:text-[30px]">
              {order.publicRef}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge tone={presentation.tone}>{presentation.label}</Badge>
              <Badge tone={order.status === 'CONFIRMED' ? 'sea' : 'danger'}>
                {order.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
              </Badge>
              <Badge tone="sand">Demo payment</Badge>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="label">Total paid · simulated</p>
            <p className="mt-1 font-display text-[32px] leading-none text-foam sm:text-[38px]">
              {formatMoney(order.totalMinor)}
            </p>
            <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist">
              Placed {formatDateTime(order.placedAt)}
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-5 lg:grid-cols-[348px_1fr] lg:items-start">
          <aside className="space-y-4">
            <Panel className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="label">Check-in</p>
                  <h2 className="mt-1 text-[19px]">Show this at the bed</h2>
                </div>
                <Badge tone={order.ticket ? 'success' : 'danger'}>
                  {order.ticket ? 'Valid' : 'Void'}
                </Badge>
              </div>

              <div className="mt-4">
                {order.ticket ? (
                  <TicketQr payload={order.ticket.payload} code={order.ticket.code} />
                ) : (
                  <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-center">
                    <TriangleAlert aria-hidden className="mx-auto h-5 w-5 text-danger" />
                    <p className="mt-2 font-display text-[16px] text-foam">Ticket void</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-mist">
                      This booking was cancelled, so the QR code has been withdrawn. Any refund is
                      listed below.
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-3 text-center text-[10.5px] leading-relaxed text-mist">
                Show this at the bed. Demo ticket — not a real payment.
              </p>
            </Panel>

            <Panel className="p-4">
              <div className="flex items-start gap-2">
                <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sea" />
                <div>
                  <p className="label">What to know</p>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-mist">
                    This is a prototype demo. Prices, payments and refunds are simulated and the QR
                    code is only checked by the demo desk. Times use Asia/Dhaka (UTC+6).
                  </p>
                </div>
              </div>

              {order.status === 'CANCELLED' ? (
                <div className="mt-3 rounded-xl border border-line bg-abyss/40 px-3 py-2.5">
                  <p className="text-[11px] text-foam">
                    Cancelled
                    {order.cancelledAt ? ` ${formatDateTime(order.cancelledAt)}` : ''}
                  </p>
                  {order.cancelReason ? (
                    <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                      Reason: {order.cancelReason}
                    </p>
                  ) : null}
                  <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                    The mock charge was refunded in full.
                  </p>
                </div>
              ) : showCancel ? (
                <div className="mt-4 border-t border-line pt-3">
                  <CancelOrder publicRef={order.publicRef} totalMinor={order.totalMinor} />
                </div>
              ) : isTourist && order.status === 'CONFIRMED' ? (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-abyss/40 px-3 py-2.5">
                  <Clock aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-mist" />
                  <p className="text-[10.5px] leading-relaxed text-mist">
                    Cancellation closed 60 minutes before the earliest hour. Contact the demo desk
                    if you need help on the day.
                  </p>
                </div>
              ) : (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-sand/30 bg-sand/5 px-3 py-2.5">
                  <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sand" />
                  <p className="text-[10.5px] leading-relaxed text-mist">
                    You are viewing as admin. Cancellation belongs to the tourist persona who placed
                    this booking.
                  </p>
                </div>
              )}
            </Panel>
          </aside>

          <div className="space-y-5">
            <Panel className="overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line px-4 py-3.5">
                <div>
                  <p className="label">Beds · {order.items.length}</p>
                  <h2 className="mt-1 text-[19px]">
                    {points.map(shortPointName).join(' · ') || 'Beach booking'}
                  </h2>
                </div>
                {window ? (
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-mist">
                    {formatLongDateKey(window.dateKey)}
                    {window.sameDhakaDay ? ` · ${window.timeLabel}` : ''}
                  </p>
                ) : null}
              </div>

              <ul className="divide-y divide-line">
                {order.items.map((item) => {
                  const status = itemStatusPresentation(item.status);
                  const itemPhase = phasePresentation(item.phase);
                  const hours = Math.max(
                    1,
                    Math.round(
                      (Date.parse(item.endAt) - Date.parse(item.startAt)) / (60 * 60 * 1000),
                    ),
                  );
                  const sameDay = isoDateKey(item.startAt) === isoDateKey(item.endAt);
                  return (
                    <li key={item.id} className="px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[14px] text-foam">{item.sunbedCode}</p>
                          <p className="mt-0.5 text-[11px] text-mist">
                            {shortPointName(item.beachPointName)} · {item.beachPointCode}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={itemPhase.tone}>{itemPhase.label}</Badge>
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                        <Detail label="Date" value={formatIsoDate(item.startAt)} />
                        <Detail
                          label="Time"
                          value={
                            sameDay
                              ? `${formatIsoTime(item.startAt)}–${formatIsoTime(item.endAt)}`
                              : `${formatIsoTime(item.startAt)} → ${formatIsoTime(item.endAt)}`
                          }
                        />
                        <Detail label="Duration" value={durationLabel(hours)} />
                        <Detail
                          label="Unit price"
                          value={`${formatMoney(item.unitPriceMinor)} / hour`}
                        />
                      </div>

                      <div className="mt-3 flex items-baseline justify-between border-t border-line/70 pt-2.5">
                        <p className="label">Line total</p>
                        <p className="font-mono text-[12.5px] text-foam">
                          {formatMoney(item.totalMinor)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
                <div>
                  <p className="label">Ledger</p>
                  <h2 className="mt-1 text-[19px]">Payments</h2>
                </div>
                <Badge tone="neutral">Simulated</Badge>
              </div>
              {order.payments.length === 0 ? (
                <p className="px-4 py-5 text-[12px] text-mist">No payment rows on this order.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {order.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="text-[12px] text-foam">{paymentTypeLabel(payment.type)}</p>
                        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-mist">
                          {payment.provider} · {formatDateTime(payment.createdAt)}
                        </p>
                        {payment.externalRef ? (
                          <p className="mt-0.5 break-all font-mono text-[8.5px] text-mist/60">
                            {payment.externalRef}
                          </p>
                        ) : null}
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist/70">{label}</p>
      <p className="mt-0.5 font-mono text-[11px] text-foam">{value}</p>
    </div>
  );
}
