import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, Camera, Flag } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { loadTrips } from '@/lib/trips-server';
import { isUpcoming, type TripItem } from '@/lib/trips';
import { cn } from '@/lib/cn';
import { dhakaDateKey, relativeDateLabel } from '@/lib/format';
import { EmptyState, Notice } from '@/components/ui/states';
import { PageHeader } from '@/components/patterns/hub';
import { TripCard } from '@/components/patterns/trip-card';

export const metadata: Metadata = { title: 'Trips' };

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'requests', label: 'Requests' },
  { id: 'reports', label: 'Reports' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function groupByDay(trips: TripItem[]): Array<{ dateKey: string; trips: TripItem[] }> {
  const groups = new Map<string, TripItem[]>();
  for (const trip of trips) {
    const list = groups.get(trip.dateKey) ?? [];
    list.push(trip);
    groups.set(trip.dateKey, list);
  }
  return [...groups.entries()].map(([dateKey, list]) => ({ dateKey, trips: list }));
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const tab: TabId = TABS.some((item) => item.id === query.tab) ? (query.tab as TabId) : 'upcoming';
  const viewer = await getViewer();
  const { trips, failed } = await loadTrips(viewer.userId);
  const today = dhakaDateKey();

  const upcoming = trips
    .filter(isUpcoming)
    // Live items first, then by start.
    .sort((a, b) => Number(b.live) - Number(a.live) || a.startAt.localeCompare(b.startAt));
  const past = trips
    .filter((trip) => !isUpcoming(trip))
    .sort((a, b) => b.startAt.localeCompare(a.startAt));
  const counts: Partial<Record<TabId, number>> = { upcoming: upcoming.length, past: past.length };

  // Live items always group under Today.
  const upcomingGroups = groupByDay(
    upcoming.map((trip) => (trip.live ? { ...trip, dateKey: today } : trip)),
  ).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  return (
    <div className="page max-w-3xl">
      <PageHeader title="Trips" className="lg:pt-6" />
      <nav aria-label="Trip types" className="border-b border-line">
        <ul className="scrollbar-none flex overflow-x-auto">
          {TABS.map((item) => (
            <li key={item.id}>
              <Link
                href={item.id === 'upcoming' ? '/trips' : `/trips?tab=${item.id}`}
                aria-current={tab === item.id ? 'page' : undefined}
                className={cn(
                  'relative inline-flex h-12 items-center gap-1.5 px-4 text-label',
                  tab === item.id ? 'text-primary' : 'text-muted hover:text-fg',
                )}
              >
                {item.label}
                {counts[item.id] ? (
                  <span className="tabular rounded-full bg-surface-alt px-2 text-caption text-muted">
                    {counts[item.id]}
                  </span>
                ) : null}
                {tab === item.id ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-primary"
                  />
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {failed ? (
        <Notice tone="warn" className="mt-4" title="Some bookings did not load">
          Refresh the page to try again.
        </Notice>
      ) : null}

      <div className="mt-6">
        {tab === 'upcoming' ? (
          upcomingGroups.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No upcoming trips"
              body="Bookings you make appear here with their tickets."
              action={{ label: 'Explore what to book', href: '/' }}
            />
          ) : (
            <div className="space-y-8">
              {upcomingGroups.map((group) => (
                <section key={group.dateKey} aria-labelledby={`day-${group.dateKey}`}>
                  <h2 id={`day-${group.dateKey}`} className="mb-3 text-title-sm">
                    {relativeDateLabel(group.dateKey, today)}
                  </h2>
                  <ul className="space-y-3">
                    {group.trips.map((trip) => (
                      <li key={trip.ref}>
                        <TripCard trip={trip} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )
        ) : tab === 'past' ? (
          past.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No past trips yet"
              body="Completed and cancelled bookings move here."
            />
          ) : (
            <ul className="space-y-3">
              {past.map((trip) => (
                <li key={trip.ref}>
                  <TripCard trip={trip} />
                </li>
              ))}
            </ul>
          )
        ) : tab === 'requests' ? (
          <EmptyState
            icon={Camera}
            title="No requests"
            body="Photographer and guide requests, with the bids you receive, will appear here once hiring opens."
          />
        ) : (
          <EmptyState
            icon={Flag}
            title="No reports"
            body="Lost-item reports, claims and problems you report will appear here with their status."
            action={{ label: 'Get help', href: '/help' }}
          />
        )}
      </div>
    </div>
  );
}
