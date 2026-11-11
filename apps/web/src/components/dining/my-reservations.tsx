import Link from 'next/link';
import { ArrowRight, Clock, Users } from 'lucide-react';
import type { ReservationDto, ReservationListDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { phasePresentation } from '@/lib/booking';
import { formatMoney } from '@/lib/format';
import {
  reservationHref,
  reservationStatusPresentation,
  reservationWindowLabel,
} from '@/lib/dining/reservations';
import { Badge } from '@/components/ui/badge';

/**
 * Table reservations for the current tourist persona on /bookings. Renders
 * nothing when there are none or the API is unreachable, so the sunbed list
 * stays the page's primary content.
 */
export async function MyReservations({ userId }: { userId: string }) {
  let reservations: ReservationDto[];
  try {
    reservations = (await serverApi<ReservationListDto>('/dining/reservations/me', userId))
      .reservations;
  } catch {
    return null;
  }
  if (reservations.length === 0) {
    return null;
  }

  const upcoming = reservations
    .filter((r) => r.phase === 'UPCOMING' || r.phase === 'ACTIVE')
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  const history = reservations.filter((r) => r.phase === 'PAST' || r.phase === 'CANCELLED');

  return (
    <section aria-labelledby="group-reservations" className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <div>
          <p className="label">Dining</p>
          <h2 id="group-reservations" className="mt-1 text-[22px]">
            Table reservations
          </h2>
        </div>
        <span className="font-mono text-[10px] text-mist">
          {reservations.length} {reservations.length === 1 ? 'reservation' : 'reservations'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[...upcoming, ...history].map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} />
        ))}
      </div>
    </section>
  );
}

function ReservationCard({ reservation }: { reservation: ReservationDto }) {
  const phase = phasePresentation(reservation.phase);
  const status = reservationStatusPresentation(reservation.status);
  return (
    <article className="panel flex flex-col gap-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="label">Reservation</p>
          <p className="mt-1 font-mono text-[13px] tracking-[0.02em] text-foam">
            {reservation.publicRef}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={phase.tone}>{phase.label}</Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </div>
      <div>
        <h3 className="text-[19px]">{reservation.venue.name}</h3>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist">
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden className="h-3 w-3 text-sea" />
            <span className="font-mono text-[11px] text-foam">
              {reservationWindowLabel(reservation)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden className="h-3 w-3 text-sea" />
            Table {reservation.table.code} · {reservation.partySize}
          </span>
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
        <p className="text-[11px] text-mist">
          {reservation.depositMinor > 0
            ? `Demo deposit ${formatMoney(reservation.depositMinor)} · simulated`
            : 'No deposit'}
        </p>
        <Link
          href={reservationHref(reservation.publicRef)}
          className="inline-flex min-h-11 items-center gap-1.5 text-[12px] text-sea hover:text-foam"
        >
          Details
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
