import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  AdminReservationDto,
  ReservationDto,
  ReservationListDto,
  TableAvailabilityDto,
} from '@coastline/api-contracts';
import {
  MAX_RESERVATION_ADVANCE_DAYS,
  MAX_RESERVATION_HOURS,
  RESERVATION_CHECK_IN_EARLY_MINUTES,
} from '@coastline/api-contracts';
import { Prisma } from '@coastline/db';
import type { Actor } from '../../../common/auth/actor';
import { conflict, forbidden, notFound, unprocessable } from '../../../common/errors/api-errors';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  addHours,
  canCancel,
  dhakaDateKey,
  dhakaHour,
  dhakaHourLabel,
  dhakaHourToUtc,
  HOUR_MS,
  isDateKey,
  isWholeHour,
} from '../../../common/time/dhaka';
import { AuditActions } from '../../audit/audit.actions';
import { AuditService } from '../../audit/audit.service';
import { TicketService } from '../../bookings/ticket.service';
import type { AdminReservationQueryDto } from './dto/admin-reservation-query.dto';
import type { CancelReservationDto } from './dto/cancel-reservation.dto';
import type { CreateReservationDto } from './dto/create-reservation.dto';
import {
  RESERVATION_INCLUDE,
  serializeAdminReservation,
  serializeReservation,
} from './reservations.serializer';

const DAY_MS = 24 * HOUR_MS;
const MAX_PARTY_SIZE = 50;
const ENTITY_TYPE = 'table_reservation';
const SLOT_TAKEN = 'SLOT_TAKEN';

/** Same shape as sunbed refs (`BK-YYYYMMDD-XXXX`), keyed on the Dhaka start date. */
function generateRef(dateKey: string): string {
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `RS-${dateKey.replace(/-/g, '')}-${suffix}`;
}

