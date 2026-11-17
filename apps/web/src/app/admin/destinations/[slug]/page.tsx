import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { BeachPointSummary } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { findDestination, spotHref } from '@/lib/places';
import { formatMoney, hoursRange } from '@/lib/format';
import { StatusBadge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { ErrorState } from '@/components/ui/states';
import { StaffPage } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Destination' };

export default async function AdminDestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const destination = findDestination((await params).slug);
  if (!destination) notFound();
  const viewer = await getViewer();
  let points: BeachPointSummary[];
  try {
    points = await serverApi<BeachPointSummary[]>('/admin/beach-points', viewer.userId);
  } catch (error) {
    return (
      <StaffPage title={destination.name}>
        <ErrorState
          message={apiErrorMessage(error)}
          retryHref={`/admin/destinations/${destination.slug}`}
        />
      </StaffPage>
    );
  }

  return (
    <StaffPage
      title={destination.name}
      description={destination.tagline}
      actions={
        <>
          <Link href="/admin/destinations" className={buttonClass('text')}>
            <ArrowLeft aria-hidden className="size-5" /> Destinations
          </Link>
          <Link
            href={`/d/${destination.slug}`}
            target="_blank"
            className={buttonClass('secondary')}
          >
            View as visitor <ExternalLink aria-hidden className="size-4" />
          </Link>
        </>
      }
    >
      <h2 className="mb-3 text-title">Spots</h2>
      <ul className="space-y-2">
        {[...points]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((point) => (
            <li key={point.code}>
              <Card className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="text-title-sm">{point.name}</span>
                    <span className="font-mono text-caption text-muted">{point.code}</span>
                    <StatusBadge
                      tone={point.isActive ? 'success' : 'neutral'}
                      label={point.isActive ? 'Visible' : 'Hidden'}
                    />
                  </p>
                  <p className="text-body-sm text-muted">
                    Beach · {hoursRange(point.openHour, point.closeHour)} · {point.totalBeds}{' '}
                    sunbeds from {formatMoney(point.defaultHourlyPriceMinor, point.currency)} / hour
                  </p>
                  <p className="tabular text-caption text-muted">
                    {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  </p>
                </div>
                <Link
                  href={spotHref(destination.slug, point)}
                  target="_blank"
                  className={buttonClass('secondary', 'sm')}
                >
                  Open spot hub
                </Link>
              </Card>
            </li>
          ))}
      </ul>
    </StaffPage>
  );
}
