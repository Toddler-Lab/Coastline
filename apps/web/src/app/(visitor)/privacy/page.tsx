import type { Metadata } from 'next';
import { Notice } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Privacy' };

export default function PrivacyPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader title="Privacy" backHref="/profile" backLabel="Back" className="lg:pt-6" />
      <div className="space-y-4 text-body">
        <Notice tone="info" title="The full privacy notice is being prepared">
          It is published before sign-in and real payments launch.
        </Notice>
        <p className="text-body-sm text-muted">
          Today the app uses seeded demo accounts. Providers see the name on a booking; Coastline
          never asks for card numbers, PINs or one-time codes.
        </p>
      </div>
    </div>
  );
}
