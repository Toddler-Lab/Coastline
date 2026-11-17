import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  AdminOrderDto,
  AdminOrderListDto,
  AdminOverviewDto,
  BeachPointSummary,
  OrderDto,
  SunbedConflictDetails,
} from '@coastline/api-contracts';
import { MAX_ADVANCE_DAYS, MAX_BEDS_PER_ORDER } from '@coastline/api-contracts';
import { Prisma } from '@coastline/db';
import type { Actor } from '../../common/auth/actor';
import { conflict, forbidden, notFound, unprocessable } from '../../common/errors/api-errors';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  addHours,
  canCancel,
  dhakaDateKey,
  dhakaHour,
  dhakaHourToUtc,
  HOUR_MS,
  isWholeHour,
} from '../../common/time/dhaka';
import { AuditActions } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import { PaymentsService, resolvePaymentMethod } from '../payments/payments.service';
import type { AdminOrderQueryDto } from './dto/admin-order-query.dto';
import type { CancelOrderDto } from './dto/cancel-order.dto';
import type { CheckInDto } from './dto/check-in.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import {
  earliestOrderStart,
  serializeAdminOrder,
  serializeOrder,
  type OrderWithRelations,
} from './orders.serializer';
import { TicketService } from './ticket.service';

const HOURS_TAKEN_MESSAGE = 'Those hours were just booked by another visitor.';

/**
 * 409 details naming every bed that lost one or more requested hours, in the
 * order first seen, with the taken hours per bed (`conflicts`, kept for
 * existing clients).
 */
function takenSlotDetails(
  slots: Array<{ sunbedId: string; slotStart: Date; sunbed: { code: string } }>,
): SunbedConflictDetails {
  const byBed = new Map<string, { code: string; slotStarts: string[] }>();
  for (const slot of slots) {
    const entry = byBed.get(slot.sunbedId) ?? { code: slot.sunbed.code, slotStarts: [] };
    entry.slotStarts.push(slot.slotStart.toISOString());
    byBed.set(slot.sunbedId, entry);
  }
  return {
    sunbedIds: [...byBed.keys()],
    sunbedCodes: [...byBed.values()].map((bed) => bed.code),
    conflicts: [...byBed.values()].map((bed) => ({
      sunbedCode: bed.code,
      slotStarts: bed.slotStarts.sort(),
    })),
  };
}

