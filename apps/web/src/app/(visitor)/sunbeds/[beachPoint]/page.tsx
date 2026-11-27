import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MAX_ADVANCE_DAYS, type BeachPointSummary } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { addDays, dhakaDateKey, isDateKey } from '@/lib/format';
import { ErrorState } from '@/components/ui/feedback-states';
import { SunbedPicker } from '@/components/flows/sunbed-picker';

export const metadata: Metadata = { title: 'Sunbeds' };

type Params = { beachPoint: string };

export default async function SunbedPickerPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const code = (await params).beachPoint.toUpperCase();
  const query = await searchParams;
  const today = dhakaDateKey();
  const requested = typeof query.date === 'string' ? query.date : undefined;
  const last = addDays(today, MAX_ADVANCE_DAYS);
  const date = isDateKey(requested) && requested >= today && requested <= last ? requested : today;
  const viewer = await getViewer();

  let points: BeachPointSummary[];
  try {
    points = await serverApi<BeachPointSummary[]>(`/beach-points?date=${date}`, viewer.userId);
  } catch (error) {
    return (
      <div className="page py-10">
        <ErrorState
          title="Sunbeds could not be loaded"
          message={apiErrorMessage(error)}
          retryHref={`/sunbeds/${code.toLowerCase()}`}
        />
      </div>
    );
  }
  const current = points.find((point) => point.code === code && point.isActive && point.totalBeds > 0);
  if (!current) notFound();
  // Beach chips switch between the sunbed rows of the same destination.
  const active = points
    .filter((point) => point.isActive && point.totalBeds > 0 && point.destinationSlug === current.destinationSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <SunbedPicker
      key={code}
      points={active}
      code={code}
      initialDate={date}
      today={today}
    />
  );
}
