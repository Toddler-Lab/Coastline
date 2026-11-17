import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { DEFAULT_DESTINATION, destinationHref } from '@/lib/places';
import { Logo } from './logo';
import { HelpTopButton } from './help';
import { SearchField } from './search-field';
import { TopNavLinks } from './visitor-nav';
import { AccountMenuButton } from './workspace-switcher';

/** Expanded screens only: logo, destination, search, the five sections, Help. */
export function VisitorTopBar() {
  return (
    <header className="no-print sticky top-0 z-50 hidden border-b border-line bg-surface lg:block">
      <div className="page flex h-[var(--topbar-h)] items-center gap-4">
        <Logo />
        <Link
          href={destinationHref(DEFAULT_DESTINATION)}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line px-3 text-label hover:bg-surface-alt"
        >
          <MapPin aria-hidden className="size-5 text-primary" />
          {DEFAULT_DESTINATION.name}
        </Link>
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
