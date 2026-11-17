import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarRange, Plane, Waves } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { loadInventory } from '@/lib/places-server';
import { findDestination, serviceCount, servicesPresent } from '@/lib/places';
import { Card, Section } from '@/components/ui/display';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { HotelCard, SpotCard, VenueCard } from '@/components/patterns/cards';
import {
  EmergencyCallCard,
  HelpShortcuts,
  NoDispatchNote,
} from '@/components/patterns/help-blocks';
import {
  AerialImage,
  BackLink,
  CardRow,
  CardRowItem,
  ImageCredit,
  ServiceTile,
  ServiceTileGrid,
} from '@/components/patterns/hub';
import { SectionTabs } from '@/components/patterns/section-tabs';

type Params = { destination: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const destination = findDestination((await params).destination);
  return destination
    ? { title: destination.name, description: destination.tagline }
    : { title: 'Destination' };
}

export default async function DestinationPage({ params }: { params: Promise<Params> }) {
  const destination = findDestination((await params).destination);
  if (!destination) notFound();

  const viewer = await getViewer();
  const inventory = await loadInventory(viewer.userId);
  const services = servicesPresent(inventory);
  const spotName = (code: string) => inventory.spots.find((spot) => spot.code === code)?.name;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(inventory.spots.length ? [{ id: 'spots', label: 'Spots' }] : []),
    ...(inventory.hotels.length ? [{ id: 'stay', label: 'Stay' }] : []),
    ...(inventory.venues.length ? [{ id: 'food', label: 'Food' }] : []),
    { id: 'help', label: 'Help' },
  ];

  return (
    <div data-accent={destination.accent} className="page">
      <BackLink href="/" label="Explore" className="mt-2 lg:hidden" />
      <div className="overflow-hidden rounded-lg lg:mt-6">
        <AerialImage
          latitude={destination.hero.latitude}
          longitude={destination.hero.longitude}
          zoom={destination.hero.zoom}
          cols={6}
          rows={3}
          priority
          label={`Aerial view of the ${destination.name} coastline`}
          className="aspect-[4/3] w-full md:aspect-[21/9]"
        />
      </div>
      <ImageCredit className="mt-1" />
      <div className="mt-3 border-l-4 border-accent pl-4">
        <h1 className="text-display">{destination.name}</h1>
        <p className="text-body text-muted">
          {destination.tagline} · <span lang="bn">{destination.nameBn}</span>
        </p>
      </div>

      <div className="mt-4">
        <SectionTabs label={`${destination.name} sections`} tabs={tabs} />
      </div>

      {inventory.offline ? (
        <ErrorState
          className="mt-6"
          title="We could not load this destination"
          message="Coastline's booking service did not answer. Try again in a moment."
          retryHref={`/d/${destination.slug}`}
        />
      ) : null}

      <div className="mt-6 space-y-12">
        <section id="overview" aria-labelledby="overview-title" className="scroll-mt-32 space-y-8">
          <h2 id="overview-title" className="sr-only">
            Overview
          </h2>
          {services.length > 0 ? (
            <div>
              <h3 className="mb-3 text-title">What you can book</h3>
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
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <Waves aria-hidden className="size-6 text-accent" />
              <h3 className="mt-2 text-title-sm">About</h3>
              <p className="mt-1 text-body-sm text-muted">{destination.about}</p>
            </Card>
            <Card className="p-4">
              <CalendarRange aria-hidden className="size-6 text-accent" />
              <h3 className="mt-2 text-title-sm">Best time to visit</h3>
              <p className="mt-1 text-body-sm text-muted">{destination.bestTime}</p>
            </Card>
            <Card className="p-4">
              <Plane aria-hidden className="size-6 text-accent" />
              <h3 className="mt-2 text-title-sm">Getting there</h3>
              <p className="mt-1 text-body-sm text-muted">{destination.gettingThere}</p>
            </Card>
          </div>
        </section>

        {inventory.spots.length > 0 ? (
          <Section
            id="spots"
            title="Spots"
            description="Open a spot to see what you can book there and what is nearby."
          >
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {inventory.spots.map((spot) => (
                <li key={spot.code}>
                  <SpotCard
                    spot={spot}
                    destinationSlug={destination.slug}
                    destinationName={destination.name}
                  />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {inventory.hotels.length > 0 ? (
          <Section id="stay" title="Popular stays" href={`/d/${destination.slug}/stay`}>
            <CardRow label="Popular stays">
              {inventory.hotels.slice(0, 6).map((hotel) => (
                <CardRowItem key={hotel.id}>
                  <HotelCard hotel={hotel} spotName={spotName(hotel.nearestBeachCode)} />
                </CardRowItem>
              ))}
            </CardRow>
          </Section>
        ) : null}

        {inventory.venues.length > 0 ? (
          <Section id="food" title="Food" href={`/d/${destination.slug}/food`}>
            <CardRow label="Places to eat">
              {inventory.venues.slice(0, 6).map((venue) => (
                <CardRowItem key={venue.id}>
                  <VenueCard venue={venue} />
                </CardRowItem>
              ))}
            </CardRow>
          </Section>
        ) : null}

        {!inventory.offline && services.length === 0 ? (
          <EmptyState
            title="Nothing to book here yet"
            body="Providers in this destination have not listed services yet."
          />
        ) : null}

        <Section id="help" title="Help in this destination">
          <div className="space-y-3">
            <EmergencyCallCard />
            <HelpShortcuts />
            <NoDispatchNote />
          </div>
        </Section>
      </div>
    </div>
  );
}
