import type { Metadata } from 'next';
import { HeartPulse } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { currentDestinationSlug, loadDestination, loadDestinations } from '@/lib/places-server';
import { Card } from '@/components/ui/display';
import { EmptyState } from '@/components/ui/states';
import { EmergencyContacts, NoDispatchNote } from '@/components/patterns/help-blocks';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Emergency' };

export default async function EmergencyPage() {
  const viewer = await getViewer();
  const { destinations } = await loadDestinations(viewer.userId);
  const slug = await currentDestinationSlug(destinations);
  const destination = slug ? await loadDestination(slug, viewer.userId).catch(() => null) : null;

  return (
    <div className="page max-w-3xl">
      <PageHeader
        title="Emergency"
        subtitle={destination ? destination.name : undefined}
        backHref="/help"
        backLabel="Back to Help"
        className="lg:pt-6"
      />
      <div className="space-y-6">
        {/* Falls back to the national number 999 when no numbers are loaded. */}
        <EmergencyContacts contacts={destination?.emergencyContacts} />
        <NoDispatchNote />
        <Card className="p-4">
          <h2 className="text-title-sm">When you call</h2>
          <p className="mt-1 text-body-sm text-muted">
            Say where you are: the destination, the spot name and a landmark you can see. Spot names are on every page in
            Coastline.
          </p>
        </Card>
        <section aria-labelledby="nearby-title">
          <h2 id="nearby-title" className="mb-3 text-title">
            Hospitals and first aid nearby
          </h2>
          <EmptyState
            icon={HeartPulse}
            title="Not listed yet"
            body="Local hospitals, first aid and lifeguard posts will be listed here per destination. Call the numbers above if you need help now."
          />
        </section>
        <p className="text-caption text-muted">Numbers are entered by the operator for each destination; 999 is the national emergency service.</p>
      </div>
    </div>
  );
}
