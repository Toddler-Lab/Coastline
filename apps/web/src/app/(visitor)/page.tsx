import Link from 'next/link';
import { ChevronRight, Compass } from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import { getViewer } from '@/lib/session';
import {
  currentDestinationSlug,
  loadDestination,
  loadDestinations,
  loadInventory,
  type InventoryResult,
} from '@/lib/places-server';
import { destinationHref, servicesPresent } from '@/lib/places';
import { buildSearchIndex } from '@/lib/search';
import { Section } from '@/components/ui/display';
import { EmptyState, ErrorState, Notice } from '@/components/ui/states';
import { AlertBanner } from '@/components/patterns/alerts';
import { HotelCard, SpotCard, VenueCard } from '@/components/patterns/cards';
import { DestinationChips } from '@/components/patterns/destination-chips';
import {
  AerialImage,
  CardRow,
  CardRowItem,
  ImageCredit,
  ServiceTile,
  ServiceTileGrid,
} from '@/components/patterns/hub';
import { Logo } from '@/components/patterns/logo';
import { SearchField } from '@/components/patterns/search-field';
import { AccountMenuButton } from '@/components/patterns/workspace-switcher';

const EMPTY: InventoryResult = { spots: [], hotels: [], venues: [], failed: [], offline: false };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const viewer = await getViewer();
  const { destinations, offline } = await loadDestinations(viewer.userId);
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
  const bedsByCode = new Map(inventory.spots.map((point) => [point.code, point]));
  const featuredHotels = [...inventory.hotels]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 6);
  const spotName = (spotSlug: string | null) =>
    destination?.spots.find((spot) => spot.slug === spotSlug)?.name;
  const services = destination ? servicesPresent(destination.services) : [];

  return (
    <div data-accent={destination?.accent ?? 'NEUTRAL'}>
      <div className="page">
        {/* Phone header: logo and account. The top bar covers this on desktop. */}
        <div className="flex items-center justify-between gap-2 pt-3 lg:hidden">
          <Logo />
          <AccountMenuButton current="visitor" />
        </div>

        <div className="pt-3 lg:pt-8">
          <h1 className="sr-only">Explore</h1>
          <SearchField index={index} />
          {destinations.length > 0 ? (
            <DestinationChips destinations={destinations} selected={slug} />
          ) : null}
        </div>

        {offline ? (
          <ErrorState
            className="mt-6"
            title="We could not load what is on offer"
            message="Coastline's booking service did not answer. Your tickets in Trips still open. Try again in a moment."
            retryHref="/"
          />
        ) : !destination ? (
          <EmptyState
            className="mt-6"
            icon={Compass}
            title="No destinations yet"
            body="Destinations appear here as soon as the operator opens them."
          />
        ) : (
          <>
            <Link
              href={destinationHref(destination)}
              className="group mt-4 block overflow-hidden rounded-lg border border-line bg-surface"
            >
              <AerialImage
                latitude={destination.latitude}
                longitude={destination.longitude}
                zoom={destination.mapZoom}
                cols={5}
                rows={3}
                priority
                label={`Aerial view of ${destination.name}`}
                className="aspect-[4/3] w-full md:aspect-[21/9]"
              />
              <div className="flex items-center gap-3 border-t-4 border-accent p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-display">{destination.name}</p>
                  <p className="text-body text-muted">
                    {destination.tagline}
                    {destination.nameBn ? (
                      <>
                        {' · '}
                        <span lang="bn">{destination.nameBn}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <span className="hidden items-center gap-1 text-label text-primary md:inline-flex">
                  Open destination <ChevronRight aria-hidden className="size-5" />
                </span>
              </div>
            </Link>
            <ImageCredit className="mt-1" />
            {destination.topAlert ? (
              <AlertBanner alert={destination.topAlert} className="mt-4" />
            ) : null}
            {inventory.failed.length > 0 && !inventory.offline ? (
              <Notice tone="warn" className="mt-4" title="Some services did not load">
                Showing what we could reach. Refresh the page to try again.
              </Notice>
            ) : null}

            <div className="mt-8 space-y-10">
              {services.length > 0 ? (
                <Section id="services" title="What do you need?">
                  <ServiceTileGrid>
                    {services.map((service) => (
                      <ServiceTile
                        key={service}
                        service={service}
                        href={`/d/${destination.slug}/${service}`}
                        count={destination.services[service]}
                        countLabel={
                          service === 'sunbeds'
                            ? destination.services.sunbeds === 1
                              ? 'beach'
                              : 'beaches'
                            : undefined
                        }
                      />
                    ))}
                  </ServiceTileGrid>
                </Section>
              ) : null}

              {destination.spots.length > 0 ? (
                <Section
                  id="spots"
                  title={`Spots in ${destination.name}`}
                  href={`${destinationHref(destination)}#spots`}
                >
                  <CardRow label={`Spots in ${destination.name}`}>
                    {destination.spots.map((spot) => (
                      <CardRowItem key={spot.slug}>
                        <SpotCard
                          spot={spot}
                          destination={destination}
                          beds={spot.beachPointCode ? bedsByCode.get(spot.beachPointCode) : undefined}
                        />
                      </CardRowItem>
                    ))}
                  </CardRow>
                </Section>
              ) : null}

              {featuredHotels.length > 0 ? (
                <Section id="stays" title="Popular stays" href={`/d/${destination.slug}/stay`}>
                  <CardRow label="Popular stays">
                    {featuredHotels.map((hotel) => (
                      <CardRowItem key={hotel.id}>
                        <HotelCard hotel={hotel} spotName={spotName(hotel.spotSlug)} />
                      </CardRowItem>
                    ))}
                  </CardRow>
                </Section>
              ) : null}

              {inventory.venues.length > 0 ? (
                <Section id="food" title="Places to eat" href={`/d/${destination.slug}/food`}>
                  <CardRow label="Places to eat">
                    {inventory.venues.slice(0, 6).map((venue) => (
                      <CardRowItem key={venue.id}>
                        <VenueCard venue={venue} />
                      </CardRowItem>
                    ))}
                  </CardRow>
                </Section>
              ) : null}

              {services.length === 0 ? (
                <EmptyState
                  title={`Nothing to book in ${destination.name} yet`}
                  body="Providers here have not listed services yet. Open the destination to see its spots."
                  action={{ label: `Explore ${destination.name}`, href: destinationHref(destination) }}
                />
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
