import type { Metadata } from 'next';
import { CANCEL_CUTOFF_MINUTES } from '@coastline/api-contracts';
import { ChevronDown, LifeBuoy, Phone, ShieldCheck } from 'lucide-react';
import { HelpMenu } from '@/components/patterns/help';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Help & Support | Coastline' };

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
    <div className="page max-w-3xl pb-24">
      <PageHeader
        title="Help Centre & Safety"
        subtitle="24/7 emergency hotlines, booking policies, refunds and FAQs"
        backHref="/"
        backLabel="Back to Explore"
        className="lg:pt-6"
      />

      {/* Emergency banner */}
      <div className="mt-4 rounded-3xl border border-danger/30 bg-danger-soft/20 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-danger-soft text-danger">
              <Phone className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-danger">Emergency Hotlines</h3>
              <p className="text-xs text-muted">999 National Service · 01320-169999 Tourist Police</p>
            </div>
          </div>
          <a
            href="tel:999"
            className="rounded-full bg-danger px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-danger/90 transition-colors"
          >
            Call 999
          </a>
        </div>
      </div>

      <div className="mt-6">
        <HelpMenu />
      </div>

      <section aria-labelledby="faq-title" className="mt-10">
        <h2 id="faq-title" className="mb-4 text-lg font-bold text-fg">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-sm text-fg">
                {item.q}
                <ChevronDown aria-hidden className="size-4 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2.5 text-xs text-muted leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