function generateRef(dateKey: string): string {
  const cleanDate = dateKey.replace(/-/g, '');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `BK-${cleanDate}-${suffix}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ticketService: TicketService,
    private readonly catalogue: CatalogueService,
    private readonly payments: PaymentsService,
  ) {}

  async createOrder(
    actor: Actor,
    dto: CreateOrderDto,
    requestId?: string,
  ): Promise<OrderDto> {
    if (actor.role !== 'TOURIST') {
      throw forbidden('Admins cannot place tourist bookings. Switch to a visitor account to book.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw unprocessable('At least one sunbed must be selected.');
    }
    if (dto.items.length > MAX_BEDS_PER_ORDER) {
      throw unprocessable(`You can book at most ${MAX_BEDS_PER_ORDER} sunbeds per order.`);
    }

    const firstItem = dto.items[0];
    const startDate = new Date(firstItem.startsAt);
    if (Number.isNaN(startDate.getTime()) || !isWholeHour(startDate)) {
      throw unprocessable('Booking start time must be on a whole hour.');
    }

    const now = new Date();
    // Allow small clock drift (up to 2 minutes in the past)
    if (startDate.getTime() < now.getTime() - 2 * 60 * 1000) {
      throw unprocessable('Cannot book a time slot in the past.');
    }

    const todayKey = dhakaDateKey(now);
    const bookingDateKey = dhakaDateKey(startDate);
    const maxFutureDate = new Date(Date.parse(`${todayKey}T00:00:00.000Z`) + (MAX_ADVANCE_DAYS + 1) * 24 * HOUR_MS);
    if (startDate.getTime() >= maxFutureDate.getTime()) {
      throw unprocessable(`Bookings can only be placed up to ${MAX_ADVANCE_DAYS} days in advance.`);
    }

    // All items must have the same start time and hours
    for (const item of dto.items) {
      if (item.startsAt !== firstItem.startsAt || item.hours !== firstItem.hours) {
        throw unprocessable('All beds in a single order must share the same start time and duration.');
      }
    }

    // Verify sunbeds exist and are available
    const bedIds = dto.items.map((i) => i.sunbedId);
    const uniqueIds = new Set(bedIds);
    if (uniqueIds.size !== bedIds.length) {
      throw unprocessable('Duplicate sunbed selection in order.');
    }

    const sunbeds = await this.prisma.sunbed.findMany({
      where: { id: { in: bedIds } },
      include: { beachPoint: true },
    });

    if (sunbeds.length !== bedIds.length) {
      throw unprocessable('One or more selected sunbeds could not be found.');
    }

    const bedMap = new Map(sunbeds.map((b) => [b.id, b]));
    const hours = firstItem.hours;
    const startHourDhaka = dhakaHour(startDate);
    const endHourDhaka = startHourDhaka + hours;

    const outOfService = sunbeds.filter((bed) => bed.status !== 'AVAILABLE');
    for (const bed of sunbeds) {
      if (bed.status !== 'AVAILABLE') {
        const details: SunbedConflictDetails = {
          sunbedIds: outOfService.map((b) => b.id),
          sunbedCodes: outOfService.map((b) => b.code),
        };
        throw conflict(
          outOfService.length === 1
            ? `Sunbed ${bed.code} is currently out of service.`
            : `Sunbeds ${details.sunbedCodes.join(', ')} are currently out of service.`,
          details,
        );
      }
      if (startHourDhaka < bed.beachPoint.openHour || endHourDhaka > bed.beachPoint.closeHour) {
        throw unprocessable(
          `Selected hours (${startHourDhaka}:00–${endHourDhaka}:00) exceed ${bed.beachPoint.name} operating hours (${bed.beachPoint.openHour}:00–${bed.beachPoint.closeHour}:00).`,
        );
      }
    }

    // Generate all requested slot tuples
    const requestedSlots: Array<{ sunbedId: string; slotStart: Date }> = [];
    for (const item of dto.items) {
      for (let h = 0; h < hours; h++) {
        requestedSlots.push({
          sunbedId: item.sunbedId,
          slotStart: addHours(startDate, h),
        });
      }
    }

    // Execute booking in transaction with concurrency lock
    try {
      const createdOrder = await this.prisma.$transaction(async (tx) => {
        // Double-check active slots
        const activeConflicts = await tx.bookingSlot.findMany({
          where: {
            isActive: true,
            OR: requestedSlots.map((s) => ({
              sunbedId: s.sunbedId,
              slotStart: s.slotStart,
            })),
          },
          include: { sunbed: true },
        });

        if (activeConflicts.length > 0) {
          throw conflict(HOURS_TAKEN_MESSAGE, takenSlotDetails(activeConflicts));
        }

        const totalMinor = dto.items.reduce((sum, item) => {
          const bed = bedMap.get(item.sunbedId)!;
          return sum + bed.hourlyPriceMinor * hours;
        }, 0);

        let publicRef = generateRef(bookingDateKey);
        let exists = await tx.order.findUnique({ where: { publicRef } });
        while (exists) {
          publicRef = generateRef(bookingDateKey);
          exists = await tx.order.findUnique({ where: { publicRef } });
        }

        const order = await tx.order.create({
          data: {
            publicRef,
            touristId: actor.id,
            status: 'CONFIRMED',
            subtotalMinor: totalMinor,
            totalMinor,
            currency: 'BDT',
            items: {
              create: dto.items.map((item) => {
                const bed = bedMap.get(item.sunbedId)!;
                const endAt = addHours(startDate, hours);
                const slots = Array.from({ length: hours }, (_, i) => addHours(startDate, i));

                return {
                  sunbedId: bed.id,
                  beachPointCode: bed.beachPoint.code,
                  beachPointName: bed.beachPoint.name,
                  sunbedCode: bed.code,
                  startAt: startDate,
                  endAt,
                  unitPriceMinor: bed.hourlyPriceMinor,
                  totalMinor: bed.hourlyPriceMinor * hours,
                  status: 'RESERVED',
                  slots: {
                    create: slots.map((slotStart) => ({
                      sunbedId: bed.id,
                      slotStart,
                      isActive: true,
                    })),
                  },
                };
              }),
            },
          },
          include: {
            items: true,
            tourist: true,
          },
        });

        // After the slots are inserted, so a lost race never reaches the provider.
        // A declined charge throws PAYMENT_FAILED and rolls all of this back.
        const charge = await this.payments.charge(tx, {
          target: { orderId: order.id },
          amountMinor: totalMinor,
          currency: 'BDT',
          method: resolvePaymentMethod(dto.paymentMethod),
          reference: publicRef,
        });

        await this.audit.record(
          {
            actorUserId: actor.id,
            action: AuditActions.ORDER_PLACED,
            entityType: 'order',
            entityId: order.id,
            details: {
              publicRef: order.publicRef,
              totalMinor: order.totalMinor,
              bedCodes: order.items.map((i) => i.sunbedCode),
              startAt: startDate.toISOString(),
              hours,
            },
            requestId,
          },
          tx,
        );

        return { ...order, payments: [charge] };
      });

      return serializeOrder(createdOrder, this.ticketService);
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Lost the race on the partial unique index: the winner has committed,
        // so its active slots name the beds this request lost.
        const taken = await this.prisma.bookingSlot.findMany({
          where: {
            isActive: true,
            OR: requestedSlots.map((s) => ({ sunbedId: s.sunbedId, slotStart: s.slotStart })),
          },
          include: { sunbed: true },
        });
        const details: SunbedConflictDetails =
          taken.length > 0
            ? takenSlotDetails(taken)
            : {
                // Not attributable to a bed: report every requested bed as lost.
                sunbedIds: sunbeds.map((bed) => bed.id),
                sunbedCodes: sunbeds.map((bed) => bed.code),
              };
        throw conflict(HOURS_TAKEN_MESSAGE, details);
      }
      throw err;
    }
  }

  async getOrder(actor: Actor, publicRef: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { publicRef },
      include: {
        items: true,
        hotelBookings: true,
        payments: true,
        tourist: true,
      },
    });

    if (!order) {
      throw notFound(`Booking ${publicRef} was not found.`);
    }

    if (actor.role !== 'ADMIN' && order.touristId !== actor.id) {
      throw notFound(`Booking ${publicRef} was not found.`);
    }

    return serializeOrder(order, this.ticketService);
  }

  async getTouristOrders(touristId: string): Promise<OrderDto[]> {
    const orders = await this.prisma.order.findMany({
      where: { touristId },
      orderBy: { placedAt: 'desc' },
      include: {
        items: true,
        hotelBookings: true,
        payments: true,
        tourist: true,
      },
    });

    return orders.map((o) => serializeOrder(o, this.ticketService));
  }

  async cancelOrder(
    actor: Actor,
    publicRef: string,
    dto: CancelOrderDto,
    requestId?: string,
  ): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { publicRef },
      include: {
        items: true,
        hotelBookings: true,
        payments: true,
        tourist: true,
      },
    });

    if (!order) {
      throw notFound(`Booking ${publicRef} was not found.`);
    }

    if (actor.role !== 'ADMIN' && order.touristId !== actor.id) {
      throw forbidden('You can only cancel your own bookings.');
    }

    if (order.status !== 'CONFIRMED') {
      throw unprocessable(`Booking ${publicRef} is already ${order.status.toLowerCase()}.`);
    }

    // Sunbed hours and hotel check-in both count towards the cancellation cutoff.
    const earliestStart = earliestOrderStart(order);

    if (actor.role !== 'ADMIN' && !canCancel(earliestStart, order.status)) {
      throw unprocessable('Bookings can only be cancelled up to 60 minutes before the start time.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const cancelReason = dto.reason?.trim() || 'Cancelled by visitor';

      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: 'CANCELLED' },
      });

      await tx.bookingSlot.updateMany({
        where: { orderItem: { orderId: order.id } },
        data: { isActive: false },
      });

      // Release the hotel room nights so the room can be booked again.
      await tx.hotelBooking.updateMany({
        where: { orderId: order.id },
        data: { status: 'CANCELLED' },
      });

      await tx.hotelRoomNight.updateMany({
        where: { hotelBooking: { orderId: order.id } },
        data: { isActive: false },
      });

      await this.payments.refund(tx, {
        target: { orderId: order.id },
        amountMinor: order.totalMinor,
        currency: order.currency.trim(),
        reference: `${order.publicRef}-${Date.now()}`,
      });

      const res = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelReason,
          cancelledById: actor.id,
        },
        include: {
          items: true,
          hotelBookings: true,
          payments: true,
          tourist: true,
        },
      });

      await this.audit.record(
        {
          actorUserId: actor.id,
          action: AuditActions.ORDER_CANCELLED,
          entityType: 'order',
          entityId: order.id,
          details: {
            publicRef: order.publicRef,
            reason: cancelReason,
          },
          requestId,
        },
        tx,
      );

      return res;
    });

    return serializeOrder(updated, this.ticketService);
  }

  /* Admin Operations -------------------------------------------------------- */

  async findAdminOrders(query: AdminOrderQueryDto): Promise<AdminOrderListDto> {
    const where: Prisma.OrderWhereInput = {};

    if (query.ref) {
      where.publicRef = { equals: query.ref.trim(), mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.pointCode) {
      where.items = { some: { beachPointCode: query.pointCode.toUpperCase() } };
    }
    if (query.date) {
      // A day holds the sunbed hours that start on it and the hotel stays that check in on it.
      const dayStart = dhakaHourToUtc(query.date, 0);
      const dayEnd = dhakaHourToUtc(query.date, 24);
      const sunbedsOnDay: Prisma.OrderWhereInput = {
        items: {
          some: {
            ...(query.pointCode ? { beachPointCode: query.pointCode.toUpperCase() } : {}),
            startAt: { gte: dayStart, lt: dayEnd },
          },
        },
      };
      const staysOnDay: Prisma.OrderWhereInput = { hotelBookings: { some: { checkInDate: query.date } } };
      delete where.items;
      where.OR = query.pointCode ? [sunbedsOnDay] : [sunbedsOnDay, staysOnDay];
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
      take: 100,
      include: {
        items: true,
        hotelBookings: true,
        payments: true,
        tourist: true,
      },
    });

    return {
      orders: orders.map((o) => serializeAdminOrder(o, this.ticketService)),
      date: query.date || dhakaDateKey(),
    };
  }

  async adminCheckIn(
    actor: Actor,
    publicRef: string,
    dto: CheckInDto,
    requestId?: string,
  ): Promise<AdminOrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { publicRef },
      include: { items: true, hotelBookings: true, payments: true, tourist: true },
    });

    if (!order) {
      throw notFound(`Booking ${publicRef} not found.`);
    }
    if (order.status !== 'CONFIRMED') {
      throw unprocessable(`Cannot check in a ${order.status.toLowerCase()} booking.`);
    }

    const now = new Date();
    const requestedIds = dto.itemIds && dto.itemIds.length > 0 ? dto.itemIds : null;
    const itemIds =
      requestedIds ?? order.items.filter((i) => i.status === 'RESERVED').map((i) => i.id);
    // Hotel stays are checked in through the same call; ids may name a stay.
    const hotelBookingIds =
      requestedIds ?? order.hotelBookings.filter((s) => s.status === 'RESERVED').map((s) => s.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.updateMany({
        where: { id: { in: itemIds }, orderId: order.id },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: now,
          checkedInById: actor.id,
        },
      });

      await tx.hotelBooking.updateMany({
        where: { id: { in: hotelBookingIds }, orderId: order.id, status: 'RESERVED' },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: now,
          checkedInById: actor.id,
        },
      });

      await this.audit.record(
        {
          actorUserId: actor.id,
          action: AuditActions.ORDER_CHECKED_IN,
          entityType: 'order',
          entityId: order.id,
          details: { publicRef: order.publicRef, itemIds, hotelBookingIds },
          requestId,
        },
        tx,
      );
    });

    const refreshed = await this.prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true, hotelBookings: true, payments: true, tourist: true },
    });

    return serializeAdminOrder(refreshed, this.ticketService);
  }

  async adminValidateTicket(payload: string): Promise<AdminOrderDto> {
    const verified = this.ticketService.verify(payload);
    if (!verified.valid || !verified.publicRef) {
      throw unprocessable('Invalid or unrecognized ticket QR code.');
    }

    const order = await this.prisma.order.findUnique({
      where: { publicRef: verified.publicRef },
      include: { items: true, hotelBookings: true, payments: true, tourist: true },
    });

    if (!order) {
      throw notFound(`Booking ${verified.publicRef} not found.`);
    }

    return serializeAdminOrder(order, this.ticketService);
  }

  async getAdminOverview(dateKey: string = dhakaDateKey()): Promise<AdminOverviewDto> {
    const dayStart = dhakaHourToUtc(dateKey, 0);
    const dayEnd = dhakaHourToUtc(dateKey, 24);

    const [allBeds, points, bookedSlotsCount, paidOrders] = await Promise.all([
      this.prisma.sunbed.findMany({ select: { status: true, beachPoint: { select: { openHour: true, closeHour: true } } } }),
      this.catalogue.list(dateKey),
      this.prisma.bookingSlot.count({
        where: {
          isActive: true,
          slotStart: { gte: dayStart, lt: dayEnd },
        },
      }),
      this.prisma.payment.findMany({
        where: {
          type: 'CHARGE',
          status: 'SUCCEEDED',
          order: {
            items: {
              some: {
                startAt: { gte: dayStart, lt: dayEnd },
              },
            },
          },
        },
        select: { amountMinor: true },
      }),
    ]);

    const totalBeds = allBeds.filter((b) => b.status !== 'RETIRED').length;
    const availableBeds = allBeds.filter((b) => b.status === 'AVAILABLE').length;
    const outOfServiceBeds = allBeds.filter((b) => b.status === 'OUT_OF_SERVICE').length;

    let capacitySlots = 0;
    for (const bed of allBeds) {
      if (bed.status === 'AVAILABLE') {
        capacitySlots += Math.max(0, bed.beachPoint.closeHour - bed.beachPoint.openHour);
      }
    }

    const revenueMinor = paidOrders.reduce((acc, p) => acc + p.amountMinor, 0);

    return {
      date: dateKey,
      totalBeds,
      availableBeds,
      outOfServiceBeds,
      bedsOnLoan: 0,
      bookedSlots: bookedSlotsCount,
      capacitySlots,
      revenueMinor,
      currency: 'BDT',
      points: points.data,
    };
  }
}

