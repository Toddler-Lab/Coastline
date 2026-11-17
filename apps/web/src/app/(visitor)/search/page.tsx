import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin, Search, Sparkles, Store } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { loadInventory } from '@/lib/places-server';
import { DEFAULT_DESTINATION } from '@/lib/places';
import { buildSearchIndex, rankSuggestions } from '@/lib/search';
import { SERVICES } from '@/lib/services';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';
import { SearchField } from '@/components/patterns/search-field';

export const metadata: Metadata = { title: 'Search' };

const KIND_ICON = { place: MapPin, listing: Store, service: Sparkles } as const;
const KIND_LABEL = { place: 'Places', service: 'Services', listing: 'Listings' } as const;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const viewer = await getViewer();
  const inventory = await loadInventory(viewer.userId);
  const index = buildSearchIndex(DEFAULT_DESTINATION, inventory);
  const results = q ? rankSuggestions(index, q) : [];
  const groups = (['place', 'service', 'listing'] as const)
    .map((kind) => ({ kind, items: results.filter((entry) => entry.kind === kind) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="page max-w-3xl">
      <PageHeader title="Search" backHref="/" backLabel="Back to Explore" className="lg:pt-6" />
      <SearchField index={index} defaultValue={q} />
      <div className="mt-6">
        {inventory.offline ? (
          <ErrorState
            message="Search could not reach Coastline's booking service. Try again in a moment."
            retryHref={`/search?q=${encodeURIComponent(q)}`}
          />
        ) : !q ? (
          <EmptyState
            icon={Search}
            title="Search stays, food, sunbeds and places"
            body='Try "Kolatoli", "seafood" or "hotel Laboni".'
          />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`No results for "${q}"`}
            body="Check the spelling or try a place name or a service such as stay or food."
            action={{ label: 'Explore instead', href: '/' }}
          />
        ) : (
          <div className="space-y-8">
            <p className="text-body-sm text-muted" role="status">
              {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{q}&rdquo;
            </p>
            {groups.map((group) => (
              <section key={group.kind} aria-labelledby={`group-${group.kind}`}>
                <h2 id={`group-${group.kind}`} className="mb-2 text-title-sm">
                  {KIND_LABEL[group.kind]}
                </h2>
                <ul className="divide-y divide-line rounded-md border border-line bg-surface">
                  {group.items.map((entry) => {
                    const Icon = entry.service
                      ? SERVICES[entry.service].icon
                      : KIND_ICON[entry.kind];
                    return (
                      <li key={entry.href + entry.label}>
                        <Link
                          href={entry.href}
                          className="flex min-h-16 items-center gap-3 px-4 py-2 hover:bg-surface-alt"
                        >
                          <span className="grid size-10 flex-none place-items-center rounded-full bg-primary-soft text-primary">
                            <Icon aria-hidden className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-title-sm">{entry.label}</span>
                            {entry.sublabel ? (
                              <span className="block truncate text-body-sm text-muted">
                                {entry.sublabel}
                              </span>
                            ) : null}
                          </span>
                          <ChevronRight aria-hidden className="size-5 text-muted" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
