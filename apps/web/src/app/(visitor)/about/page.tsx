import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Store } from 'lucide-react';
import { PageHeader } from '@/components/patterns/spot-hub-sections';

export const metadata: Metadata = { title: 'About | Coastline' };

export default function AboutPage() {
  return (
    <div className="page max-w-3xl pb-24">
      <PageHeader
        title="About Coastline"
        subtitle="The independent multi-destination tourism platform for Bangladesh"
        backHref="/profile"
        backLabel="Back to Profile"
        className="lg:pt-6"
      />
      <div className="mt-4 space-y-6">
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Sparkles className="size-4" />
            <span>Modern Bangladesh Tourism Platform</span>
          </div>
          <p className="text-sm leading-relaxed text-fg">
            Coastline brings everything a visitor needs at a destination into one unified experience: choose a destination and spot, explore verified stays, beach sunbeds, and dining, store every digital pass in Trips, and access immediate local help on the ground.
          </p>
          <div className="rounded-2xl bg-surface-alt p-4 flex items-start gap-3">
            <ShieldCheck className="size-5 text-primary flex-none mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              Coastline is an independent platform. It is not run or endorsed by any government authority. Providers set their own prices, and Coastline earns an agreed commission on each completed booking.
            </p>
          </div>
        </div>

        <div id="providers" className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-fg font-bold text-base">
            <Store className="size-5 text-accent" />
            <h2>Become a Coastline Partner & Provider</h2>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Hotels, seaside resorts, restaurants, beach sunbed operators, lake trawlers, eco-guides, and beach photographers can register and manage their listings from the Coastline Provider portal.
          </p>
          <div className="mt-4">
            <Link
              href="/provider"
              className="inline-flex items-center gap-1.5 rounded-xl bg-action-bg px-4 py-2 text-xs font-bold text-action-fg shadow-md hover:bg-action-bg/90 transition-colors"
            >
              Open Provider Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
