import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Lightbulb,
  MapPin,
  MapPinned,
  Navigation,
  PackageSearch,
  Phone,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Ticket,
  Umbrella,
  UtensilsCrossed,
} from 'lucide-react';
import {
  CANCEL_CUTOFF_MINUTES,
  MAX_ADVANCE_DAYS,
  MAX_HOURS_PER_ITEM,
} from '@coastline/api-contracts';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, loadInventory, loadSpot } from '@/lib/places-server';
import { SPOT_KIND_LABELS, servicesPresent, spotInventory, sunbedPickerHref } from '@/lib/places';
import { formatMoney, hoursRange, slotLabel } from '@/lib/format';
import { findDroneDestination, findDroneSpot } from '@/lib/drone-landing-data';
import { SpotHero, type SpotHeroSpot } from '@/components/landing/spot-hero';
import { buttonClass } from '@/components/ui/button';
import { Card, Section } from '@/components/ui/display';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { AlertList } from '@/components/patterns/alerts';
import { HotelCard, VenueCard } from '@/components/patterns/cards';
import {
  EmergencyContacts,
  HelpShortcuts,
  NATIONAL_EMERGENCY,
  NoDispatchNote,
} from '@/components/patterns/help-blocks';
import {
  BackLink,
  CardRow,
  CardRowItem,
  ImageCredit,
  ServiceTile,
  ServiceTileGrid,
} from '@/components/patterns/hub';
import { SaveButton } from '@/components/patterns/save-button';
import { SectionTabs } from '@/components/patterns/section-tabs';

type Params = { destination: string; spot: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { destination, spot } = await params;
  const viewer = await getViewer();
  const found = await loadSpot(destination, spot, viewer.userId).catch(() => null);
  return {
    title: found ? `${found.name} — ${found.destination.name} | Coastline` : 'Spot | Coastline',
    description: found?.description ?? undefined,
  };
}

