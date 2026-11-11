import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { DiningAdminVenueDto } from '@coastline/api-contracts';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DiningMenuEditor } from '@/components/admin/dining-menu-editor';
import { DiningVenueForm } from '@/components/admin/dining-venue-form';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/states';
import { serverApi } from '@/lib/api';
import { VENUE_KIND_LABELS, diningErrorMessage } from '@/lib/dining/admin';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Dining venue' };

export default async function AdminDiningVenuePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  const { code } = await params;
  const wanted = decodeURIComponent(code).toUpperCase();

  let venues: DiningAdminVenueDto[] | null = null;
  let failure: string | null = null;
  try {
    venues = await serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId);
  } catch (error) {
    failure = diningErrorMessage(error);
  }

  const back = (
    <Link
      href="/admin/dining/venues"
      className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist hover:text-foam"
    >
      <ArrowLeft aria-hidden className="h-4 w-4" />
      All venues
    </Link>
  );

  if (!venues) {
    return (
      <div className="space-y-6">
        {back}
        <ErrorState title="Venue unavailable" message={failure ?? 'The API did not answer.'} />
      </div>
    );
  }

  const venue = venues.find((entry) => entry.code.toUpperCase() === wanted);
  if (!venue) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {back}
      <AdminPageHeader
        eyebrow={`Dining venue · ${venue.code}`}
        title={venue.name}
        description={
          <>
            {VENUE_KIND_LABELS[venue.kind]}
            {venue.beachPointName ? ` at ${venue.beachPointName}` : ' in town'}. Changes apply
            immediately and are audit-logged; existing reservations and food orders keep the prices
            and deposits they were booked with.
          </>
        }
        actions={
          venue.isActive ? (
            <Badge tone="success">Active</Badge>
          ) : (
            <Badge tone="danger">Inactive · hidden from tourists</Badge>
          )
        }
      />

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <DiningVenueForm venue={venue} />
        <DiningMenuEditor venue={venue} />
      </div>
    </div>
  );
}
