import type { Metadata } from 'next';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Inbox' };

export default function InboxPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader title="Inbox" className="lg:pt-6" />
      <EmptyState
        icon={Inbox}
        className="mt-4"
        title="No messages"
        body="Conversations with providers and booking updates will appear here. For now, booking status lives on each ticket in Trips."
        action={{ label: 'Open Trips', href: '/trips' }}
      />
    </div>
  );
}
