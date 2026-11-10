import type { Metadata } from 'next';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import type { OrderDto } from '@coastline/api-contracts';
import { ApiError, serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { orderPhase, orderWindow } from '@/lib/booking';
import { ApiOffline } from '@/components/booking/api-offline';
import { BookingCard } from '@/components/booking/booking-card';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { SiteFooter } from '@/components/site/site-footer';

export const metadata: Metadata = {
  title: 'My bookings',
  description:
    'Upcoming and past sunbed bookings for the current demo persona. Tickets and payments are simulated.',
};

export default async function BookingsPage() {
  const viewer = await getViewer();

  if (!viewer.user) {
    return (
      <PageFrame>
        <ApiOffline
          title="Bookings need a persona"
          message="The booking API is offline, so this demo cannot resolve the signed-in persona. Start the API on port 3001, then try again."
        />
      </PageFrame>
    );
  }

  if (viewer.user.role === 'ADMIN') {
    return (
      <PageFrame>
        <EmptyState
          title="Bookings follow the tourist persona"
          body="You are viewing as Coastline Admin. Bookings, payments and QR tickets are stored against tourist personas, so this list is empty for an admin. Switch persona in the header to see a tourist's tickets."
          action={
            <Link href="/" className={buttonClass('secondary', 'md')}>
              Back to the beach map
            </Link>
          }
        />
      </PageFrame>
    );
  }

  let orders: OrderDto[];
  try {
    orders = await serverApi<OrderDto[]>('/orders/me', viewer.userId);
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : 'The booking API is offline. Start the API on port 3001, then try again.';
    return (
      <PageFrame>
        <ApiOffline title="Could not load your bookings" message={message} />
      </PageFrame>
    );
  }

  const withWindows = orders.map((order) => ({ order, window: orderWindow(order) }));
  const upcoming = withWindows
    .filter(({ order }) => order.status === 'CONFIRMED' && orderPhase(order) !== 'PAST')
    .sort((left, right) => {
      const leftAt = left.window ? Date.parse(left.window.startAt) : 0;
      const rightAt = right.window ? Date.parse(right.window.startAt) : 0;
      return leftAt - rightAt;
    });
  const history = withWindows
    .filter(({ order }) => order.status === 'CANCELLED' || orderPhase(order) === 'PAST')
    .sort((left, right) => {
      const leftAt = left.window ? Date.parse(left.window.startAt) : 0;
      const rightAt = right.window ? Date.parse(right.window.startAt) : 0;
      return rightAt - leftAt;
    });

  return (
    <PageFrame>
      {orders.length === 0 ? (
        <EmptyState
          title="No tickets yet"
          body="Pick a numbered beach point on the map, choose a free bed and an hour window, then pay with the demo provider. Your QR ticket will appear here."
          action={
            <Link href="/" className={buttonClass('primary', 'md')}>
              Find a sunbed
            </Link>
          }
        />
      ) : (
        <div className="space-y-10">
          <BookingGroup
            eyebrow="Ahead"
            title="Upcoming"
            empty="No upcoming stays. The beach is still there."
            items={upcoming}
          />
          <BookingGroup
            eyebrow="Archive"
            title="History"
            empty="Nothing in the archive yet."
            items={history}
          />
        </div>
      )}
    </PageFrame>
  );
}

function BookingGroup({
  eyebrow,
  title,
  empty,
  items,
}: {
  eyebrow: string;
  title: string;
  empty: string;
  items: Array<{ order: OrderDto; window: ReturnType<typeof orderWindow> }>;
}) {
  return (
    <section aria-labelledby={`group-${title.toLowerCase()}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <div>
          <p className="label">{eyebrow}</p>
          <h2 id={`group-${title.toLowerCase()}`} className="mt-1 text-[22px]">
            {title}
          </h2>
        </div>
        <span className="font-mono text-[10px] text-mist">
          {items.length} {items.length === 1 ? 'booking' : 'bookings'}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong/60 px-4 py-5 text-[12px] text-mist">
          {empty}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(({ order }) => (
            <BookingCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mx-auto w-full max-w-[1120px] px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
        <header className="mb-8 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label">Tickets · Asia/Dhaka</p>
            <h1 className="mt-2 text-3xl sm:text-4xl">Your bookings</h1>
            <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-mist">
              Every booking is held against the current demo persona. Show the QR ticket at the bed;
              the booking reference is enough for manual check-in.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="sand">Demo payments</Badge>
            <Badge tone="neutral">
              <Ticket aria-hidden className="h-3 w-3" />
              Hourly beds
            </Badge>
            <Link href="/" className={buttonClass('secondary', 'md')}>
              Beach map
            </Link>
          </div>
        </header>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
