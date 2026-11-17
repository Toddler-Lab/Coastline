import type { Metadata } from 'next';
import { PackageOpen, PackageSearch } from 'lucide-react';
import { Card } from '@/components/ui/display';
import { EmptyState, Notice } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Lost and found' };

export default function LostFoundPage() {
  return (
    <div className="page max-w-3xl">
      <PageHeader
        title="Lost and found"
        backHref="/help"
        backLabel="Back to Help"
        className="lg:pt-6"
      />
      <div className="space-y-6">
        <Notice tone="info" title="Reporting items in the app is coming soon">
          Until then, ask the staff at the spot or the venue where you lost or found the item.
        </Notice>
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5 opacity-70">
            <PackageSearch aria-hidden className="size-8 text-primary" />
            <h2 className="mt-2 text-title-sm">I lost something</h2>
            <p className="text-body-sm text-muted">
              Describe it, where and when. We match it with items found at the desk.
            </p>
          </Card>
          <Card className="p-5 opacity-70">
            <PackageOpen aria-hidden className="size-8 text-primary" />
            <h2 className="mt-2 text-title-sm">I found something</h2>
            <p className="text-body-sm text-muted">
              Log it and hand it to the spot desk so the owner can claim it.
            </p>
          </Card>
        </div>
        <section aria-labelledby="board-title">
          <h2 id="board-title" className="mb-3 text-title">
            Found items
          </h2>
          <EmptyState
            title="No found items listed"
            body="Items handed to a spot desk will be listed here with a general description. Private details stay with the desk."
          />
        </section>
      </div>
    </div>
  );
}
