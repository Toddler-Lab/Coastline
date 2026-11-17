import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { DiningAdminVenueDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { listingHref, venueListingId } from '@/lib/places';
import { buttonClass } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/states';
import { StaffPage } from '@/components/workspace/parts';
import { MenuEditor, VenueSettingsForm } from '@/components/workspace/venue-editor';

export const metadata: Metadata = { title: 'Edit listing' };

export default async function ListingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const code = (await params).id.toUpperCase();
  const viewer = await getViewer();
  let venues: DiningAdminVenueDto[];
  try {
    venues = await serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId);
  } catch (error) {
    return (
      <StaffPage title="Edit listing">
        <ErrorState
          message={apiErrorMessage(error)}
          retryHref={`/provider/listings/${code.toLowerCase()}`}
        />
      </StaffPage>
    );
  }
  const venue = venues.find((item) => item.code === code);
  if (!venue) notFound();

  return (
    <StaffPage
      title={venue.name}
      description="Changes apply as soon as you save."
      actions={
        <>
          <Link href="/provider/listings" className={buttonClass('text')}>
            <ArrowLeft aria-hidden className="size-5" /> All listings
          </Link>
          <Link
            href={listingHref(venueListingId(venue))}
            className={buttonClass('secondary')}
            target="_blank"
          >
            View as visitor <ExternalLink aria-hidden className="size-4" />
          </Link>
        </>
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <VenueSettingsForm venue={venue} />
        <MenuEditor venue={venue} />
      </div>
    </StaffPage>
  );
}
