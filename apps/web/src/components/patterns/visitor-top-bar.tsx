import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { currentDestinationSlug, loadDestinations } from '@/lib/places-server';
import { Logo } from './logo';
import { HelpTopButton } from './help';
import { SearchField } from './search-field';
import { TopNavLinks } from './visitor-nav';
import { AccountMenuButton } from './workspace-switcher';

/** Expanded screens only: logo, destination, search, the five sections, Help. */
export async function VisitorTopBar() {
  const viewer = await getViewer();
  const { destinations } = await loadDestinations(viewer.userId);
  const slug = await currentDestinationSlug(destinations);
  const current = destinations.find((destination) => destination.slug === slug);

  return (
    <header className="no-print sticky top-0 z-50 hidden border-b border-line bg-surface lg:block">
      <div className="page flex h-[var(--topbar-h)] items-center gap-4">
        <Logo />
        {current ? (
          <Link
            href={`/d/${current.slug}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line px-3 text-label hover:bg-surface-alt"
          >
            <MapPin aria-hidden className="size-5 text-primary" />
            {current.name}
          </Link>
        ) : null}
        <SearchField size="md" className="w-full max-w-sm flex-1" />
        <nav aria-label="Main" className="ml-auto">
          <TopNavLinks />
        </nav>
        <HelpTopButton />
        <AccountMenuButton current="visitor" />
      </div>
    </header>
  );
}
