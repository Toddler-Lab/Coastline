import type { Metadata } from 'next';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import { getViewer } from '@/lib/session';
import {
  currentDestinationSlug,
  loadDestination,
  loadDestinations,
  loadInventory,
  type InventoryResult,
} from '@/lib/places-server';
import { buildSearchIndex } from '@/lib/search';
import { DroneLandingView } from '@/components/landing/drone-landing-view';

export const metadata: Metadata = {
  title: 'Explore Bangladesh from above | Coastline',
  description:
    'An independent platform for Bangladesh travel. Book stays, food, sunbeds, and experiences across Bangladesh destinations.',
};

const EMPTY: InventoryResult = { spots: [], hotels: [], venues: [], failed: [], offline: false };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = searchParams ? await searchParams : {};
  const viewer = await getViewer();
  const { destinations } = await loadDestinations(viewer.userId);
  const requested = typeof query.destination === 'string' ? query.destination : null;
  const slug =
    requested && destinations.some((destination) => destination.slug === requested)
      ? requested
      : await currentDestinationSlug(destinations);

  let destination: DestinationDetailDto | null = null;
  let inventory = EMPTY;
  if (slug) {
    [destination, inventory] = await Promise.all([
      loadDestination(slug, viewer.userId).catch(() => null),
      loadInventory(viewer.userId, slug),
    ]);
  }
  const index = buildSearchIndex(destinations, destination, inventory);

  return (
    <DroneLandingView
      destinations={destinations}
      destination={destination}
      inventory={inventory}
      searchIndex={index}
    />
  );
}