export default async function SpotPage({ params }: { params: Promise<Params> }) {
  const { destination: destinationSlug, spot: spotSlug } = await params;
  const viewer = await getViewer();
  let spot;
  try {
    spot = await loadSpot(destinationSlug, spotSlug, viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState
          title="This spot could not be loaded"
          message={apiErrorMessage(error)}
          retryHref={`/d/${destinationSlug}/s/${spotSlug}`}
        />
      </div>
    );
  }
  if (!spot) notFound();

  const destination = spot.destination;
  const inventory = await loadInventory(viewer.userId, destination.slug);
  const here = spotInventory(inventory, spot.slug);
  const point = here.spots[0] ?? null;
  const services = servicesPresent(spot.services);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;
  const firstNumber = spot.emergencyContacts[0] ?? NATIONAL_EMERGENCY;
  const hours = spot.openHours ? hoursRange(spot.openHours.open, spot.openHours.close) : null;

  // Drone media metadata lookup — every spot becomes a nested hero background.
  const droneSpot = findDroneSpot(destination.slug, spot.slug);
  const droneDest = findDroneDestination(destination.slug);
  const heroSpots: SpotHeroSpot[] = (droneDest?.spots ?? []).map((s) => ({
    slug: s === droneSpot ? spot.slug : s.id,
    name: s.name,
    nameBn: s.bn,
    kind: s.kind,
    img: s.img,
  }));
  if (heroSpots.length === 0) {
    heroSpots.push({
      slug: spot.slug,
      name: spot.name,
      nameBn: spot.nameBn,
      kind: spot.kind,
      img: droneSpot?.img ?? 'coxs_laboni',
    });
  }
  const currentHeroIdx = heroSpots.findIndex((s) => s.slug === spot.slug);
  const nextSpotHero =
    heroSpots.length > 1 ? heroSpots[(currentHeroIdx + 1) % heroSpots.length] : null;

  const tabs = [
    { id: 'book', label: 'Explore & Book' },
    { id: 'know', label: 'Know Before You Go' },
    { id: 'help', label: 'Help & Safety' },
  ];

  return (
    <div data-accent={destination.accent} className="page pb-24">
      {/* 2026 Breadcrumb Bar */}
      <div className="flex items-center justify-between gap-3 py-3 text-body-sm text-muted">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-fg transition-colors">
            Bangladesh
          </Link>
          <span>/</span>
          <Link href={`/d/${destination.slug}`} className="hover:text-fg transition-colors">
            {destination.name}
          </Link>
          <span>/</span>
          <span className="font-semibold text-fg">{spot.name}</span>
        </nav>
        <SaveButton type="SPOT" itemKey={`${destination.slug}/${spot.slug}`} label={spot.name} />
      </div>

      {/* 2026 Cinematic 3D Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <SpotHero
          destinationSlug={destination.slug}
          destinationName={destination.name}
          destinationNameBn={droneDest?.bn}
          spots={heroSpots}
          currentSlug={spot.slug}
          nameBn={spot.nameBn ?? droneSpot?.bn}
          kindLabel={SPOT_KIND_LABELS[spot.kind]}
          description={spot.description}
          coords={`${spot.latitude.toFixed(2)}°N, ${spot.longitude.toFixed(2)}°E`}
          alt={droneDest?.alt ?? '120'}
          bestTime={droneDest?.best}
        />

        {/* 2026 Interactive Quick-Action HUD Bar */}
        <div className="grid grid-cols-2 divide-x divide-line border-t border-line bg-surface/95 backdrop-blur-md md:grid-cols-4">
          {point && point.totalBeds > 0 ? (
            <Link
              href={sunbedPickerHref({ code: point.code })}
              className="group flex items-center gap-3 p-4 transition-colors hover:bg-primary-soft/30"
            >
              <div className="grid size-10 flex-none place-items-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Umbrella className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">Sunbeds</p>
                <p className="truncate text-sm font-semibold text-fg">
                  {point.freeBeds} free ·{' '}
                  {formatMoney(point.defaultHourlyPriceMinor, point.currency)}/hr
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-4 text-muted">
              <div className="grid size-10 flex-none place-items-center rounded-xl bg-surface-alt">
                <Clock className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium">Opening Hours</p>
                <p className="truncate text-sm font-semibold">{hours ?? 'Open Daily'}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-4">
            <div className="grid size-10 flex-none place-items-center rounded-xl bg-surface-alt text-fg">
              <Ticket className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Entry Fee</p>
              <p className="truncate text-sm font-semibold text-fg">
                {spot.entryInfo ?? 'Free Entry'}
              </p>
            </div>
          </div>

          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 p-4 transition-colors hover:bg-surface-alt"
          >
            <div className="grid size-10 flex-none place-items-center rounded-xl bg-surface-alt text-fg transition-transform group-hover:scale-110">
              <Navigation className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Directions</p>
              <p className="truncate text-sm font-semibold text-fg group-hover:text-primary flex items-center gap-1">
                Open in Maps <ExternalLink className="size-3" />
              </p>
            </div>
          </a>

          <a
            href={`tel:${firstNumber.phone}`}
            className="group flex items-center gap-3 p-4 transition-colors hover:bg-danger-soft/20"
          >
            <div className="grid size-10 flex-none place-items-center rounded-xl bg-danger-soft text-danger transition-transform group-hover:scale-110">
              <Phone className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-danger">Emergency Hotline</p>
              <p className="truncate text-sm font-semibold text-danger">{firstNumber.phone}</p>
            </div>
          </a>
        </div>
      </div>

      <AlertList alerts={spot.alerts} className="mt-4" />

      {/* Tabs */}
      <div className="mt-8">
        <SectionTabs label={`${spot.name} sections`} tabs={tabs} />
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="space-y-12 lg:col-span-8">
          {/* Section: Book & Services */}
          <Section id="book" title="Explore & Book">
            {services.length > 0 ? (
              <div className="space-y-8">
                <ServiceTileGrid>
                  {services.map((service) => (
                    <ServiceTile
                      key={service}
                      service={service}
                      href={
                        service === 'sunbeds' && spot.beachPointCode
                          ? sunbedPickerHref({ code: spot.beachPointCode })
                          : `/d/${destination.slug}/s/${spot.slug}/${service}`
                      }
                      count={
                        service === 'sunbeds' ? (point?.freeBeds ?? 0) : spot.services[service]
                      }
                      countLabel={service === 'sunbeds' ? 'free now' : undefined}
                    />
                  ))}
                </ServiceTileGrid>

                {here.venues.length > 0 ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-bold">Dining at {spot.name}</h3>
                      <Link
                        href={`/d/${destination.slug}/s/${spot.slug}/food`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        See all food ({here.venues.length}) →
                      </Link>
                    </div>
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
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-bold">Stays near {spot.name}</h3>
                      <Link
                        href={`/d/${destination.slug}/s/${spot.slug}/stay`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        See all stays ({here.hotels.length}) →
                      </Link>
                    </div>
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
                body={`See everything on offer across ${destination.name}.`}
                action={{ label: `Explore ${destination.name}`, href: `/d/${destination.slug}` }}
              />
            )}
          </Section>

          {/* Section: Know Before You Go */}
          <Section id="know" title="Know Before You Go">
            <div className="space-y-4">
              {/* Drone spot tips */}
              {droneSpot && droneSpot.know.length > 0 ? (
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-5 text-accent" />
                    <h3 className="text-base font-semibold">Local Tips & Insights</h3>
                  </div>
                  <ul className="grid gap-2.5 sm:grid-cols-2 text-sm text-muted">
                    {droneSpot.know.map((tip) => (
                      <li
                        key={tip}
                        className="flex items-start gap-2 rounded-xl bg-surface-alt p-3"
                      >
                        <span className="size-1.5 rounded-full bg-accent mt-2 flex-none" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {spot.content.rules.length > 0 ? (
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ScrollText className="size-5 text-primary" />
                    <h3 className="text-base font-semibold">Guidelines & Regulations</h3>
                  </div>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
                    {spot.content.rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {point ? (
                <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Umbrella className="size-5 text-primary" />
                    <h3 className="text-base font-semibold">Sunbed Booking Policies</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Reserve up to {MAX_ADVANCE_DAYS} days in advance, 1 to {MAX_HOURS_PER_ITEM}{' '}
                      hours per order.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Cancel free up to {CANCEL_CUTOFF_MINUTES} minutes before your start time.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-primary" />
                      Digital QR pass generated instantly in Trips tab for attendant check-in.
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          </Section>

          {/* Section: Help & Safety */}
          <Section id="help" title="Help & Safety">
            <div className="space-y-4">
              <EmergencyContacts contacts={spot.emergencyContacts} />
              <HelpShortcuts />
              <NoDispatchNote />
            </div>
          </Section>
        </div>

        {/* Sidebar */}
        <div className="mt-10 lg:col-span-4 lg:mt-0">
          <div className="sticky top-20 space-y-4">
            <Card className="p-5 shadow-md border-line">
              <h2 className="text-base font-bold">Spot Highlights</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <dt className="text-muted">Destination</dt>
                  <dd className="font-semibold text-fg">{destination.name}</dd>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <dt className="text-muted">Territory</dt>
                  <dd className="font-semibold text-fg">{SPOT_KIND_LABELS[spot.kind]}</dd>
                </div>
                {hours ? (
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <dt className="text-muted">Hours</dt>
                    <dd className="font-semibold text-fg">{hours}</dd>
                  </div>
                ) : null}
                {point && point.totalBeds > 0 ? (
                  <div className="flex items-center justify-between pb-2 border-b border-line">
                    <dt className="text-muted">Beach Sunbeds</dt>
                    <dd className="font-semibold text-primary">
                      {point.freeBeds} of {point.totalBeds} free
                    </dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Emergency</dt>
                  <dd>
                    <a
                      href={`tel:${firstNumber.phone}`}
                      className="font-bold text-danger hover:underline"
                    >
                      {firstNumber.phone}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-2">
                {point && point.totalBeds > 0 ? (
                  <Link
                    href={sunbedPickerHref({ code: point.code })}
                    className={buttonClass('primary', 'md', 'w-full justify-center shadow-md')}
                  >
                    <Umbrella className="size-4 mr-2" /> Book Sunbeds Now
                  </Link>
                ) : null}
                <a
                  href={directions}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass('secondary', 'md', 'w-full justify-center')}
                >
                  <Navigation className="size-4 mr-2" /> Open Directions
                </a>
                <Link
                  href="/help/lost-found"
                  className={buttonClass(
                    'text',
                    'sm',
                    'w-full justify-center text-muted hover:text-fg',
                  )}
                >
                  <PackageSearch className="size-4 mr-1.5" /> Report lost item at this spot
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {nextSpotHero ? (
        <Link
          href={`/d/${destination.slug}/s/${nextSpotHero.slug}`}
          data-fly
          data-flyimg={`/media/places/${nextSpotHero.img}.webp`}
          className="group relative mt-10 block overflow-hidden rounded-2xl border border-line"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/media/places/${nextSpotHero.img}.webp`}
            alt=""
            loading="lazy"
            className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-72"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-y-0 left-0 flex flex-col justify-center p-6 text-white md:p-10">
            <span className="text-xs font-bold uppercase tracking-widest text-sun">Next spot</span>
            <span className="mt-2 text-2xl font-extrabold md:text-4xl">{nextSpotHero.name}</span>
            <span className="mt-2 flex items-center gap-1 text-sm font-semibold">
              {destination.name}{' '}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      ) : null}
    </div>
  );
}
