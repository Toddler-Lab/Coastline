import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Info, MapPin, ShieldCheck } from 'lucide-react';
import type { FoodOrderDto } from '@coastline/api-contracts';
import { ApiError, serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { paymentTypeLabel } from '@/lib/booking';
import { formatMoney } from '@/lib/format';
import {
  foodStatusPresentation,
  formatDhakaStamp,
  isTerminalFoodStatus,
} from '@/lib/dining/delivery';
import { ApiOffline } from '@/components/booking/api-offline';
import { FoodOrderAutoRefresh } from '@/components/dining/food-order-auto-refresh';
import { FoodOrderCancel } from '@/components/dining/food-order-cancel';
import { FoodOrderTimeline } from '@/components/dining/food-order-timeline';
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
    title: `Food order ${ref}`,
    description: 'Sunbed food delivery tracking. Prices and payments are simulated.',
  };
}

export default async function FoodOrderPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const viewer = await getViewer();

  if (!viewer.user) {
    return (
      <Shell>
        <Unavailable message="Start the API on port 3001, then try again. Orders are fetched live so the status is never stale." />
      </Shell>
    );
  }

  let order: FoodOrderDto;
  try {
    order = await serverApi<FoodOrderDto>(
      `/dining/food-orders/${encodeURIComponent(ref)}`,
      viewer.userId,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Shell>
        <Unavailable
          message={
            error instanceof ApiError
              ? error.message
              : 'The booking API is offline. Start the API on port 3001, then try again.'
          }
        />
      </Shell>
    );
  }

  const status = foodStatusPresentation(order.status);
  const isTourist = viewer.user.role === 'TOURIST';
  const terminal = isTerminalFoodStatus(order.status);

  return (
    <Shell>
      <FoodOrderAutoRefresh active={!terminal} />

      <header className="mt-5 flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label">Sunbed food order · Asia/Dhaka</p>
          <h1 className="mt-2 break-all font-mono text-[24px] tracking-[0.02em] text-foam sm:text-[30px]">
            {order.publicRef}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone="sand">Demo payment</Badge>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="label">Total · simulated</p>
          <p className="mt-1 font-display text-[32px] leading-none text-foam sm:text-[38px]">
            {formatMoney(order.totalMinor)}
          </p>
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.1em] text-mist">
            Placed {formatDhakaStamp(order.placedAt)}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[348px_1fr] lg:items-start">
        <aside className="space-y-4">
          <Panel className="p-4">
            <p className="label">Progress</p>
            <h2 className="mt-1 text-[19px]">{order.venue.name}</h2>
            <div className="mt-4">
              <FoodOrderTimeline order={order} />
            </div>
            {!terminal ? (
              <p className="mt-4 text-[10.5px] leading-relaxed text-mist">
                This page refreshes on its own while the kitchen works on your order.
              </p>
            ) : null}
          </Panel>

          <Panel className="p-4">
            <div className="flex items-start gap-2">
              <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sea" />
              <div>
                <p className="label">Delivering to</p>
                <p className="mt-1.5 font-mono text-[15px] text-foam">
                  Sunbed {order.delivery.sunbedCode}
                </p>
                <p className="mt-0.5 text-[12px] text-mist">
                  {order.delivery.beachPointName} · {order.delivery.beachPointCode}
                </p>
              </div>
            </div>

            {order.status === 'CANCELLED' ? (
              <div className="mt-4 rounded-xl border border-line bg-abyss/40 px-3 py-2.5">
                <p className="text-[11px] text-foam">
                  Cancelled{order.cancelledAt ? ` ${formatDhakaStamp(order.cancelledAt)}` : ''}
                </p>
                {order.cancelReason ? (
                  <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                    Reason: {order.cancelReason}
                  </p>
                ) : null}
                <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                  The demo charge was refunded in full.
                </p>
              </div>
            ) : order.canCancel && isTourist ? (
              <div className="mt-4 border-t border-line pt-3">
                <FoodOrderCancel publicRef={order.publicRef} totalMinor={order.totalMinor} />
              </div>
            ) : !isTourist ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-sand/30 bg-sand/5 px-3 py-2.5">
                <ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sand" />
                <p className="text-[10.5px] leading-relaxed text-mist">
                  You are viewing as admin. Status changes happen on the kitchen board.
                </p>
              </div>
            ) : !terminal ? (
              <p className="mt-4 text-[10.5px] leading-relaxed text-mist">
                The kitchen has started, so this order can no longer be cancelled.
              </p>
            ) : null}
          </Panel>

          <Panel className="p-4">
            <div className="flex items-start gap-2">
              <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-sea" />
              <p className="text-[11.5px] leading-relaxed text-mist">
                Prototype demo. Menu prices are indicative and the charge and any refund are
                simulated with a mock provider — no real money moves. Times use Asia/Dhaka (UTC+6).
              </p>
            </div>
          </Panel>
        </aside>

        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-line px-4 py-3.5">
              <div>
                <p className="label">Items · {order.lines.length}</p>
                <h2 className="mt-1 text-[19px]">Your order</h2>
              </div>
              <Badge tone="neutral">Demo prices</Badge>
            </div>
            <ul className="divide-y divide-line">
              {order.lines.map((line) => (
                <li key={line.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[13px] text-foam">{line.name}</p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-mist">
                      {line.quantity} × {formatMoney(line.unitPriceMinor)}
                    </p>
                  </div>
                  <p className="font-mono text-[12.5px] text-foam">{formatMoney(line.totalMinor)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-line px-4 py-3 text-[12px]">
              <div className="flex justify-between text-mist">
                <span>Subtotal</span>
                <span className="font-mono">{formatMoney(order.subtotalMinor)}</span>
              </div>
              <div className="flex justify-between text-mist">
                <span>Delivery to sunbed</span>
                <span className="font-mono">Free</span>
              </div>
              <div className="flex items-baseline justify-between pt-1 text-foam">
                <span className="label">Total · simulated</span>
                <span className="font-mono text-[15px]">{formatMoney(order.totalMinor)}</span>
              </div>
            </div>
            {order.note ? (
              <p className="border-t border-line px-4 py-3 text-[12px] text-mist">
                <span className="label mr-2">Note</span>
                {order.note}
              </p>
            ) : null}
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
                        {payment.provider} · {formatDhakaStamp(payment.createdAt)}
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
                        {payment.status === 'SUCCEEDED' ? 'Succeeded' : 'Failed'} · mock
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="mt-6 max-w-xl">
      <h1 className="text-3xl">Could not open this order.</h1>
      <div className="mt-4">
        <ApiOffline title="Order unavailable" message={message} />
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-[1080px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <Link
          href="/bookings"
          className="inline-flex min-h-11 items-center gap-1.5 text-[12px] text-mist transition-colors hover:text-foam"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          My bookings
        </Link>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
