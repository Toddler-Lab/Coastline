import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Phone } from 'lucide-react';
import type { BeachPointSummary } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, loadDestination } from '@/lib/places-server';
import { SPOT_KIND_LABELS, spotHref } from '@/lib/places';
import { formatMoney, hoursRange } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { ErrorState } from '@/components/ui/states';
import { AlertList } from '@/components/patterns/alerts';
import { StaffPage } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Destination' };

export default async function AdminDestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const viewer = await getViewer();
  let destination;
  let points: BeachPointSummary[] = [];
  try {
    [destination, points] = await Promise.all([
      loadDestination(slug, viewer.userId),
      serverApi<BeachPointSummary[]>('/admin/beach-points', viewer.userId),
    ]);
  } catch (error) {
    return (
      <StaffPage title="Destination">
        <ErrorState message={apiErrorMessage(error)} retryHref={`/admin/destinations/${slug}`} />
      </StaffPage>
    );
  }
  if (!destination) notFound();
  const bedsByCode = new Map(points.map((point) => [point.code, point]));

  return (
    <StaffPage
      title={destination.name}
      description={destination.tagline}
      actions={
        <>
          <Link href="/admin/destinations" className={buttonClass('text')}>
            <ArrowLeft aria-hidden className="size-5" /> Destinations
          </Link>
          <Link href={`/d/${destination.slug}`} target="_blank" className={buttonClass('secondary')}>
            View as visitor <ExternalLink aria-hidden className="size-4" />
          </Link>
        </>
      }
    >
      <AlertList alerts={destination.alerts} className="mb-6" />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="spots-title">
          <h2 id="spots-title" className="mb-3 text-title">
            Spots
          </h2>
          <ul className="space-y-2">
            {destination.spots.map((spot) => {
              const point = spot.beachPointCode ? bedsByCode.get(spot.beachPointCode) : undefined;
              return (
                <li key={spot.slug}>
                  <Card className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="text-title-sm">{spot.name}</span>
                        <StatusBadge tone="success" label="Visible" />
                      </p>
                      <p className="text-body-sm text-muted">
                        {SPOT_KIND_LABELS[spot.kind]}
                        {spot.openHours ? ` · ${hoursRange(spot.openHours.open, spot.openHours.close)}` : ''}
                        {point
                          ? ` · ${point.totalBeds} sunbeds from ${formatMoney(point.defaultHourlyPriceMinor, point.currency)} / hour (${point.code})`
                          : ''}
                      </p>
                      <p className="text-body-sm text-muted">
                        {spot.services.stay} stays · {spot.services.food} food
                      </p>
                      <p className="tabular text-caption text-muted">
                        {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                      </p>
                    </div>
                    <Link href={spotHref(destination.slug, spot.slug)} target="_blank" className={buttonClass('secondary', 'sm')}>
                      Open spot hub
                    </Link>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
        <aside aria-labelledby="contacts-title">
          <h2 id="contacts-title" className="mb-3 text-title">
            Help contacts
          </h2>
          <Card as="div" className="divide-y divide-line">
            {destination.emergencyContacts.length === 0 ? (
              <p className="p-4 text-body-sm text-muted">No numbers entered yet.</p>
            ) : (
              destination.emergencyContacts.map((contact) => (
                <div key={contact.phone + contact.kind} className="flex items-center gap-3 p-4">
                  <Phone aria-hidden className="size-5 text-muted" />
                  <div>
                    <p className="text-label">{contact.phone}</p>
                    <p className="text-body-sm text-muted">{contact.label}</p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </aside>
      </div>
    </StaffPage>
  );
}
