import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Requests' };

export default function Page() {
  return (
    <ComingSoon
      title="Requests"
      body="Open photographer and guide requests near you, with bidding."
      workPackage="WP-27"
    />
  );
}
