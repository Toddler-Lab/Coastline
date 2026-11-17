import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Clock,
  MapPinned,
  Navigation,
  PackageSearch,
  Phone,
  ScrollText,
  Umbrella,
} from 'lucide-react';
import {
  CANCEL_CUTOFF_MINUTES,
  MAX_ADVANCE_DAYS,
  MAX_HOURS_PER_ITEM,
} from '@coastline/api-contracts';
import { getViewer } from '@/lib/session';
import { loadInventory } from '@/lib/places-server';
import {
  findDestination,
  findSpot,
  servicesPresent,
  spotInventory,
  spotSlug,
  sunbedPickerHref,
  serviceCount,
} from '@/lib/places';
import { formatMoney, hoursRange, slotLabel } from '@/lib/format';
import { buttonClass } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/display';
import { EmptyState } from '@/components/ui/states';
import { HotelCard, VenueCard } from '@/components/patterns/cards';
import {
  EmergencyCallCard,
  HelpShortcuts,
  NATIONAL_EMERGENCY,
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

type Params = { destination: string; spot: string };

async function load(params: Promise<Params>) {
  const { destination: destinationSlug, spot: spotSlugParam } = await params;
  const destination = findDestination(destinationSlug);
  if (!destination) return null;
  const viewer = await getViewer();
  const inventory = await loadInventory(viewer.userId);
  const spot = findSpot(inventory.spots, spotSlugParam);
  if (!spot) return { destination, spot: null, inventory };
  return { destination, spot, inventory };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load(params);
  return { title: data?.spot ? data.spot.name : 'Spot' };
}

export default async function SpotPage({ params }: { params: Promise<Params> }) {
  const data = await load(params);
  if (!data) notFound();
  const { destination, spot, inventory } = data;
  if (!spot) {
    if (inventory.offline) {
      return (
        <div className="page py-10">
          <EmptyState
            title="This spot could not be loaded"
            body="Coastline's booking service did not answer. Try again in a moment."
            action={{ label: 'Back to Explore', href: '/' }}
          />
        </div>
      );
    }
    notFound();
  }

  const here = spotInventory(inventory, spot);
  const services = servicesPresent(here);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;

  const tabs = [
    { id: 'book', label: 'Book' },
    { id: 'nearby', label: 'Nearby' },
    { id: 'know', label: 'Know' },
    { id: 'help', label: 'Help' },
  ];

  const glance = (
    <Card as="aside" aria-labelledby="glance-title" className="p-4">
      <h2 id="glance-title" className="text-title-sm">
        At a glance
      </h2>
      <dl className="mt-3 space-y-3 text-body-sm">
        <div className="flex gap-3">
          <Clock aria-hidden className="size-5 flex-none text-muted" />
          <div>
            <dt className="text-muted">Sunbed hours</dt>
            <dd>{hoursRange(spot.openHour, spot.closeHour)}</dd>
          </div>
        </div>
        {spot.totalBeds > 0 ? (
          <div className="flex gap-3">
            <Umbrella aria-hidden className="size-5 flex-none text-muted" />
            <div>
              <dt className="text-muted">Sunbeds</dt>
              <dd>
                from {formatMoney(spot.defaultHourlyPriceMinor, spot.currency)} / hour ·{' '}
                {spot.freeBeds} of {spot.totalBeds} free
              </dd>
            </div>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Phone aria-hidden className="size-5 flex-none text-danger" />
          <div>
            <dt className="text-muted">Emergency</dt>
            <dd>
              <a
                href={`tel:${NATIONAL_EMERGENCY.number}`}
                className="font-semibold text-danger underline-offset-2 hover:underline"
              >
                {NATIONAL_EMERGENCY.number}
              </a>
            </dd>
          </div>
        </div>
      </dl>
      <div className="mt-4 grid gap-2">
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className={buttonClass('secondary', 'md', 'w-full')}
        >
          <Navigation aria-hidden className="size-5" /> Directions
        </a>
        <Link href="/help/lost-found?kind=lost" className={buttonClass('text', 'md', 'w-full')}>
          <PackageSearch aria-hidden className="size-5" /> Report a lost item
        </Link>
      </div>
    </Card>
  );

  return (
    <div data-accent={destination.accent} className="page">
      <BackLink
        href={`/d/${destination.slug}`}
        label={destination.name}
        className="mt-2 lg:hidden"
      />
      <div className="overflow-hidden rounded-lg lg:mt-6">
        <AerialImage
          latitude={spot.latitude}
          longitude={spot.longitude}
          zoom={16}
          cols={6}
          rows={3}
          priority
          label={`Aerial view of ${spot.name}`}
          className="aspect-[4/3] w-full md:aspect-[21/9]"
        />
      </div>
      <ImageCredit className="mt-1" />

      <div className="mt-3 border-l-4 border-accent pl-4">
        <h1 className="text-display">{spot.name}</h1>
        <p className="text-body text-muted">
          <Link href={`/d/${destination.slug}`} className="underline-offset-2 hover:underline">
            {destination.name}
          </Link>{' '}
          · Beach · Sunbeds {hoursRange(spot.openHour, spot.closeHour)}
        </p>
      </div>
      {spot.totalBeds > 0 ? (
        <p className="mt-3 flex flex-wrap gap-2 text-body-sm">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-alt px-3">
            <Umbrella aria-hidden className="size-4 text-primary" />
            <span className="tabular font-semibold">{spot.freeBeds}</span> free at{' '}
            {slotLabel(spot.referenceSlotLabel)}
          </span>
          <span className="inline-flex h-8 items-center rounded-full bg-surface-alt px-3">
            from {formatMoney(spot.defaultHourlyPriceMinor, spot.currency)} / hour
          </span>
        </p>
      ) : null}

      <div className="mt-4">
        <SectionTabs label={`${spot.name} sections`} tabs={tabs} />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="space-y-12 lg:col-span-8">
          <Section id="book" title="Book here">
            {services.length > 0 ? (
              <div className="space-y-8">
                <ServiceTileGrid>
                  {services.map((service) => (
                    <ServiceTile
                      key={service}
                      service={service}
                      href={
                        service === 'sunbeds'
                          ? sunbedPickerHref(spot)
                          : `/d/${destination.slug}/s/${spotSlug(spot)}/${service}`
                      }
                      count={service === 'sunbeds' ? spot.freeBeds : serviceCount(here, service)}
                      countLabel={service === 'sunbeds' ? 'free now' : undefined}
                    />
                  ))}
                </ServiceTileGrid>
                {here.venues.length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-title-sm">Food at {spot.name}</h3>
                    <CardRow label={`Food at ${spot.name}`}>
                      {here.venues.map((venue) => (
                        <CardRowItem key={venue.id}>
                          <VenueCard venue={venue} />
                        </CardRowItem>
                      ))}
                    </CardRow>
                  </div>
                ) : null}
                {here.hotels.length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-title-sm">Stays near {spot.name}</h3>
                    <CardRow label={`Stays near ${spot.name}`}>
                      {here.hotels.map((hotel) => (
                        <CardRowItem key={hotel.id}>
                          <HotelCard hotel={hotel} spotName={spot.name} />
                        </CardRowItem>
                      ))}
                    </CardRow>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState
                title="Nothing to book at this spot yet"
                body={`See everything on offer in ${destination.name}.`}
                action={{ label: `Explore ${destination.name}`, href: `/d/${destination.slug}` }}
              />
            )}
          </Section>

          <Section id="nearby" title="Nearby">
            <EmptyState
              icon={MapPinned}
              title="Facilities are not listed yet"
              body="ATMs, pharmacies, washrooms and prayer rooms near this spot will appear here. Use Directions for the way there."
              action={
                <a
                  href={directions}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass('secondary')}
                >
                  <Navigation aria-hidden className="size-5" /> Directions
                </a>
              }
            />
          </Section>

          <Section id="know" title="Know before you go">
            <Card className="divide-y divide-line">
              {spot.description ? (
                <div className="p-4">
                  <h3 className="text-title-sm">About this spot</h3>
                  <p className="mt-1 text-body-sm text-muted">{spot.description}</p>
                </div>
              ) : null}
              <div className="flex gap-3 p-4">
                <ScrollText aria-hidden className="mt-0.5 size-5 flex-none text-muted" />
                <div>
                  <h3 className="text-title-sm">Sunbed booking rules</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-body-sm text-muted">
                    <li>
                      Book up to {MAX_ADVANCE_DAYS} days ahead, for 1 to {MAX_HOURS_PER_ITEM} hours.
                    </li>
                    <li>
                      Cancel free until {CANCEL_CUTOFF_MINUTES} minutes before your start time.
                    </li>
                    <li>Show the QR ticket from Trips to the attendant at the bed.</li>
                    <li>All times are Bangladesh time.</li>
                  </ul>
                </div>
              </div>
            </Card>
          </Section>

          <Section id="help" title="Need help?">
            <div className="space-y-3">
              <EmergencyCallCard />
              <HelpShortcuts />
              <NoDispatchNote />
            </div>
          </Section>
        </div>
        <div className="mt-10 lg:col-span-4 lg:mt-0">
          <div className="lg:sticky lg:top-[calc(var(--topbar-h)+64px)]">{glance}</div>
        </div>
      </div>
    </div>
  );
}
