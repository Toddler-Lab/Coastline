import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Payouts' };

export default function Page() {
  return (
    <ComingSoon
      title="Payouts"
      body="Draft, approve and mark provider payouts paid."
      workPackage="WP-19"
    />
  );
}
