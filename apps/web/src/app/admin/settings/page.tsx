import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Settings' };

export default function Page() {
  return (
    <ComingSoon
      title="Settings"
      body="Commission rules per service type and platform settings."
      workPackage="WP-18 and WP-19"
    />
  );
}
