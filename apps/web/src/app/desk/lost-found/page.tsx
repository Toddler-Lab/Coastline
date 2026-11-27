import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Lost and found' };

export default function Page() {
  return (
    <ComingSoon
      title="Lost and found"
      body="Log found items, verify claims and hand items over."
      workPackage="WP-21 and WP-23"
    />
  );
}