function addDaysToKey(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00.000Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/**
 * P2002: the partial unique index on active table-hours rejected the insert.
 * P2034: Postgres aborted the transaction on a write conflict or deadlock
 * between overlapping windows. Both mean another visitor won the race.
 */
function lostSlotRace(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2002' || error.code === 'P2034')
  );
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tickets: TicketService,
  ) {}

  /* Availability ------------------------------------------------------------ */

  async availability(
    venueCode: string,
    date: string | undefined,
    now: Date = new Date(),
  ): Promise<TableAvailabilityDto> {
    const todayKey = dhakaDateKey(now);
    const dateKey = date?.trim() || todayKey;
    if (!isDateKey(dateKey)) {
      throw unprocessable('date must be a real calendar date in YYYY-MM-DD form.');
    }
    const lastKey = addDaysToKey(todayKey, MAX_RESERVATION_ADVANCE_DAYS);
    if (dateKey < todayKey || dateKey > lastKey) {
      throw unprocessable(
        `Tables can be reserved from today up to ${MAX_RESERVATION_ADVANCE_DAYS} days ahead (${todayKey} to ${lastKey}).`,
      );
    }

    const venue = await this.prisma.diningVenue.findUnique({
      where: { code: venueCode.toUpperCase() },
      include: { tables: { where: { isActive: true }, orderBy: { code: 'asc' } } },
    });
    if (!venue || !venue.isActive) {
      throw notFound(`Dining venue ${venueCode} was not found.`);
    }
    if (!venue.reservationsEnabled) {
      throw unprocessable(`${venue.name} does not take table reservations.`);
    }

    const dayOpen = dhakaHourToUtc(dateKey, venue.openHour);
    const dayClose = dhakaHourToUtc(dateKey, venue.closeHour);
    const taken = await this.prisma.tableSlot.findMany({
      where: {
        isActive: true,
        tableId: { in: venue.tables.map((t) => t.id) },
        slotStart: { gte: dayOpen, lt: dayClose },
      },
      select: { tableId: true, slotStart: true },
    });
    const takenKeys = new Set(taken.map((s) => `${s.tableId}|${s.slotStart.getTime()}`));

    const hours: number[] = [];
    for (let h = venue.openHour; h < venue.closeHour; h += 1) {
      hours.push(h);
    }

    return {
      venueCode: venue.code,
      date: dateKey,
      openHour: venue.openHour,
      closeHour: venue.closeHour,
      depositMinor: venue.reservationDepositMinor,
      currency: venue.currency.trim(),
      tables: venue.tables.map((table) => ({
        id: table.id,
        code: table.code,
        seats: table.seats,
        slots: hours.map((hour) => {
          const startsAt = dhakaHourToUtc(dateKey, hour);
          return {
            startsAt: startsAt.toISOString(),
            hour,
            label: dhakaHourLabel(startsAt),
            available:
              startsAt.getTime() > now.getTime() &&
              !takenKeys.has(`${table.id}|${startsAt.getTime()}`),
          };
        }),
      })),
    };
  }

  /* Tourist ----------------------------------------------------------------- */

  async create(
    actor: Actor,
    dto: CreateReservationDto,
    requestId?: string,
  ): Promise<ReservationDto> {
    if (actor.role !== 'TOURIST') {
      throw forbidden(
        'Admins cannot reserve tables for themselves. Switch persona to a tourist in the header.',
      );
    }

    const now = new Date();
    const startAt = new Date(dto.startsAt);
    if (Number.isNaN(startAt.getTime()) || !isWholeHour(startAt)) {
      throw unprocessable('Reservation start time must be on a whole hour.');
    }
    if (startAt.getTime() <= now.getTime()) {
      throw unprocessable('Reservation start time must be in the future.');
    }
    if (!Number.isInteger(dto.hours) || dto.hours < 1 || dto.hours > MAX_RESERVATION_HOURS) {
      throw unprocessable(`A reservation lasts 1 to ${MAX_RESERVATION_HOURS} whole hours.`);
    }
    if (!Number.isInteger(dto.partySize) || dto.partySize < 1 || dto.partySize > MAX_PARTY_SIZE) {
      throw unprocessable(`Party size must be between 1 and ${MAX_PARTY_SIZE}.`);
    }

    const todayKey = dhakaDateKey(now);
    const startKey = dhakaDateKey(startAt);
    if (startKey > addDaysToKey(todayKey, MAX_RESERVATION_ADVANCE_DAYS)) {
      throw unprocessable(
        `Tables can be reserved up to ${MAX_RESERVATION_ADVANCE_DAYS} days in advance.`,
      );
    }

    const table = await this.prisma.diningTable.findUnique({
      where: { id: dto.tableId },
      include: { venue: true },
    });
    if (!table || !table.venue.isActive) {
      throw notFound('That table was not found.');
    }
    const venue = table.venue;
    if (!venue.reservationsEnabled) {
      throw unprocessable(`${venue.name} does not take table reservations.`);
    }
    if (!table.isActive) {
      throw unprocessable(`Table ${table.code} is not available for reservations.`);
    }
    if (dto.partySize > table.seats) {
      throw unprocessable(`Table ${table.code} seats at most ${table.seats}.`);
    }

    const startHour = dhakaHour(startAt);
    const endHour = startHour + dto.hours;
    if (startHour < venue.openHour || endHour > venue.closeHour) {
      throw unprocessable(
        `${venue.name} takes reservations between ${String(venue.openHour).padStart(2, '0')}:00 and ${String(venue.closeHour).padStart(2, '0')}:00.`,
      );
    }

    const endAt = addHours(startAt, dto.hours);
    const slotStarts = Array.from({ length: dto.hours }, (_, i) => addHours(startAt, i));
    const depositMinor = venue.reservationDepositMinor;
    const currency = venue.currency.trim();
    const note = dto.note?.trim() || null;
    const slotTaken = () =>
      conflict('That table was just reserved for one of those hours. Pick another slot.', {
        reason: SLOT_TAKEN,
        tableCode: table.code,
        slotStarts: slotStarts.map((s) => s.toISOString()),
      });

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        // Friendly pre-check; the partial unique index is the real guard.
        const clash = await tx.tableSlot.count({
          where: { tableId: table.id, isActive: true, slotStart: { in: slotStarts } },
        });
        if (clash > 0) {
          throw slotTaken();
        }

        let publicRef = generateRef(startKey);
        while (await tx.tableReservation.findUnique({ where: { publicRef } })) {
          publicRef = generateRef(startKey);
        }

        const reservation = await tx.tableReservation.create({
          data: {
            publicRef,
            touristId: actor.id,
            venueId: venue.id,
            tableId: table.id,
            venueCode: venue.code,
            venueName: venue.name,
            tableCode: table.code,
            partySize: dto.partySize,
            startAt,
            endAt,
            status: 'CONFIRMED',
            depositMinor,
            currency,
            note,
            slots: {
              create: slotStarts.map((slotStart) => ({ tableId: table.id, slotStart })),
            },
            ...(depositMinor > 0
              ? {
                  payments: {
                    create: {
                      type: 'CHARGE',
                      provider: 'MOCK',
                      status: 'SUCCEEDED',
                      amountMinor: depositMinor,
                      currency,
                      externalRef: `MOCK-${publicRef}`,
                    },
                  },
                }
              : {}),
          },
          include: RESERVATION_INCLUDE,
        });

        await this.audit.record(
          {
            actorUserId: actor.id,
            action: AuditActions.RESERVATION_PLACED,
            entityType: ENTITY_TYPE,
            entityId: reservation.id,
            details: {
              publicRef,
              venueCode: venue.code,
              tableCode: table.code,
              startAt: startAt.toISOString(),
              hours: dto.hours,
              partySize: dto.partySize,
              depositMinor,
            },
            requestId,
          },
          tx,
        );

        return reservation;
      });

      return serializeReservation(created, this.tickets);
    } catch (error) {
      if (lostSlotRace(error)) {
        throw slotTaken();
      }
      throw error;
    }
  }

  async listMine(actor: Actor): Promise<ReservationListDto> {
    const rows = await this.prisma.tableReservation.findMany({
      where: { touristId: actor.id },
      orderBy: { startAt: 'desc' },
      take: 100,
      include: RESERVATION_INCLUDE,
    });
    const now = new Date();
    return { reservations: rows.map((r) => serializeReservation(r, this.tickets, now)) };
  }

  async get(actor: Actor, publicRef: string): Promise<ReservationDto> {
    const reservation = await this.findByRef(publicRef);
    if (actor.role !== 'ADMIN' && reservation.touristId !== actor.id) {
      throw notFound(`Reservation ${publicRef} was not found.`);
    }
    return serializeReservation(reservation, this.tickets);
  }

  async cancelAsTourist(
    actor: Actor,
    publicRef: string,
    dto: CancelReservationDto,
    requestId?: string,
  ): Promise<ReservationDto> {
    const reservation = await this.findByRef(publicRef);
    if (reservation.touristId !== actor.id) {
      throw forbidden('You can only cancel your own reservations.');
    }
    this.assertConfirmed(reservation.status, publicRef);
    if (!canCancel(reservation.startAt, reservation.status)) {
      throw unprocessable(
        'Reservations can only be cancelled up to 60 minutes before the start time.',
      );
    }
    const updated = await this.cancel(
      actor,
      reservation.id,
      dto.reason?.trim() || 'Cancelled by visitor',
      requestId,
    );
    return serializeReservation(updated, this.tickets);
  }

  /* Admin ------------------------------------------------------------------- */

  async adminList(query: AdminReservationQueryDto): Promise<AdminReservationDto[]> {
    const where: Prisma.TableReservationWhereInput = {};
    if (query.date) {
      if (!isDateKey(query.date)) {
        throw unprocessable('date must be a real calendar date in YYYY-MM-DD form.');
      }
      where.startAt = { gte: dhakaHourToUtc(query.date, 0), lt: dhakaHourToUtc(query.date, 24) };
    }
    if (query.venueCode) {
      where.venueCode = query.venueCode.trim().toUpperCase();
    }
    if (query.status) {
      where.status = query.status;
    }

    const rows = await this.prisma.tableReservation.findMany({
      where,
      orderBy: [{ startAt: 'asc' }, { tableCode: 'asc' }],
      take: 200,
      include: RESERVATION_INCLUDE,
    });
    const now = new Date();
    return rows.map((r) => serializeAdminReservation(r, this.tickets, now));
  }

  async adminCancel(
    actor: Actor,
    publicRef: string,
    dto: CancelReservationDto,
    requestId?: string,
  ): Promise<AdminReservationDto> {
    const reservation = await this.findByRef(publicRef);
    this.assertConfirmed(reservation.status, publicRef);
    const updated = await this.cancel(
      actor,
      reservation.id,
      dto.reason?.trim() || 'Cancelled by the venue desk',
      requestId,
    );
    return serializeAdminReservation(updated, this.tickets);
  }

  async adminCheckIn(
    actor: Actor,
    publicRef: string,
    requestId?: string,
  ): Promise<AdminReservationDto> {
    const reservation = await this.findByRef(publicRef);
    this.assertConfirmed(reservation.status, publicRef);

    const now = new Date();
    const opensAt = new Date(
      reservation.startAt.getTime() - RESERVATION_CHECK_IN_EARLY_MINUTES * 60_000,
    );
    if (now < opensAt || now >= reservation.endAt) {
      throw unprocessable(
        `Check-in is open from ${RESERVATION_CHECK_IN_EARLY_MINUTES} minutes before the reservation until it ends.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.tableReservation.updateMany({
        where: { id: reservation.id, status: 'CONFIRMED' },
        data: { status: 'CHECKED_IN', checkedInAt: now, checkedInById: actor.id },
      });
      if (count !== 1) {
        throw conflict(`Reservation ${publicRef} changed while checking in. Reload and retry.`);
      }
      await this.audit.record(
        {
          actorUserId: actor.id,
          action: AuditActions.RESERVATION_CHECKED_IN,
          entityType: ENTITY_TYPE,
          entityId: reservation.id,
          details: { publicRef, tableCode: reservation.tableCode },
          requestId,
        },
        tx,
      );
      return tx.tableReservation.findUniqueOrThrow({
        where: { id: reservation.id },
        include: RESERVATION_INCLUDE,
      });
    });

    return serializeAdminReservation(updated, this.tickets);
  }

  /* Internals --------------------------------------------------------------- */

  private async findByRef(publicRef: string) {
    const reservation = await this.prisma.tableReservation.findUnique({
      where: { publicRef },
      include: RESERVATION_INCLUDE,
    });
    if (!reservation) {
      throw notFound(`Reservation ${publicRef} was not found.`);
    }
    return reservation;
  }

  private assertConfirmed(status: string, publicRef: string): void {
    if (status !== 'CONFIRMED') {
      throw conflict(
        `Reservation ${publicRef} is already ${status.toLowerCase().replace('_', ' ')}.`,
      );
    }
  }

  /**
   * Cancels, releases the table-hours and refunds the net mock deposit by
   * reversal, all in one transaction. The status guard makes a concurrent
   * second cancel or check-in lose with 409 instead of double-refunding.
   */
  private async cancel(actor: Actor, reservationId: string, reason: string, requestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const { count } = await tx.tableReservation.updateMany({
        where: { id: reservationId, status: 'CONFIRMED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelReason: reason,
          cancelledById: actor.id,
        },
      });
      if (count !== 1) {
        throw conflict('This reservation changed while cancelling. Reload and retry.');
      }

      await tx.tableSlot.updateMany({
        where: { reservationId, isActive: true },
        data: { isActive: false },
      });

      const reservation = await tx.tableReservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: { payments: true },
      });
      const netPaid = reservation.payments.reduce(
        (sum, p) => sum + (p.type === 'CHARGE' ? p.amountMinor : -p.amountMinor),
        0,
      );
      if (netPaid > 0) {
        await tx.payment.create({
          data: {
            reservationId,
            type: 'REFUND',
            provider: 'MOCK',
            status: 'SUCCEEDED',
            amountMinor: netPaid,
            currency: reservation.currency.trim(),
            externalRef: `MOCK-REFUND-${reservation.publicRef}`,
          },
        });
      }

      await this.audit.record(
        {
          actorUserId: actor.id,
          action: AuditActions.RESERVATION_CANCELLED,
          entityType: ENTITY_TYPE,
          entityId: reservationId,
          details: {
            publicRef: reservation.publicRef,
            reason,
            byRole: actor.role,
            refundMinor: Math.max(0, netPaid),
          },
          requestId,
        },
        tx,
      );

      return tx.tableReservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: RESERVATION_INCLUDE,
      });
    });
  }
}
