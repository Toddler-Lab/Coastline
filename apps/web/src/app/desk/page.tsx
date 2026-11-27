import type { Metadata } from 'next';
import { StaffPage } from '@/components/workspace/staff-page-shell';
import { TicketScanner } from '@/components/workspace/ticket-scanner';

export const metadata: Metadata = { title: 'Scan' };

export default function DeskScanPage() {
  return (
    <StaffPage title="Scan" description="Check guests in for sunbeds, rooms and tables.">
      <TicketScanner />
    </StaffPage>
  );
}
