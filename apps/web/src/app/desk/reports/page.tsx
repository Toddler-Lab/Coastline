import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Reports' };

export default function Page() {
  return (
    <ComingSoon
      title="Reports"
      body="Complaints for this desk's destination: acknowledge, note, escalate, resolve."
      workPackage="WP-22 and WP-23"
    />
  );
}
