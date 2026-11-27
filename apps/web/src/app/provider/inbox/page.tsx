import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Inbox' };

export default function Page() {
  return (
    <ComingSoon
      title="Inbox"
      body="Conversations with guests about their bookings."
      workPackage="WP-24"
    />
  );
}
