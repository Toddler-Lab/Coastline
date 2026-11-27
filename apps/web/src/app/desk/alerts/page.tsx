import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Alerts' };

export default function Page() {
  return (
    <ComingSoon
      title="Alerts"
      body="Post and end spot alerts such as rough sea."
      workPackage="WP-20"
    />
  );
}
