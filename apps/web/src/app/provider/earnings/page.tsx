import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Earnings' };

export default function Page() {
  return (
    <ComingSoon
      title="Earnings"
      body="Gross, commission and net per booking, with payouts."
      workPackage="WP-19"
    />
  );
}
