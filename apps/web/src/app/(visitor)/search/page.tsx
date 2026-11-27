import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, MapPin, Search, Sparkles, Store } from 'lucide-react';
import { getViewer } from '@/lib/session';
import {
  currentDestinationSlug,
  loadDestination,
  loadDestinations,
  loadInventory,
} from '@/lib/places-server';
import { buildSearchIndex, rankSuggestions } from '@/lib/search';
import { SERVICES } from '@/lib/services';
import { EmptyState, ErrorState } from '@/components/ui/feedback-states';
import { PageHeader } from '@/components/patterns/spot-hub-sections';
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
  const { destinations, offline } = await loadDestinations(viewer.userId);
  const slug = await currentDestinationSlug(destinations);
  const [current, inventory] = slug
    ? await Promise.all([
        loadDestination(slug, viewer.userId).catch(() => null),
        loadInventory(viewer.userId, slug),
      ])
    : [null, { spots: [], hotels: [], venues: [], failed: [], offline }];
  const index = buildSearchIndex(destinations, current, inventory);
  const results = q ? rankSuggestions(index, q) : [];
  const groups = (['place', 'service', 'listing'] as const)
    .map((kind) => ({ kind, items: results.filter((entry) => entry.kind === kind) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="page max-w-3xl">
      <PageHeader title="Search" backHref="/" backLabel="Back to Explore" className="lg:pt-6" />
      <SearchField index={index} defaultValue={q} />
      <div className="mt-6">
        {offline ? (
          <ErrorState
            message="Search could not reach Coastline's booking service. Try again in a moment."
            retryHref={`/search?q=${encodeURIComponent(q)}`}
          />
        ) : !q ? (
          <div className="space-y-6">
            <EmptyState
              icon={Search}
              title="Discover destinations, stays & experiences"
              body="Search across Bangladesh — find hotels, dining venues, sunbeds, and scenic viewpoints."
            />
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">
                Popular Searches
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Cox's Bazar",
                  'Laboni Beach',
                  'Inani Coral Beach',
                  'Ratargul Swamp Forest',
                  'Kaptai Lake',
                  'Seafood Dining',
                  'Luxury Stays',
                ].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full bg-surface-alt px-3.5 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-action-bg hover:text-action-fg"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Search}
            title={`No results for "${q}"`}
            body="Check the spelling or try a place name or a service such as stay or food."
            action={{ label: 'Explore instead', href: '/' }}
          />
        ) : (
          <div className="space-y-8">
            <p className="text-xs font-medium text-muted" role="status">
              Found <span className="font-bold text-fg">{results.length}</span>{' '}
              {results.length === 1 ? 'match' : 'matches'} for &ldquo;{q}&rdquo;
            </p>
            {groups.map((group) => (
              <section key={group.kind} aria-labelledby={`group-${group.kind}`}>
                <h2 id={`group-${group.kind}`} className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">
                  {KIND_LABEL[group.kind]}
                </h2>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {group.items.map((entry) => {
                    const Icon = entry.service
                      ? SERVICES[entry.service].icon
                      : KIND_ICON[entry.kind];
                    return (
                      <li key={entry.href + entry.label}>
                        <Link
                          href={entry.href}
                          className="group flex min-h-16 items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                        >
                          <span className="grid size-11 flex-none place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                            <Icon aria-hidden className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-fg group-hover:text-primary transition-colors">
                              {entry.label}
                            </span>
                            {entry.sublabel ? (
                              <span className="block truncate text-xs text-muted">
                                {entry.sublabel}
                              </span>
                            ) : null}
                          </span>
                          <ChevronRight aria-hidden className="size-4 text-muted transition-colors group-hover:text-primary" />
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
