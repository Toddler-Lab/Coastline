import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getViewer } from '@/lib/session';
import { apiErrorMessage, loadDestination, loadInventory } from '@/lib/places-server';
import { ErrorState } from '@/components/ui/states';
import { DestinationDroneView } from '@/components/landing/destination-drone-view';

type Params = { destination: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const viewer = await getViewer();
  const rawSlug = (await params).destination;
  let destination = await loadDestination(rawSlug, viewer.userId).catch(() => null);
  if (!destination && rawSlug === 'coxs') {
    destination = await loadDestination('coxs-bazar', viewer.userId).catch(() => null);
  }
  return destination
    ? { title: destination.name, description: destination.tagline }
    : { title: 'Destination' };
}

export default async function DestinationPage({ params }: { params: Promise<Params> }) {
  const rawSlug = (await params).destination;
  const viewer = await getViewer();

  let destination;
  try {
    destination = await loadDestination(rawSlug, viewer.userId);
    if (!destination && rawSlug === 'coxs') {
      destination = await loadDestination('coxs-bazar', viewer.userId);
    }
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState
          title="This destination could not be loaded"
          message={apiErrorMessage(error)}
          retryHref={`/d/${rawSlug}`}
        />
      </div>
    );
  }
  if (!destination) notFound();

  const inventory = await loadInventory(viewer.userId, destination.slug);

  return (
    <DestinationDroneView
      destination={destination}
      inventory={inventory}
      slug={rawSlug}
    />
  );
}
