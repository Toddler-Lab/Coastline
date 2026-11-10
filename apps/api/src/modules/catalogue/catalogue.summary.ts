import { MAX_ADVANCE_DAYS, type BeachPointSummary, type SlotDto } from '@coastline/api-contracts';
import type { BeachPoint } from '@coastline/db';
import { PrismaService } from '../../common/prisma/prisma.service';
import { validation } from '../../common/errors/api-errors';
import {
  HOUR_MS,
  dhakaDateKey,
  dhakaHour,
  dhakaHourLabel,
  dhakaHourToUtc,
  isDateKey,
  nextBookableHour,
  toDhaka,
} from '../../common/time/dhaka';

const DAY_MS = 24 * HOUR_MS;

/** A requested Dhaka calendar day, resolved to its UTC bounds. */
export interface DhakaDay {
  /** Requested Dhaka date key (YYYY-MM-DD). */
  dateKey: string;
  /** Inclusive UTC instant of Dhaka 00:00. */
  start: Date;
  /** Exclusive UTC instant of the next Dhaka 00:00. */
  end: Date;
  isToday: boolean;
}

export interface ReferenceSlot {
  /** UTC instant of the slot the free-bed count refers to. */
  start: Date;
  /** Dhaka wall-clock label, e.g. "08:00". */
  label: string;
}

/** Shifts a Dhaka date key by whole days (calendar arithmetic, no DST in Dhaka). */
export function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00.000Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * Normalizes and validates the `date` query parameter.
 *
 * Absent or blank means today in Asia/Dhaka. The public demo only exposes the
 * next {@link MAX_ADVANCE_DAYS} days, so anything else is a 400.
 */
export function resolveDhakaDay(value: string | undefined, now: Date = new Date()): DhakaDay {
  const today = dhakaDateKey(now);
  const dateKey = value === undefined || value.trim() === '' ? today : value.trim();

  if (!isDateKey(dateKey)) {
    throw validation('Choose a real calendar date in YYYY-MM-DD format.', { date: value ?? null });
  }

  const offset = Math.round(
    (Date.parse(`${dateKey}T00:00:00.000Z`) - Date.parse(`${today}T00:00:00.000Z`)) / DAY_MS,
  );

  if (offset < 0 || offset > MAX_ADVANCE_DAYS) {
    throw validation(`Choose a date between today and ${MAX_ADVANCE_DAYS} days ahead.`, {
      date: dateKey,
      maxAdvanceDays: MAX_ADVANCE_DAYS,
    });
  }

  const start = dhakaHourToUtc(dateKey, 0);
  return {
    dateKey,
    start,
    end: new Date(start.getTime() + DAY_MS),
    isToday: dateKey === today,
  };
}

/**
 * Slot the availability count refers to.
 *
 * Future days use the point's opening hour. Today uses the next bookable hour;
 * when the point has already closed, the next bookable hour is tomorrow's
 * opening hour, which is what `nextBookableHour` returns.
 */
export function referenceSlotFor(
  point: Pick<BeachPoint, 'openHour' | 'closeHour'>,
  day: DhakaDay,
  now: Date,
): ReferenceSlot {
  if (!day.isToday) {
    const start = dhakaHourToUtc(day.dateKey, point.openHour);
    return { start, label: dhakaHourLabel(start) };
  }

  const hour = nextBookableHour(point.openHour, point.closeHour, now);
  const shifted = toDhaka(now);
  const currentHour = dhakaHour(now) + (shifted.getUTCMinutes() > 0 ? 1 : 0);
  const rollsToTomorrow = hour === point.openHour && currentHour >= point.closeHour;

  const start = dhakaHourToUtc(rollsToTomorrow ? addDays(day.dateKey, 1) : day.dateKey, hour);
  return { start, label: dhakaHourLabel(start) };
}

/** One {@link SlotDto} per bookable hour in [openHour, closeHour). */
export function slotsFor(
  point: Pick<BeachPoint, 'openHour' | 'closeHour'>,
  day: DhakaDay,
): SlotDto[] {
  const slots: SlotDto[] = [];
  for (let hour = point.openHour; hour < point.closeHour; hour += 1) {
    const startsAt = dhakaHourToUtc(day.dateKey, hour);
    slots.push({ startsAt: startsAt.toISOString(), hour, label: dhakaHourLabel(startsAt) });
  }
  return slots;
}

function toSummary(
  point: BeachPoint,
  reference: ReferenceSlot,
  totalBeds: number,
  freeBeds: number,
): BeachPointSummary {
  return {
    id: point.id,
    code: point.code,
    name: point.name,
    description: point.description,
    latitude: point.latitude,
    longitude: point.longitude,
    openHour: point.openHour,
    closeHour: point.closeHour,
    defaultHourlyPriceMinor: point.defaultHourlyPriceMinor,
    currency: point.currency,
    sortOrder: point.sortOrder,
    isActive: point.isActive,
    freeBeds,
    totalBeds,
    referenceSlotLabel: reference.label,
  };
}

/**
 * Builds summaries for the given points in display order.
 *
 * Free beds are the AVAILABLE beds without an active booking slot at the
 * reference instant. Cancelled order items are ignored even if their slot rows
 * were left active, because a cancelled item is never a booking.
 */
export async function buildSummaries(
  prisma: PrismaService,
  points: BeachPoint[],
  day: DhakaDay,
  now: Date = new Date(),
): Promise<BeachPointSummary[]> {
  const ordered = [...points].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.code.localeCompare(right.code),
  );
  if (ordered.length === 0) {
    return [];
  }

  const ids = ordered.map((point) => point.id);
  const references = new Map(ordered.map((point) => [point.id, referenceSlotFor(point, day, now)]));
  const referenceStarts = [
    ...new Set([...references.values()].map((slot) => slot.start.getTime())),
  ].map((time) => new Date(time));

  const [counts, occupied] = await Promise.all([
    prisma.sunbed.groupBy({
      by: ['beachPointId', 'status'],
      where: { beachPointId: { in: ids }, status: { not: 'RETIRED' } },
      _count: { _all: true },
    }),
    prisma.bookingSlot.findMany({
      where: {
        isActive: true,
        slotStart: { in: referenceStarts },
        sunbed: { beachPointId: { in: ids }, status: 'AVAILABLE' },
        orderItem: { status: { not: 'CANCELLED' } },
      },
      select: { sunbedId: true, sunbed: { select: { beachPointId: true } } },
    }),
  ]);

  const totalByPoint = new Map<string, number>();
  const availableByPoint = new Map<string, number>();
  for (const count of counts) {
    totalByPoint.set(
      count.beachPointId,
      (totalByPoint.get(count.beachPointId) ?? 0) + count._count._all,
    );
    if (count.status === 'AVAILABLE') {
      availableByPoint.set(
        count.beachPointId,
        (availableByPoint.get(count.beachPointId) ?? 0) + count._count._all,
      );
    }
  }

  const takenByPoint = new Map<string, Set<string>>();
  for (const slot of occupied) {
    const pointId = slot.sunbed.beachPointId;
    const taken = takenByPoint.get(pointId) ?? new Set<string>();
    taken.add(slot.sunbedId);
    takenByPoint.set(pointId, taken);
  }

  return ordered.map((point) => {
    const reference = references.get(point.id)!;
    const freeBeds = Math.max(
      0,
      (availableByPoint.get(point.id) ?? 0) - (takenByPoint.get(point.id)?.size ?? 0),
    );
    return toSummary(point, reference, totalByPoint.get(point.id) ?? 0, freeBeds);
  });
}
