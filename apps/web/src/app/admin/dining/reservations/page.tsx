import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MAX_RESERVATION_ADVANCE_DAYS,
  RESERVATION_STATUSES,
  type AdminReservationDto,
  type DiningAdminVenueDto,
} from '@coastline/api-contracts';
import { ArrowLeft, Filter } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { DiningReservationDesk } from '@/components/admin/dining-reservation-desk';
import { normalizeDateKey, readParam } from '@/components/admin/utils';
import { buttonClass } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { Panel } from '@/components/ui/panel';
import { ErrorState } from '@/components/ui/states';
import { serverApi } from '@/lib/api';
import {
  RESERVATION_STATUS_LABELS,
  diningErrorMessage,
  isReservationStatus,
} from '@/lib/dining/admin';
import { addDays, dhakaDateKey, formatLongDateKey } from '@/lib/format';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Dining reservations' };

export default async function AdminDiningReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  const params = await searchParams;
  const today = dhakaDateKey();
  const date = normalizeDateKey(readParam(params.date), today);
  const venueCode = readParam(params.venueCode)?.toUpperCase() ?? '';
  const rawStatus = readParam(params.status);
  const status = isReservationStatus(rawStatus) ? rawStatus : '';

  const query = new URLSearchParams({ date });
  if (venueCode) query.set('venueCode', venueCode);
  if (status) query.set('status', status);

  const [reservationsResult, venuesResult] = await Promise.allSettled([
    serverApi<AdminReservationDto[]>(`/admin/dining/reservations?${query}`, viewer.userId),
    serverApi<DiningAdminVenueDto[]>('/admin/dining/venues', viewer.userId),
  ]);
  const venues =
    venuesResult.status === 'fulfilled'
      ? venuesResult.value.filter((venue) => venue.reservationsEnabled || venue.code === venueCode)
      : [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dining"
        className="inline-flex min-h-11 items-center gap-1.5 text-[12.5px] text-mist hover:text-foam"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Dining desk
      </Link>
      <AdminPageHeader
        eyebrow="Operations · dining"
        title={
          <>
            Reservation desk
            <span className="mt-1 block font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-mist">
              {formatLongDateKey(date)}
              {date === today ? ' · today' : ''}
            </span>
          </>
        }
        description="Table reservations starting on the selected Dhaka day. Check in from 30 minutes before the start; cancelling refunds any simulated deposit."
      />

      <Panel className="p-4">
        <form
          method="get"
          action="/admin/dining/reservations"
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[11rem_minmax(0,1fr)_11rem_auto]"
        >
          <Field label="Dhaka date" htmlFor="desk-date">
            <Input
              id="desk-date"
              name="date"
              type="date"
              defaultValue={date}
              min={addDays(today, -30)}
              max={addDays(today, MAX_RESERVATION_ADVANCE_DAYS)}
            />
          </Field>
          <Field label="Venue" htmlFor="desk-venue">
            <Select id="desk-venue" name="venueCode" defaultValue={venueCode}>
              <option value="">All venues</option>
              {venues.map((venue) => (
                <option key={venue.code} value={venue.code}>
                  {venue.name} ({venue.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="desk-status">
            <Select id="desk-status" name="status" defaultValue={status}>
              <option value="">Any status</option>
              {RESERVATION_STATUSES.map((entry) => (
                <option key={entry} value={entry}>
                  {RESERVATION_STATUS_LABELS[entry]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <button type="submit" className={buttonClass('secondary', 'md')}>
              <Filter aria-hidden className="h-4 w-4" />
              Apply
            </button>
            <Link
              href={`/admin/dining/reservations?date=${today}`}
              className={buttonClass('ghost', 'md')}
            >
              Today
            </Link>
          </div>
        </form>
      </Panel>

      {reservationsResult.status === 'fulfilled' ? (
        <DiningReservationDesk reservations={reservationsResult.value} />
      ) : (
        <ErrorState
          title="Reservations unavailable"
          message={diningErrorMessage(reservationsResult.reason)}
        />
      )}
    </div>
  );
}
