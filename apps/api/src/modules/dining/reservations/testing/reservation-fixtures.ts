import type { PrismaService } from '../../../../common/prisma/prisma.service';
import { dhakaDateKey, dhakaHourToUtc } from '../../../../common/time/dhaka';

/** Deterministic dining fixtures for the reservation specs (stream B only). */
export const RES_VENUES = {
  /** Reservable, 50 BDT deposit, open 08:00–22:00. */
  main: { id: '30000000-0000-4000-8000-0000000000b1', code: 'TST-GRILL' },
  /** Reservable, no deposit, open all day (availability "past hour" checks). */
  free: { id: '30000000-0000-4000-8000-0000000000b2', code: 'TST-ALLDAY' },
  /** Active, but reservations disabled. */
  noRes: { id: '30000000-0000-4000-8000-0000000000b3', code: 'TST-STALL' },
  /** Hidden from tourists. */
  inactive: { id: '30000000-0000-4000-8000-0000000000b4', code: 'TST-CLOSED' },
} as const;

export const RES_TABLES = {
  mainT1: { id: '31000000-0000-4000-8000-0000000000b1', code: 'TST-GRILL-T1', seats: 4 },
  mainT2: { id: '31000000-0000-4000-8000-0000000000b2', code: 'TST-GRILL-T2', seats: 2 },
  mainRetired: { id: '31000000-0000-4000-8000-0000000000b3', code: 'TST-GRILL-T9', seats: 6 },
  freeT1: { id: '31000000-0000-4000-8000-0000000000b4', code: 'TST-ALLDAY-T1', seats: 4 },
  noResT1: { id: '31000000-0000-4000-8000-0000000000b5', code: 'TST-STALL-T1', seats: 4 },
  inactiveT1: { id: '31000000-0000-4000-8000-0000000000b6', code: 'TST-CLOSED-T1', seats: 4 },
} as const;

export const MAIN_DEPOSIT_MINOR = 5000;

/** Adds the reservation venues on top of `seedTestCatalogue` (which truncates dining tables). */
export async function seedReservationVenues(prisma: PrismaService): Promise<void> {
  await prisma.diningVenue.createMany({
    data: [
      {
        id: RES_VENUES.main.id,
        code: RES_VENUES.main.code,
        name: 'Test Grill House',
        kind: 'RESTAURANT',
        openHour: 8,
        closeHour: 22,
        reservationsEnabled: true,
        reservationDepositMinor: MAIN_DEPOSIT_MINOR,
      },
      {
        id: RES_VENUES.free.id,
        code: RES_VENUES.free.code,
        name: 'Test All-Day Cafe',
        kind: 'RESTAURANT',
        openHour: 0,
        closeHour: 24,
        reservationsEnabled: true,
      },
      {
        id: RES_VENUES.noRes.id,
        code: RES_VENUES.noRes.code,
        name: 'Test Beach Stall',
        kind: 'BEACH_STALL',
        openHour: 8,
        closeHour: 20,
        reservationsEnabled: false,
      },
      {
        id: RES_VENUES.inactive.id,
        code: RES_VENUES.inactive.code,
        name: 'Test Closed Kitchen',
        kind: 'SEAFOOD_KITCHEN',
        openHour: 8,
        closeHour: 22,
        reservationsEnabled: true,
        isActive: false,
      },
    ],
  });

  await prisma.diningTable.createMany({
    data: [
      { ...RES_TABLES.mainT1, venueId: RES_VENUES.main.id },
      { ...RES_TABLES.mainT2, venueId: RES_VENUES.main.id },
      { ...RES_TABLES.mainRetired, venueId: RES_VENUES.main.id, isActive: false },
      { ...RES_TABLES.freeT1, venueId: RES_VENUES.free.id },
      { ...RES_TABLES.noResT1, venueId: RES_VENUES.noRes.id },
      { ...RES_TABLES.inactiveT1, venueId: RES_VENUES.inactive.id },
    ],
  });
}

/** Dhaka date key `n` days from today. */
export function dayKey(n: number): string {
  return new Date(Date.parse(`${dhakaDateKey()}T00:00:00.000Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** UTC ISO instant of a Dhaka wall-clock hour `n` days from today. */
export function dhakaAt(n: number, hour: number): string {
  return dhakaHourToUtc(dayKey(n), hour).toISOString();
}

/**
 * Moves a stored reservation (and its slots) so it starts `minutesFromNow`
 * from now. Specs use this to put a reservation inside the cancel cutoff or
 * check-in window without faking the clock, the same way the hotel specs
 * rewrite `checkInTime`.
 */
export async function shiftReservation(
  prisma: PrismaService,
  publicRef: string,
  minutesFromNow: number,
): Promise<void> {
  const reservation = await prisma.tableReservation.findUniqueOrThrow({
    where: { publicRef },
    include: { slots: { orderBy: { slotStart: 'asc' } } },
  });
  const duration = reservation.endAt.getTime() - reservation.startAt.getTime();
  const startAt = new Date(Date.now() + minutesFromNow * 60_000);
  await prisma.$transaction([
    prisma.tableReservation.update({
      where: { id: reservation.id },
      data: { startAt, endAt: new Date(startAt.getTime() + duration) },
    }),
    ...reservation.slots.map((slot, index) =>
      prisma.tableSlot.update({
        where: { id: slot.id },
        data: { slotStart: new Date(startAt.getTime() + index * 3_600_000) },
      }),
    ),
  ]);
}
