import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarRange, Plane, Waves } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, loadDestination, loadInventory } from '@/lib/places-server';
import { servicesPresent } from '@/lib/places';
import { Card, Section } from '@/components/ui/display';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { AlertList } from '@/components/patterns/alerts';
import { HotelCard, SpotCard, VenueCard } from '@/components/patterns/cards';
import { EmergencyContacts, HelpShortcuts, NoDispatchNote } from '@/components/patterns/help-blocks';
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
  const viewer = await getViewer();
  const destination = await loadDestination((await params).destination, viewer.userId).catch(() => null);
  return destination ? { title: destination.name, description: destination.tagline } : { title: 'Destination' };
}

export default async function DestinationPage({ params }: { params: Promise<Params> }) {
  const slug = (await params).destination;
  const viewer = await getViewer();
  let destination;
  try {
    destination = await loadDestination(slug, viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState title="This destination could not be loaded" message={apiErrorMessage(error)} retryHref={`/d/${slug}`} />
      </div>
    );
  }
  if (!destination) notFound();

  const inventory = await loadInventory(viewer.userId, destination.slug);
  const services = servicesPresent(destination.services);
  const bedsByCode = new Map(inventory.spots.map((point) => [point.code, point]));
  const spotName = (spotSlug: string | null) => destination.spots.find((spot) => spot.slug === spotSlug)?.name;
  const content = destination.content;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(destination.spots.length ? [{ id: 'spots', label: 'Spots' }] : []),
    ...(inventory.hotels.length ? [{ id: 'stay', label: 'Stay' }] : []),
    ...(inventory.venues.length ? [{ id: 'food', label: 'Food' }] : []),
    { id: 'help', label: 'Help' },
  ];
  const about = [
    { icon: Waves, title: 'About', body: content.about ?? destination.description },
    { icon: CalendarRange, title: 'Best time to visit', body: content.bestTime },
    { icon: Plane, title: 'Getting there', body: content.gettingThere },
  ].filter((item): item is { icon: typeof Waves; title: string; body: string } => Boolean(item.body));

  return (
    <div data-accent={destination.accent} className="page">
      <BackLink href="/" label="Explore" className="mt-2 lg:hidden" />
      <div className="overflow-hidden rounded-lg lg:mt-6">
        <AerialImage
          latitude={destination.latitude}
          longitude={destination.longitude}
          zoom={destination.mapZoom}
          cols={6}
          rows={3}
          priority
          label={`Aerial view of ${destination.name}`}
          className="aspect-[4/3] w-full md:aspect-[21/9]"
        />
      </div>
      <ImageCredit className="mt-1" />
      <div className="mt-3 border-l-4 border-accent pl-4">
        <h1 className="text-display">{destination.name}</h1>
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
      <AlertList alerts={destination.alerts} className="mt-4" />

      <div className="mt-4">
        <SectionTabs label={`${destination.name} sections`} tabs={tabs} />
      </div>

      {inventory.offline ? (
        <ErrorState
          className="mt-6"
          title="Bookings could not be loaded"
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
                    count={destination.services[service]}
                    countLabel={
                      service === 'sunbeds' ? (destination.services.sunbeds === 1 ? 'beach' : 'beaches') : undefined
                    }
                  />
                ))}
              </ServiceTileGrid>
            </div>
          ) : (
            <EmptyState
              title="Nothing to book here yet"
              body="Providers in this destination have not listed services yet. The spots below are worth a visit."
            />
          )}
          {about.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3">
              {about.map((item) => (
                <Card key={item.title} className="p-4">
                  <item.icon aria-hidden className="size-6 text-accent" />
                  <h3 className="mt-2 text-title-sm">{item.title}</h3>
                  <p className="mt-1 text-body-sm text-muted">{item.body}</p>
                </Card>
              ))}
            </div>
          ) : null}
        </section>

        {destination.spots.length > 0 ? (
          <Section id="spots" title="Spots" description="Open a spot to see what you can book there and what is nearby.">
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {destination.spots.map((spot) => (
                <li key={spot.slug}>
                  <SpotCard
                    spot={spot}
                    destination={destination}
                    beds={spot.beachPointCode ? bedsByCode.get(spot.beachPointCode) : undefined}
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
                  <HotelCard hotel={hotel} spotName={spotName(hotel.spotSlug)} />
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

        <Section id="help" title={`Help in ${destination.name}`}>
          <div className="space-y-3">
            <EmergencyContacts contacts={destination.emergencyContacts} />
            <HelpShortcuts />
            <NoDispatchNote />
          </div>
        </Section>
      </div>
    </div>
  );
}
