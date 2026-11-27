import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Providers' };

export default function Page() {
  return (
    <ComingSoon
      title="Providers"
      body="Provider applications, approvals and accounts."
      workPackage="WP-16"
    />
  );
}
