import Link from 'next/link';
import {
  ArrowLeft,
  Bike,
  CalendarCheck,
  Clock,
  Compass,
  MapPin,
  Phone,
  Utensils,
} from 'lucide-react';
import type { DiningVenueDetail, SessionUser } from '@coastline/api-contracts';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { FoodOrderPanel } from '@/components/dining/food-order-panel';
import { ReservationPanel } from '@/components/dining/reservation-panel';
import { MenuList } from './menu-list';
import { VenueImage } from './venue-image';
import {
  VENUE_KIND_LABELS,
  formatDiningPrice,
  isVenueOpen,
  venueHoursLabel,
} from './dining-format';

export interface VenueDetailViewProps {
  venue: DiningVenueDetail;
  viewer: SessionUser | null;
  /** Current Asia/Dhaka hour, resolved on the server. */
  dhakaHour: number;
}

export function VenueDetailView({ venue, viewer, dhakaHour }: VenueDetailViewProps) {
  const open = isVenueOpen(venue.openHour, venue.closeHour, dhakaHour);
  const hasActions = venue.reservationsEnabled || venue.deliveryEnabled;

  return (
    <div className="space-y-8">
      <Link
        href="/food"
        className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist transition-colors hover:text-foam"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to all dining
      </Link>

      <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-sand/40 bg-abyss px-2.5 py-1 text-[11.5px] font-semibold text-sand">
              <Utensils className="h-3.5 w-3.5" aria-hidden />
              {VENUE_KIND_LABELS[venue.kind]}
            </span>
            <Badge tone={open ? 'success' : 'neutral'}>{open ? 'Open now' : 'Closed now'}</Badge>
            {venue.beachPointName ? (
              <span className="inline-flex items-center gap-1 text-[12px] text-mist">
                <MapPin className="h-3.5 w-3.5 text-sea" aria-hidden />
                {venue.beachPointName} beach point
              </span>
            ) : null}
          </div>

          <div>
            <h1 className="font-display text-[28px] leading-tight text-foam sm:text-[36px]">
              {venue.name}
            </h1>
            {venue.nameBn ? (
              <p className="mt-0.5 text-[16px] text-mist" lang="bn">
                {venue.nameBn}
              </p>
            ) : null}
          </div>

          {venue.cuisineTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {venue.cuisineTags.map((tag) => (
                <span key={tag} className="rounded bg-surface px-2 py-0.5 text-[11px] text-mist">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {hasActions ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {venue.reservationsEnabled ? (
                <a
                  href="#reserve"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-sea px-4 py-2 text-[13px] font-semibold text-abyss transition-colors hover:bg-sea-deep"
                >
                  <CalendarCheck className="h-4 w-4" aria-hidden />
                  Reserve a table
                </a>
              ) : null}
              {venue.deliveryEnabled ? (
                <a
                  href="#order"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-sand/40 bg-sand/10 px-4 py-2 text-[13px] font-semibold text-sand transition-colors hover:bg-sand/20"
                >
                  <Bike className="h-4 w-4" aria-hidden />
                  Order to your sunbed
                </a>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-surface">
          <VenueImage src={venue.imageUrl} alt={venue.name} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Panel className="space-y-4 p-5">
            <h2 className="text-[18px] font-semibold text-foam">About this venue</h2>
            {venue.description ? (
              <p className="text-[13.5px] leading-relaxed text-mist">{venue.description}</p>
            ) : null}

            <dl className="grid gap-3 border-t border-line pt-4 text-[12.5px] sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 flex-none text-sea" aria-hidden />
                <div>
                  <dt className="text-mist">Opening hours</dt>
                  <dd className="font-mono text-foam">
                    {venueHoursLabel(venue.openHour, venue.closeHour)}{' '}
                    <span className="font-sans text-[11px] text-mist">(Asia/Dhaka)</span>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Compass className="mt-0.5 h-4 w-4 flex-none text-sea" aria-hidden />
                <div>
                  <dt className="text-mist">Address</dt>
                  <dd className="text-foam">
                    {venue.address ??
                      (venue.beachPointName
                        ? `On the beach at ${venue.beachPointName}`
                        : 'Address not listed')}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-none text-sea" aria-hidden />
                <div>
                  <dt className="text-mist">Phone</dt>
                  <dd className="text-foam">
                    {venue.contactPhone ? (
                      <a
                        href={`tel:${venue.contactPhone.replace(/\s+/g, '')}`}
                        className="hover:underline"
                      >
                        {venue.contactPhone}
                      </a>
                    ) : (
                      'Not listed'
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Utensils className="mt-0.5 h-4 w-4 flex-none text-sea" aria-hidden />
                <div>
                  <dt className="text-mist">Dishes from</dt>
                  <dd className="text-foam">
                    {venue.priceFromMinor === null
                      ? '—'
                      : formatDiningPrice(venue.priceFromMinor, venue.currency)}{' '}
                    <span className="text-[11px] text-sand">indicative demo price</span>
                  </dd>
                </div>
              </div>
            </dl>
          </Panel>

          <section aria-labelledby="menu-title" className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="menu-title" className="text-[20px] font-bold text-foam">
                Menu
              </h2>
              <Badge tone="sand">Indicative demo prices</Badge>
            </div>
            <MenuList menu={venue.menu} />
          </section>
        </div>

        <aside aria-label="Book or order" className="space-y-4 lg:sticky lg:top-24">
          {venue.reservationsEnabled ? (
            <div id="reserve" className="scroll-mt-24">
              <ReservationPanel venue={venue} viewer={viewer} />
            </div>
          ) : null}
          {venue.deliveryEnabled ? (
            <div id="order" className="scroll-mt-24">
              <FoodOrderPanel venue={venue} viewer={viewer} />
            </div>
          ) : null}

          <Panel className="space-y-3 p-5">
            <p className="label">Demo service terms</p>
            <ul className="space-y-2 text-[12px] leading-relaxed text-mist">
              {venue.reservationsEnabled ? (
                <li>
                  Table reservation deposit:{' '}
                  <strong className="text-foam">
                    {venue.reservationDepositMinor > 0
                      ? formatDiningPrice(venue.reservationDepositMinor, venue.currency)
                      : 'none'}
                  </strong>{' '}
                  (simulated — no money is collected).
                </li>
              ) : null}
              {venue.deliveryEnabled ? (
                <li>
                  Delivers to booked sunbeds
                  {venue.beachPointName ? ` at ${venue.beachPointName}` : ''} during opening hours.
                </li>
              ) : null}
              {!hasActions ? (
                <li>This venue is listed for discovery only; walk in during opening hours.</li>
              ) : null}
              <li>All prices and payments are simulated for this proposal demo.</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
