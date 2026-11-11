import type { Metadata } from 'next';
import Link from 'next/link';
import type { DiningAdminVenueDto } from '@coastline/api-contracts';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/components/ui/panel';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { serverApi } from '@/lib/api';
import { VENUE_KIND_LABELS, diningErrorMessage, venueHours } from '@/lib/dining/admin';
import { formatMoney } from '@/lib/format';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Dining venues' };

const TH = 'px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.14em]';

export default async function AdminDiningVenuesPage() {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  let venues: DiningAdminVenueDto[] | null = null;
  let failure: string | null = null;
  try {
    venues = await serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId);
  } catch (error) {
    failure = diningErrorMessage(error);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dining"
        className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist hover:text-foam"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Dining desk
      </Link>
      <AdminPageHeader
        eyebrow="Operations · dining"
        title="Venues & menus"
        description="Every venue, including inactive ones. Open a venue to change its hours, toggles, simulated deposit and menu."
      />

      {!venues ? (
        <ErrorState title="Venues unavailable" message={failure ?? 'The API did not answer.'} />
      ) : venues.length === 0 ? (
        <EmptyState
          title="No dining venues"
          body="Seed the demo database to load the sample restaurants and stalls."
        />
      ) : (
        <Panel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-mist">
                  <th scope="col" className={`${TH} px-4`}>
                    Venue
                  </th>
                  <th scope="col" className={TH}>
                    Hours (Dhaka)
                  </th>
                  <th scope="col" className={TH}>
                    Services
                  </th>
                  <th scope="col" className={TH}>
                    Deposit
                  </th>
                  <th scope="col" className={TH}>
                    Menu
                  </th>
                  <th scope="col" className={`${TH} px-4 text-right`}>
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {venues.map((venue) => {
                  const items = venue.menu.flatMap((category) => category.items);
                  const unavailable = items.filter((item) => !item.isAvailable).length;
                  return (
                    <tr
                      key={venue.id}
                      className="border-b border-line/70 last:border-0 hover:bg-raised/30"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/dining/venues/${encodeURIComponent(venue.code)}`}
                          className="group flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1"
                        >
                          <span className="rounded-md border border-line-strong bg-abyss/60 px-2 py-1 font-mono text-[10px] tracking-[0.08em] text-sea">
                            {venue.code}
                          </span>
                          <span className="font-medium text-foam group-hover:text-sea">
                            {venue.name}
                          </span>
                          <span className="text-[11px] text-mist">
                            {VENUE_KIND_LABELS[venue.kind]}
                            {venue.beachPointName ? ` · ${venue.beachPointName}` : ' · Town'}
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] tabular-nums text-mist">
                        {venueHours(venue.openHour, venue.closeHour)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {venue.isActive ? (
                            <Badge tone="success">Active</Badge>
                          ) : (
                            <Badge tone="danger">Inactive</Badge>
                          )}
                          {venue.reservationsEnabled ? <Badge tone="sand">Tables</Badge> : null}
                          {venue.deliveryEnabled ? <Badge tone="sea">Delivery</Badge> : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono tabular-nums text-foam">
                        {venue.reservationDepositMinor > 0
                          ? formatMoney(venue.reservationDepositMinor)
                          : '—'}
                        {venue.reservationDepositMinor > 0 ? (
                          <span className="ml-1 text-[10px] text-mist">demo</span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-mist">
                        {items.length} items
                        {unavailable > 0 ? (
                          <span className="ml-1 text-warn">· {unavailable} off</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/dining/venues/${encodeURIComponent(venue.code)}`}
                          aria-label={`Edit ${venue.name}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-mist transition-colors hover:bg-raised hover:text-sea"
                        >
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-4 py-2.5 text-[11px] text-mist">
            Menu prices are indicative demo prices; deposits are simulated mock charges.
          </p>
        </Panel>
      )}
    </div>
  );
}
