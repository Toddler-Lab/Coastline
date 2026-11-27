import type { Metadata } from 'next';
import type { AdminReservationDto, DiningAdminVenueDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';
import { apiErrorMessage } from '@/lib/places-server';
import { dhakaDateKey, isDateKey } from '@/lib/format';
import { ChipLink, ChipRow } from '@/components/ui/chip';
import { ErrorState } from '@/components/ui/feedback-states';
import { DateNav } from '@/components/workspace/date-nav';
import { StaffPage } from '@/components/workspace/staff-page-shell';
import { ReservationDesk } from '@/components/workspace/reservation-desk';

export const metadata: Metadata = { title: 'Bookings' };

export default async function ProviderBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const today = dhakaDateKey();
  const date = typeof query.date === 'string' && isDateKey(query.date) ? query.date : today;
  const venue = typeof query.venue === 'string' ? query.venue.toUpperCase() : undefined;
  const viewer = await getViewer();

  let reservations: AdminReservationDto[];
  let venues: DiningAdminVenueDto[] = [];
  try {
    const search = new URLSearchParams({ date });
    if (venue) search.set('venueCode', venue);
    [reservations, venues] = await Promise.all([
      serverApi<AdminReservationDto[]>(`/admin/dining/reservations?${search}`, viewer.userId),
      serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId),
    ]);
  } catch (error) {
    return (
      <StaffPage title="Bookings">
        <ErrorState message={apiErrorMessage(error)} retryHref="/provider/bookings" />
      </StaffPage>
    );
  }

  const reservable = venues.filter((item) => item.reservationsEnabled);
  const keep = (extra: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    const merged = {
      date: date === today ? undefined : date,
      venue: venue?.toLowerCase(),
      ...extra,
    };
    for (const [key, value] of Object.entries(merged)) if (value) search.set(key, value);
    const text = search.toString();
    return text ? `/provider/bookings?${text}` : '/provider/bookings';
  };

  return (
    <StaffPage
      title="Bookings"
      description="Table reservations. Check guests in when they arrive."
      actions={
        <DateNav
          base="/provider/bookings"
          date={date}
          today={today}
          params={{ venue: venue?.toLowerCase() }}
        />
      }
    >
      {reservable.length > 1 ? (
        <ChipRow label="Venue" className="mb-4">
          <ChipLink href={keep({ venue: undefined })} selected={!venue}>
            All venues
          </ChipLink>
          {reservable.map((item) => (
            <ChipLink
              key={item.code}
              href={keep({ venue: item.code.toLowerCase() })}
              selected={venue === item.code}
            >
              {item.name}
            </ChipLink>
          ))}
        </ChipRow>
      ) : null}
      <ReservationDesk reservations={reservations} />
      <p className="mt-3 text-caption text-muted">
        Times are Bangladesh time. Deposits and refunds are recorded payments; no money moves.
      </p>
    </StaffPage>
  );
}
