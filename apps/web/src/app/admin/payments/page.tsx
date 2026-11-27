import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Payments' };

export default function Page() {
  return (
    <ComingSoon
      title="Payments"
      body="Payment records, refunds and commission, with the provider of each payment."
      workPackage="WP-19"
    />
  );
}
