import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Lost and found' };

export default function Page() {
  return (
    <ComingSoon
      title="Lost and found"
      body="Oversight of found items, claims and handovers."
      workPackage="WP-21"
    />
  );
}
