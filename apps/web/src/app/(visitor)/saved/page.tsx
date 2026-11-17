import type { Metadata } from 'next';
import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Saved' };

export default function SavedPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader title="Saved" className="lg:pt-6" />
      <EmptyState
        icon={Heart}
        className="mt-4"
        title="Nothing saved yet"
        body="Saving stays, places to eat, spots and photographers arrives in a coming update. Until then, find them again from Explore or search."
        action={{ label: 'Explore', href: '/' }}
      />
    </div>
  );
}
