import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { loadInventory } from '@/lib/places-server';
import {
  DEFAULT_DESTINATION,
  DESTINATIONS,
  destinationHref,
  serviceCount,
  servicesPresent,
} from '@/lib/places';
import { buildSearchIndex } from '@/lib/search';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { Section } from '@/components/ui/display';
import { ErrorState, Notice } from '@/components/ui/states';
import { HotelCard, SpotCard, VenueCard } from '@/components/patterns/cards';
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

export default async function ExplorePage() {
  const destination = DEFAULT_DESTINATION;
  const viewer = await getViewer();
  const inventory = await loadInventory(viewer.userId);
  const services = servicesPresent(inventory);
  const index = buildSearchIndex(destination, inventory);
  const featuredHotels = [...inventory.hotels]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 6);
  const spotName = (code: string) => inventory.spots.find((spot) => spot.code === code)?.name;

  return (
    <div data-accent={destination.accent}>
      <div className="page">
        {/* Phone header: logo, destination, account. The top bar covers this on desktop. */}
        <div className="flex items-center justify-between gap-2 pt-3 lg:hidden">
          <Logo />
          <AccountMenuButton current="visitor" />
        </div>

        <div className="pt-3 lg:pt-8">
          <h1 className="sr-only">Explore</h1>
          <SearchField index={index} />
          <ChipRow label="Destinations" className="mt-3">
            {DESTINATIONS.map((item) => (
              <ChipLink
                key={item.slug}
                href={destinationHref(item)}
                selected={item.slug === destination.slug}
              >
                <MapPin aria-hidden className="size-4" />
                {item.name}
              </ChipLink>
            ))}
          </ChipRow>
        </div>

        <Link
          href={destinationHref(destination)}
          className="group mt-4 block overflow-hidden rounded-lg border border-line bg-surface"
        >
          <AerialImage
            latitude={destination.hero.latitude}
            longitude={destination.hero.longitude}
            zoom={destination.hero.zoom}
            cols={5}
            rows={3}
            priority
            label={`Aerial view of the ${destination.name} coastline`}
            className="aspect-[4/3] w-full md:aspect-[21/9]"
          />
          <div className="flex items-center gap-3 border-t-4 border-accent p-4">
            <div className="min-w-0 flex-1">
              <p className="text-display">{destination.name}</p>
              <p className="text-body text-muted">
                {destination.tagline} · <span lang="bn">{destination.nameBn}</span>
              </p>
            </div>
            <span className="hidden items-center gap-1 text-label text-primary md:inline-flex">
              Open destination <ChevronRight aria-hidden className="size-5" />
            </span>
          </div>
        </Link>
        <ImageCredit className="mt-1" />

        {inventory.offline ? (
          <ErrorState
            className="mt-6"
            title="We could not load what is on offer"
            message="Coastline's booking service did not answer. Your tickets in Trips still open. Try again in a moment."
            retryHref="/"
          />
        ) : null}
        {!inventory.offline && inventory.failed.length > 0 ? (
          <Notice tone="warn" className="mt-6" title="Some services did not load">
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
                    count={serviceCount(inventory, service)}
                    countLabel={
                      service === 'sunbeds'
                        ? serviceCount(inventory, service) === 1
                          ? 'beach'
                          : 'beaches'
                        : undefined
                    }
                  />
                ))}
              </ServiceTileGrid>
            </Section>
          ) : null}

          {inventory.spots.length > 0 ? (
            <Section
              id="spots"
              title={`Spots in ${destination.name}`}
              href={`${destinationHref(destination)}#spots`}
            >
              <CardRow label={`Spots in ${destination.name}`}>
                {inventory.spots.map((spot) => (
                  <CardRowItem key={spot.code}>
                    <SpotCard
                      spot={spot}
                      destinationSlug={destination.slug}
                      destinationName={destination.name}
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
                    <HotelCard hotel={hotel} spotName={spotName(hotel.nearestBeachCode)} />
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
        </div>
      </div>
    </div>
  );
}
