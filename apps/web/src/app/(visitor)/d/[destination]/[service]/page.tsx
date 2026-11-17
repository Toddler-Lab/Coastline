import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, loadDestination, loadInventory } from '@/lib/places-server';
import { SERVICES, isServiceKey } from '@/lib/services';
import { ErrorState } from '@/components/ui/states';
import { ServiceListView, type ListParams } from '@/components/patterns/service-list';

type Params = { destination: string; service: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { service } = await params;
  return { title: isServiceKey(service) ? SERVICES[service].label : 'Not found' };
}

export default async function DestinationServicePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ListParams>;
}) {
  const { destination: slug, service } = await params;
  if (!isServiceKey(service)) notFound();
  const viewer = await getViewer();
  let destination;
  try {
    destination = await loadDestination(slug, viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState message={apiErrorMessage(error)} retryHref={`/d/${slug}/${service}`} />
      </div>
    );
  }
  if (!destination) notFound();
  const inventory = await loadInventory(viewer.userId, destination.slug);
  return (
    <ServiceListView
      destination={destination}
      spot={null}
      service={service}
      inventory={inventory}
      params={await searchParams}
      offline={inventory.offline}
    />
  );
}
