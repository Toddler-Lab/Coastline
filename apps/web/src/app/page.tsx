import type { Metadata } from 'next';
import { MAX_ADVANCE_DAYS, type BeachPointSummary } from '@coastline/api-contracts';
import { ApiError, serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { addDays, dhakaDateKey } from '@/lib/format';
import { ApiOffline } from '@/components/booking/api-offline';
import { BeachMapExperience } from '@/components/booking/beach-map-experience';

export const metadata: Metadata = {
  title: 'Beach map',
  description:
    "A live survey of six Cox's Bazar beach points. Pick a free sunbed, book it by the hour, and show the demo QR ticket at the bed.",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Invalid dates fall back to today; out-of-range dates clamp to the 8-day demo window. */
function normalizeDate(value: string | undefined, today: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return today;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    return today;
  }
  const last = addDays(today, MAX_ADVANCE_DAYS);
  if (value < today) {
    return today;
  }
  return value > last ? last : value;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const today = dhakaDateKey();
  const date = normalizeDate(first(query.date), today);
  const requestedPoint = first(query.point)?.trim().toUpperCase() ?? '';
  const viewer = await getViewer();

  try {
    const points = await serverApi<BeachPointSummary[]>(
      `/beach-points?date=${encodeURIComponent(date)}`,
      viewer.userId,
    );
    const initialPointCode = points.some((point) => point.code === requestedPoint)
      ? requestedPoint
      : null;

    return (
      <BeachMapExperience
        initialPoints={points}
        initialDate={date}
        today={today}
        initialPointCode={initialPointCode}
        viewer={viewer.user}
      />
    );
  } catch (error) {
    const message =
      error instanceof ApiError
        ? `${error.message} If the API is not running, start it on port 3001 and try again.`
        : 'The booking API is offline. Start the API on port 3001, then try again.';

    return (
      <main className="grid-paper flex min-h-[calc(100dvh-var(--header-height)-var(--banner-height))] items-center px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-xl">
          <p className="label">Survey unavailable</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">The map is off the air.</h1>
          <p className="mt-3 max-w-prose text-[13.5px] leading-relaxed text-mist">
            Coastline reads live availability from the booking API. Nothing here is cached, so the
            map returns as soon as the API does.
          </p>
          <ApiOffline title="Could not load beach points" message={message} />
        </div>
      </main>
    );
  }
}
