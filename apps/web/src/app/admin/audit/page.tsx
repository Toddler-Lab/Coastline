import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Audit' };

export default function Page() {
  return (
    <ComingSoon
      title="Audit"
      body="Search the audit log of privileged actions."
      workPackage="WP-18"
    />
  );
}
