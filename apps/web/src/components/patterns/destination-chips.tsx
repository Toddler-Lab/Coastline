'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { DESTINATION_COOKIE } from '@/lib/places';
import { chipClass } from '@/components/ui/chip';

/** Destination chips on Explore. The choice is remembered for the next visit. */
export function DestinationChips({
  destinations,
  selected,
}: {
  destinations: Array<{ slug: string; name: string }>;
  selected: string | null;
}) {
  return (
    <div role="group" aria-label="Destinations" className="bleed-row scrollbar-none flex gap-2 overflow-x-auto py-1">
      {destinations.map((destination) => {
        const active = destination.slug === selected;
        return (
          <Link
            key={destination.slug}
            href={`/?destination=${destination.slug}`}
            scroll={false}
            aria-current={active ? 'true' : undefined}
            onClick={() => {
              document.cookie = `${DESTINATION_COOKIE}=${destination.slug}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={chipClass(active)}
          >
            <MapPin aria-hidden className="size-4" />
            {destination.name}
          </Link>
        );
      })}
    </div>
  );
}
