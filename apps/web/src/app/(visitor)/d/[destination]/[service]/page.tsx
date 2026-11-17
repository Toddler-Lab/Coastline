import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getViewer } from '@/lib/session';
import { loadInventory } from '@/lib/places-server';
import { findDestination } from '@/lib/places';
import { SERVICES, isServiceKey } from '@/lib/services';
import { ServiceListView, type ListParams } from '@/components/patterns/service-list';

type Params = { destination: string; service: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { destination, service } = await params;
  const place = findDestination(destination);
  return {
    title:
      place && isServiceKey(service) ? `${SERVICES[service].label} in ${place.name}` : 'Not found',
  };
}

export default async function DestinationServicePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ListParams>;
}) {
  const { destination: slug, service } = await params;
  const destination = findDestination(slug);
  if (!destination || !isServiceKey(service)) notFound();
  const viewer = await getViewer();
  const inventory = await loadInventory(viewer.userId);
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
