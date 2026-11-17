import type { Metadata } from 'next';
import { Card } from '@/components/ui/display';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader
        title="About Coastline"
        backHref="/profile"
        backLabel="Back"
        className="lg:pt-6"
      />
      <div className="space-y-4 text-body">
        <p>
          Coastline brings what a visitor needs at a destination into one place: pick a destination
          and a spot, then find and book stays, food, sunbeds and more, keep every ticket in Trips,
          and get help on the spot.
        </p>
        <p>
          Coastline is an independent platform. It is not run or endorsed by any government body.
          Providers set their own prices, and Coastline earns a commission on each booking.
        </p>
        <p className="text-body-sm text-muted">
          Payments currently run through a sandbox gateway: every payment, refund and commission is
          recorded, and no money moves.
        </p>
        <Card id="providers" className="scroll-mt-24 p-5">
          <h2 className="text-title-sm">Become a provider</h2>
          <p className="mt-1 text-body-sm text-muted">
            Hotels, restaurants, sunbed operators, boats, tours, guides and photographers will be
            able to apply from the provider portal. Applications open in a coming update.
          </p>
        </Card>
      </div>
    </div>
  );
}
