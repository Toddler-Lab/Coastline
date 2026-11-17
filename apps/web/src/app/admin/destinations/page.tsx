import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { loadDestinations } from '@/lib/places-server';
import { Card } from '@/components/ui/display';
import { ErrorState, Notice } from '@/components/ui/states';
import { AerialImage } from '@/components/patterns/hub';
import { StaffPage } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Destinations' };

export default async function AdminDestinationsPage() {
  const viewer = await getViewer();
  const { destinations, offline } = await loadDestinations(viewer.userId);
  return (
    <StaffPage title="Destinations" description="Places visitors can explore, and the spots inside them.">
      <Notice tone="info" icon={Info} className="mb-4">
        Adding and editing destinations, spots, photos, accents and help contacts comes with the admin console update
        (WP-18). This list is read from the places API.
      </Notice>
      {offline ? (
        <ErrorState message="The places API did not answer." retryHref="/admin/destinations" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <li key={destination.slug} data-accent={destination.accent}>
              <Link href={`/admin/destinations/${destination.slug}`} className="block">
                <Card className="overflow-hidden hover:shadow-soft">
                  <AerialImage
                    latitude={destination.latitude}
                    longitude={destination.longitude}
                    zoom={Math.max(destination.mapZoom - 1, 8)}
                    cols={3}
                    rows={2}
                    label={`Aerial view of ${destination.name}`}
                    className="aspect-[16/9] w-full"
                  />
                  <div className="flex items-center gap-3 border-t-4 border-accent p-4">
                    <div className="flex-1">
                      <p className="text-title-sm">{destination.name}</p>
                      <p className="text-body-sm text-muted">
                        {destination.spotCount} spots · {destination.services.stay} stays · {destination.services.food}{' '}
                        food · {destination.services.sunbeds} sunbed beaches
                      </p>
                    </div>
                    <ChevronRight aria-hidden className="size-5 text-muted" />
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
