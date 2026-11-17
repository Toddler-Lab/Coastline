import type { Metadata } from 'next';
import { HeartPulse } from 'lucide-react';
import { Card } from '@/components/ui/display';
import { EmptyState } from '@/components/ui/states';
import { EmergencyCallCard, NoDispatchNote } from '@/components/patterns/help-blocks';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Emergency' };

export default function EmergencyPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader title="Emergency" backHref="/help" backLabel="Back to Help" className="lg:pt-6" />
      <div className="space-y-6">
        <EmergencyCallCard />
        <NoDispatchNote />
        <Card className="p-4">
          <h2 className="text-title-sm">When you call</h2>
          <p className="mt-1 text-body-sm text-muted">
            Say where you are: the destination, the spot name and a landmark you can see. Spot names
            are on every page in Coastline.
          </p>
        </Card>
        <section aria-labelledby="nearby-title">
          <h2 id="nearby-title" className="mb-3 text-title">
            Hospitals and first aid nearby
          </h2>
          <EmptyState
            icon={HeartPulse}
            title="Not listed yet"
            body="Local hospitals, first aid and lifeguard posts will be listed here per destination. Call 999 if you need help now."
          />
        </section>
        <p className="text-caption text-muted">
          Source: Bangladesh national emergency service number 999.
        </p>
      </div>
    </div>
  );
}
