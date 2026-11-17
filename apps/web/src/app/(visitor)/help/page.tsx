import type { Metadata } from 'next';
import { CANCEL_CUTOFF_MINUTES } from '@coastline/api-contracts';
import { Card } from '@/components/ui/display';
import { HelpMenu } from '@/components/patterns/help';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Help' };

const FAQ = [
  {
    q: 'Where is my ticket?',
    a: 'Every booking has a ticket in Trips. Open it and show the QR code, or tell staff the code under it.',
  },
  {
    q: 'How do I cancel?',
    a: `Open the booking in Trips and choose Cancel. Sunbeds, rooms and tables cancel free until ${CANCEL_CUTOFF_MINUTES} minutes before the start; food orders until the kitchen starts preparing. Refunds go back to the original payment.`,
  },
  {
    q: 'Who sets the prices?',
    a: 'Each provider sets its own prices. Coastline is an independent platform and earns a commission from the provider on bookings; prices are not official tariffs.',
  },
  {
    q: 'Is my payment real?',
    a: 'Payments currently run through a sandbox gateway. Every payment and refund is recorded with its provider shown on the receipt, and no money moves.',
  },
  {
    q: 'What times are shown?',
    a: 'All dates and times are Bangladesh time.',
  },
];

export default function HelpPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader
        title="Help centre"
        backHref="/"
        backLabel="Back to Explore"
        className="lg:pt-6"
      />
      <HelpMenu />
      <section aria-labelledby="faq-title" className="mt-10">
        <h2 id="faq-title" className="mb-3 text-title">
          Common questions
        </h2>
        <Card className="divide-y divide-line">
          {FAQ.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 text-label">
                {item.q}
                <span
                  aria-hidden
                  className="text-title text-muted transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="px-4 pb-4 text-body-sm text-muted">{item.a}</p>
            </details>
          ))}
        </Card>
      </section>
    </div>
  );
}
