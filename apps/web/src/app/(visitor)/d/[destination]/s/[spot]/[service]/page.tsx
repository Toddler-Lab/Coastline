import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, loadDestination, loadInventory } from '@/lib/places-server';
import { spotInventory, sunbedPickerHref } from '@/lib/places';
import { SERVICES, isServiceKey } from '@/lib/services';
import { ErrorState } from '@/components/ui/feedback-states';
import { ServiceListView, type ListParams } from '@/components/patterns/service-list';

type Params = { destination: string; spot: string; service: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { service } = await params;
  return { title: isServiceKey(service) ? SERVICES[service].label : 'Not found' };
}

export default async function SpotServicePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ListParams>;
}) {
  const { destination: slug, spot: spotSlug, service } = await params;
  if (!isServiceKey(service)) notFound();
  const viewer = await getViewer();
  let destination;
  try {
    destination = await loadDestination(slug, viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState message={apiErrorMessage(error)} retryHref={`/d/${slug}/s/${spotSlug}/${service}`} />
      </div>
    );
  }
  const spot = destination?.spots.find((item) => item.slug === spotSlug);
  if (!destination || !spot) notFound();
  // A spot has at most one sunbed row; go straight to its picker.
  if (service === 'sunbeds' && spot.beachPointCode) redirect(sunbedPickerHref({ code: spot.beachPointCode }));

  const inventory = await loadInventory(viewer.userId, destination.slug);
  return (
    <ServiceListView
      destination={destination}
      spot={spot}
      service={service}
      inventory={spotInventory(inventory, spot.slug)}
      params={await searchParams}
      offline={inventory.offline}
    />
  );
}
