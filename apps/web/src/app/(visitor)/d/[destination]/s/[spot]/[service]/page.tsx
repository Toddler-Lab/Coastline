import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getViewer } from '@/lib/session';
import { loadInventory } from '@/lib/places-server';
import { findDestination, findSpot, spotInventory, sunbedPickerHref } from '@/lib/places';
import { SERVICES, isServiceKey } from '@/lib/services';
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
  const { destination: slug, spot: spotParam, service } = await params;
  const destination = findDestination(slug);
  if (!destination || !isServiceKey(service)) notFound();
  const viewer = await getViewer();
  const inventory = await loadInventory(viewer.userId);
  const spot = findSpot(inventory.spots, spotParam);
  if (!spot) notFound();
  // A spot has one sunbed row; go straight to its picker.
  if (service === 'sunbeds') redirect(sunbedPickerHref(spot));

  return (
    <ServiceListView
      destination={destination}
      spot={spot}
      service={service}
      inventory={spotInventory(inventory, spot)}
      params={await searchParams}
      offline={inventory.offline}
    />
  );
}
