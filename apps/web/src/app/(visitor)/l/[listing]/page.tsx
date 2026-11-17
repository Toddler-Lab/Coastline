import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  BedDouble,
  Clock,
  LifeBuoy,
  MapPin,
  Navigation,
  Phone,
  ScrollText,
  Star,
  Truck,
  Umbrella,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import type { DiningVenueDetail, HotelDetailDto } from '@coastline/api-contracts';
import { CANCEL_CUTOFF_MINUTES, RESERVATION_CANCEL_CUTOFF_MINUTES } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, isNotFound } from '@/lib/places-server';
import { DEFAULT_DESTINATION, listingHref, parseListingId } from '@/lib/places';
import { formatDistance, formatMoney, hoursRange, slotLabel } from '@/lib/format';
import { VENUE_KIND_LABELS } from '@/lib/dining/admin';
import { buttonClass } from '@/components/ui/button';
import { Card, PriceUnit, Section } from '@/components/ui/display';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/states';
import { DetailLayout, FactChips, Gallery } from '@/components/patterns/detail';

type Params = { listing: string };

type Loaded =
  | { kind: 'hotel'; hotel: HotelDetailDto }
  | { kind: 'dining'; venue: DiningVenueDetail }
  | { kind: 'error'; message: string }
  | null;

async function load(id: string): Promise<Loaded> {
  const ref = parseListingId(id);
  if (!ref) return null;
  const viewer = await getViewer();
  try {
    if (ref.kind === 'hotel') {
      return {
        kind: 'hotel',
        hotel: await serverApi<HotelDetailDto>(
          `/hotels/${encodeURIComponent(ref.slug)}`,
          viewer.userId,
        ),
      };
    }
    return {
      kind: 'dining',
      venue: await serverApi<DiningVenueDetail>(
        `/dining/venues/${encodeURIComponent(ref.code)}`,
        viewer.userId,
      ),
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    return { kind: 'error', message: apiErrorMessage(error) };
  }
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load((await params).listing);
  if (data?.kind === 'hotel')
    return { title: data.hotel.name, description: data.hotel.description };
  if (data?.kind === 'dining')
    return { title: data.venue.name, description: data.venue.description ?? undefined };
  return { title: 'Listing' };
}

function HelpLink() {
  return (
    <Link
      href="/help"
      aria-label="Help"
      title="Help"
      className="inline-flex size-11 items-center justify-center rounded-full text-danger hover:bg-surface-alt lg:hidden"
    >
      <LifeBuoy aria-hidden className="size-6" />
    </Link>
  );
}

function LocationCard({
  title,
  address,
  latitude,
  longitude,
}: {
  title: string;
  address: string | null;
  latitude?: number;
  longitude?: number;
}) {
  const directions =
    latitude !== undefined && longitude !== undefined
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : null;
  return (
    <Card className="flex items-start gap-3 p-4">
      <MapPin aria-hidden className="mt-0.5 size-6 flex-none text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-title-sm">{title}</p>
        {address ? <p className="text-body-sm text-muted">{address}</p> : null}
      </div>
      {directions ? (
        <a
          href={directions}
          target="_blank"
          rel="noreferrer"
          className={buttonClass('secondary', 'sm')}
        >
          <Navigation aria-hidden className="size-4" /> Directions
        </a>
      ) : null}
    </Card>
  );
}

export default async function ListingPage({ params }: { params: Promise<Params> }) {
  const id = (await params).listing;
  const data = await load(id);
  if (!data) notFound();
  if (data.kind === 'error') {
    return (
      <div className="page py-10">
        <ErrorState
          title="This listing could not be loaded"
          message={data.message}
          retryHref={listingHref(id)}
        />
      </div>
    );
  }

  const destination = DEFAULT_DESTINATION;
  const bookHref = `${listingHref(id)}/book`;

  if (data.kind === 'hotel') {
    const { hotel } = data;
    const card = (
      <Card className="p-5 shadow-soft">
        <PriceUnit from minor={hotel.minPriceMinor} unit="night" />
        <p className="mt-1 text-body-sm text-muted">
          Check-in {slotLabel(hotel.checkInTime)} · Check-out {slotLabel(hotel.checkOutTime)}
        </p>
        <Link href={bookHref} className={buttonClass('primary', 'lg', 'mt-4 w-full')}>
          Choose dates and room
        </Link>
        <p className="mt-3 text-center text-body-sm text-muted">
          You will see the total before you pay.
        </p>
      </Card>
    );
    return (
      <DetailLayout
        backHref={`/d/${destination.slug}/stay`}
        backLabel="All stays"
        headerActions={<HelpLink />}
        gallery={
          <Gallery images={[hotel.featuredImage, ...hotel.galleryImages]} alt={hotel.name} />
        }
        bookingCard={card}
        bookingBar={
          <div className="flex items-center gap-3">
            <PriceUnit from minor={hotel.minPriceMinor} unit="night" className="flex-1" />
            <Link href={bookHref} className={buttonClass('primary', 'lg')}>
              Choose room
            </Link>
          </div>
        }
      >
        <header>
          <h1 className="text-title-lg">{hotel.name}</h1>
          {hotel.banglaName ? (
            <p lang="bn" className="text-body text-muted">
              {hotel.banglaName}
            </p>
          ) : null}
          <p className="mt-1 flex items-center gap-1 text-body-sm text-muted">
            <MapPin aria-hidden className="size-4" /> {hotel.address}
          </p>
        </header>
        <FactChips
          facts={[
            ...(hotel.starRating > 0
              ? [{ icon: Star, label: `${hotel.starRating}-star hotel` }]
              : []),
            { icon: Umbrella, label: `${formatDistance(hotel.distanceMeters)} to the beach` },
            { icon: BedDouble, label: `${hotel.roomTypes.length} room types` },
          ]}
        />
        <p className="text-body">{hotel.description}</p>

        {hotel.amenities.length > 0 ? (
          <Section title="What is included">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm md:grid-cols-3">
              {hotel.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2">
                  <span aria-hidden className="size-1.5 rounded-full bg-primary" />
                  {amenity}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section id="rooms" title="Rooms">
          <ul className="space-y-3">
            {hotel.roomTypes.map((room) => (
              <li key={room.id}>
                <Card className="flex flex-col gap-3 overflow-hidden md:flex-row">
                  {room.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover md:w-48"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-1 p-4 md:pl-0">
                    <h3 className="text-title-sm">{room.name}</h3>
                    <p className="flex flex-wrap gap-x-3 text-body-sm text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Users aria-hidden className="size-4" /> Sleeps {room.maxGuests}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble aria-hidden className="size-4" /> {room.bedConfig}
                      </span>
                    </p>
                    {room.description ? (
                      <p className="text-body-sm text-muted">{room.description}</p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <PriceUnit
                        minor={room.basePriceMinor}
                        currency={room.currency}
                        unit="night"
                      />
                      <Link
                        href={`${bookHref}?room=${room.id}`}
                        className={buttonClass('secondary', 'sm')}
                      >
                        Select
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Cancellation">
          <p className="flex gap-2 text-body-sm text-muted">
            <ScrollText aria-hidden className="size-5 flex-none" />
            Free cancellation until {CANCEL_CUTOFF_MINUTES} minutes before check-in (
            {slotLabel(hotel.checkInTime)}). After that the booking cannot be cancelled in the app.
          </p>
        </Section>

        <Section title="Location and contact">
          <div className="space-y-3">
            <LocationCard
              title={hotel.name}
              address={hotel.address}
              latitude={hotel.latitude}
              longitude={hotel.longitude}
            />
            <Card className="flex items-center gap-3 p-4">
              <Phone aria-hidden className="size-6 flex-none text-primary" />
              <div className="flex-1">
                <p className="text-title-sm">Contact the hotel</p>
                <p className="text-body-sm text-muted">In-app messages arrive with the inbox.</p>
              </div>
              <a href={`tel:${hotel.phone}`} className={buttonClass('secondary', 'sm')}>
                Call
              </a>
            </Card>
          </div>
        </Section>
      </DetailLayout>
    );
  }

  const { venue } = data;
  const tableHref = `${bookHref}?mode=table`;
  const orderHref = `${bookHref}?mode=order`;
  const primary = venue.reservationsEnabled
    ? { href: tableHref, label: 'Reserve a table' }
    : venue.deliveryEnabled
      ? { href: orderHref, label: 'Order to your sunbed' }
      : null;
  const secondary =
    venue.reservationsEnabled && venue.deliveryEnabled
      ? { href: orderHref, label: 'Order to your sunbed' }
      : null;

  const card = (
    <Card className="p-5 shadow-soft">
      {venue.priceFromMinor !== null ? (
        <PriceUnit from minor={venue.priceFromMinor} currency={venue.currency} unit="item" />
      ) : null}
      <p className="mt-1 text-body-sm text-muted">
        Open {hoursRange(venue.openHour, venue.closeHour)}
      </p>
      {venue.reservationsEnabled ? (
        <p className="mt-1 text-body-sm text-muted">
          {venue.reservationDepositMinor > 0
            ? `Table deposit ${formatMoney(venue.reservationDepositMinor, venue.currency)}`
            : 'No deposit for tables'}
        </p>
      ) : null}
      {primary ? (
        <Link href={primary.href} className={buttonClass('primary', 'lg', 'mt-4 w-full')}>
          {primary.label}
        </Link>
      ) : (
        <p className="mt-4 text-body-sm text-muted">
          This venue does not take bookings in the app. Walk in during opening hours.
        </p>
      )}
      {secondary ? (
        <Link href={secondary.href} className={buttonClass('secondary', 'lg', 'mt-2 w-full')}>
          {secondary.label}
        </Link>
      ) : null}
    </Card>
  );

  return (
    <DetailLayout
      backHref={`/d/${destination.slug}/food`}
      backLabel="All food"
      headerActions={<HelpLink />}
      gallery={<Gallery images={venue.imageUrl ? [venue.imageUrl] : []} alt={venue.name} />}
      bookingCard={card}
      bookingBar={
        primary ? (
          <div className="flex items-center gap-2">
            {secondary ? (
              <Link href={secondary.href} className={buttonClass('secondary', 'lg', 'flex-1 px-3')}>
                <Truck aria-hidden className="size-5" /> Order
              </Link>
            ) : venue.priceFromMinor !== null ? (
              <PriceUnit
                from
                minor={venue.priceFromMinor}
                currency={venue.currency}
                unit="item"
                className="flex-1"
              />
            ) : (
              <span className="flex-1" />
            )}
            <Link
              href={primary.href}
              className={buttonClass('primary', 'lg', secondary ? 'flex-1 px-3' : undefined)}
            >
              {primary.label}
            </Link>
          </div>
        ) : (
          <p className="text-body-sm text-muted">
            Walk in during opening hours: {hoursRange(venue.openHour, venue.closeHour)}.
          </p>
        )
      }
    >
      <header>
        <h1 className="text-title-lg">{venue.name}</h1>
        {venue.nameBn ? (
          <p lang="bn" className="text-body text-muted">
            {venue.nameBn}
          </p>
        ) : null}
        <p className="mt-1 flex items-center gap-1 text-body-sm text-muted">
          <MapPin aria-hidden className="size-4" /> {venue.beachPointName ?? destination.name}
        </p>
      </header>
      <FactChips
        facts={[
          { icon: UtensilsCrossed, label: VENUE_KIND_LABELS[venue.kind] },
          { icon: Clock, label: hoursRange(venue.openHour, venue.closeHour) },
          ...(venue.deliveryEnabled ? [{ icon: Truck, label: 'Delivers to your sunbed' }] : []),
          ...(venue.reservationsEnabled ? [{ icon: Users, label: 'Reserve a table' }] : []),
        ]}
      />
      {venue.cuisineTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {venue.cuisineTags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      ) : null}
      {venue.description ? <p className="text-body">{venue.description}</p> : null}

      <Section id="menu" title="Menu" description="Prices are set by the venue.">
        {venue.menu.length === 0 ? (
          <p className="text-body-sm text-muted">The menu has not been added yet.</p>
        ) : (
          <div className="space-y-6">
            {venue.menu.map((category) => (
              <div key={category.id}>
                <h3 className="text-title-sm">
                  {category.name}
                  {category.nameBn ? (
                    <span lang="bn" className="ml-2 font-normal text-muted">
                      {category.nameBn}
                    </span>
                  ) : null}
                </h3>
                <ul className="mt-2 divide-y divide-line rounded-md border border-line bg-surface">
                  {category.items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-body">{item.name}</p>
                        {item.description ? (
                          <p className="text-body-sm text-muted">{item.description}</p>
                        ) : null}
                        {!item.isAvailable ? (
                          <Badge className="mt-1">Not available today</Badge>
                        ) : null}
                      </div>
                      <span className="tabular flex-none text-body">
                        {formatMoney(item.priceMinor, item.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Cancellation">
        <ul className="list-disc space-y-1 pl-5 text-body-sm text-muted">
          {venue.reservationsEnabled ? (
            <li>
              Tables: free cancellation until {RESERVATION_CANCEL_CUTOFF_MINUTES} minutes before
              your start time; any deposit is refunded in full.
            </li>
          ) : null}
          {venue.deliveryEnabled ? (
            <li>Sunbed orders: cancel until the kitchen starts preparing.</li>
          ) : null}
          {!venue.reservationsEnabled && !venue.deliveryEnabled ? (
            <li>No bookings are taken in the app.</li>
          ) : null}
        </ul>
      </Section>

      <Section title="Location and contact">
        <div className="space-y-3">
          <LocationCard title={venue.name} address={venue.address ?? venue.beachPointName} />
          {venue.contactPhone ? (
            <Card className="flex items-center gap-3 p-4">
              <Phone aria-hidden className="size-6 flex-none text-primary" />
              <p className="flex-1 text-title-sm">Call the venue</p>
              <a href={`tel:${venue.contactPhone}`} className={buttonClass('secondary', 'sm')}>
                Call
              </a>
            </Card>
          ) : null}
        </div>
      </Section>
    </DetailLayout>
  );
}
