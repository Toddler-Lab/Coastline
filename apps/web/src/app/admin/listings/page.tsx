import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Listings' };

export default function Page() {
  return (
    <ComingSoon
      title="Listings"
      body="Listing approval queue with a diff of changes."
      workPackage="WP-18"
    />
  );
}
