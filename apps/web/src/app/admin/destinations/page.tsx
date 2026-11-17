import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import { DESTINATIONS } from '@/lib/places';
import { Card } from '@/components/ui/display';
import { Notice } from '@/components/ui/states';
import { AerialImage } from '@/components/patterns/hub';
import { StaffPage } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Destinations' };

export default function AdminDestinationsPage() {
  return (
    <StaffPage
      title="Destinations"
      description="Places visitors can explore, and the spots inside them."
    >
      <Notice tone="info" icon={Info} className="mb-4">
        Adding destinations and editing spots, photos, accents and help contacts comes with the
        admin console update (WP-05 and WP-18). Spots below are read live from the sunbed engine.
      </Notice>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((destination) => (
          <li key={destination.slug} data-accent={destination.accent}>
            <Link href={`/admin/destinations/${destination.slug}`} className="block">
              <Card className="overflow-hidden hover:shadow-soft">
                <AerialImage
                  latitude={destination.hero.latitude}
                  longitude={destination.hero.longitude}
                  zoom={destination.hero.zoom}
                  cols={3}
                  rows={2}
                  label={`Aerial view of ${destination.name}`}
                  className="aspect-[16/9] w-full"
                />
                <div className="flex items-center gap-3 border-t-4 border-accent p-4">
                  <div className="flex-1">
                    <p className="text-title-sm">{destination.name}</p>
                    <p className="text-body-sm text-muted">
                      Accent {destination.accent.toLowerCase()} · visible
                    </p>
                  </div>
                  <ChevronRight aria-hidden className="size-5 text-muted" />
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </StaffPage>
  );
}
