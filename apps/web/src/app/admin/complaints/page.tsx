import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Complaints' };

export default function Page() {
  return (
    <ComingSoon
      title="Complaints"
      body="Escalated complaints and their resolution."
      workPackage="WP-22"
    />
  );
}
