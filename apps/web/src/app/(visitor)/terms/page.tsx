import type { Metadata } from 'next';
import { Notice } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Terms' };

export default function TermsPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader title="Terms" backHref="/profile" backLabel="Back" className="lg:pt-6" />
      <Notice tone="info" title="Terms are being prepared">
        The full terms of use are published before Coastline takes real payments. Until then,
        bookings are made through a sandbox gateway and no money moves.
      </Notice>
    </div>
  );
}
