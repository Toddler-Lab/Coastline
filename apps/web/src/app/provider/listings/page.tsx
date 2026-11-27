import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import type { DiningAdminVenueDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { VENUE_KIND_LABELS } from '@/lib/dining/admin';
import { hoursRange } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/display';
import { EmptyState, ErrorState, Notice } from '@/components/ui/feedback-states';
import { Photo } from '@/components/patterns/spot-hub-sections';
import { StaffPage } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Listings' };

export default async function ProviderListingsPage() {
  const viewer = await getViewer();
  let venues: DiningAdminVenueDto[];
  try {
    venues = await serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId);
  } catch (error) {
    return (
      <StaffPage title="Listings">
        <ErrorState message={apiErrorMessage(error)} retryHref="/provider/listings" />
      </StaffPage>
    );
  }

  return (
    <StaffPage
      title="Listings"
      description="Your venues as visitors see them. Open one to change hours, booking options and the menu."
    >
      <Notice tone="info" icon={Info} className="mb-4">
        Hotels and sunbed rows join this list when provider accounts arrive. New listings and
        approvals come with the listing editor update.
      </Notice>
      {venues.length === 0 ? (
        <EmptyState title="No listings yet" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <li key={venue.id}>
              <Link
                href={`/provider/listings/${venue.code.toLowerCase()}`}
                className="block h-full"
              >
                <Card className="flex h-full flex-col overflow-hidden hover:shadow-soft">
                  <Photo src={venue.imageUrl} alt={venue.name} className="aspect-[16/9] w-full" />
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-title-sm">{venue.name}</h2>
                      <StatusBadge
                        tone={venue.isActive ? 'success' : 'neutral'}
                        label={venue.isActive ? 'Live' : 'Hidden'}
                      />
                    </div>
                    <p className="text-body-sm text-muted">
                      {VENUE_KIND_LABELS[venue.kind]} · {venue.beachPointName ?? 'In town'} ·{' '}
                      {hoursRange(venue.openHour, venue.closeHour)}
                    </p>
                    <p className="text-body-sm text-muted">
                      {[
                        venue.reservationsEnabled && 'Tables',
                        venue.deliveryEnabled && 'Sunbed delivery',
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'No bookings'}
                      {' · '}
                      {venue.menu.reduce((sum, category) => sum + category.items.length, 0)} menu
                      items
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-2 text-label text-primary">
                      Edit <ChevronRight aria-hidden className="size-5" />
                    </span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </StaffPage>
  );
}
