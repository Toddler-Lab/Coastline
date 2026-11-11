import { Injectable } from '@nestjs/common';
import {
  DINING_ADMIN_LIMITS,
  type AdminMenuItemDto,
  type DiningAdminOverviewDto,
  type DiningAdminVenueDto,
} from '@coastline/api-contracts';
import type { Prisma } from '@coastline/db';
import type { Actor } from '../../../common/auth/actor';
import { notFound, unprocessable } from '../../../common/errors/api-errors';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { dhakaDateKey, dhakaHourToUtc, isDateKey } from '../../../common/time/dhaka';
import { AuditActions } from '../../audit/audit.actions';
import { AuditService } from '../../audit/audit.service';
import {
  ADMIN_VENUE_INCLUDE,
  serializeAdminMenuItem,
  serializeAdminVenue,
} from './dining-admin.serializer';
import type { UpdateDiningVenueDto, UpdateMenuItemDto } from './dto/dining-admin.dto';

const OPEN_FOOD_ORDER_STATUSES = ['PLACED', 'PREPARING', 'READY'] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Issue = { field: string; message: string };
type FieldValue = string | number | boolean | null;
type Changes = { before: Record<string, FieldValue>; after: Record<string, FieldValue> };

/** Trim, and treat an empty string as "clear" for nullable text fields. */
function normalizeNullableText(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function isIntInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function reject(issues: Issue[]): void {
  if (issues.length > 0) {
    throw unprocessable(issues.map((issue) => issue.message).join(' '), { issues });
  }
}

/** Fields whose requested value differs from the stored one. */
function diff<T extends Record<string, FieldValue>>(current: T, next: Partial<T>): Changes {
  const before: Record<string, FieldValue> = {};
  const after: Record<string, FieldValue> = {};
  for (const key of Object.keys(next) as Array<keyof T & string>) {
    const value = next[key];
    if (value !== undefined && value !== current[key]) {
      before[key] = current[key];
      after[key] = value as FieldValue;
    }
  }
  return { before, after };
}

@Injectable()
export class DiningAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOverview(dateKey: string = dhakaDateKey()): Promise<DiningAdminOverviewDto> {
    if (!isDateKey(dateKey)) {
      throw unprocessable('date is not a real calendar date.', {
        issues: [{ field: 'date', message: 'date is not a real calendar date.' }],
      });
    }
    const dayStart = dhakaHourToUtc(dateKey, 0);
    const dayEnd = dhakaHourToUtc(dateKey, 24);

    const [venueCount, reservationsToday, openFoodOrders, revenue] = await Promise.all([
      this.prisma.diningVenue.count({ where: { isActive: true } }),
      this.prisma.tableReservation.count({
        where: { status: { not: 'CANCELLED' }, startAt: { gte: dayStart, lt: dayEnd } },
      }),
      // Live kitchen queue, independent of the selected date.
      this.prisma.foodOrder.count({ where: { status: { in: [...OPEN_FOOD_ORDER_STATUSES] } } }),
      this.prisma.foodOrder.aggregate({
        _sum: { totalMinor: true },
        where: { status: { not: 'CANCELLED' }, placedAt: { gte: dayStart, lt: dayEnd } },
      }),
    ]);

    return {
      date: dateKey,
      venueCount,
      reservationsToday,
      openFoodOrders,
      foodRevenueMinor: revenue._sum.totalMinor ?? 0,
      currency: 'BDT',
    };
  }

  async listVenues(): Promise<DiningAdminVenueDto[]> {
    const venues = await this.prisma.diningVenue.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: ADMIN_VENUE_INCLUDE,
    });
    return venues.map(serializeAdminVenue);
  }

  async updateVenue(
    actor: Actor,
    code: string,
    dto: UpdateDiningVenueDto,
    requestId?: string,
  ): Promise<DiningAdminVenueDto> {
    const venueId = await this.prisma.$transaction(async (tx) => {
      // Row lock: concurrent hour edits must validate against the committed row.
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM dining_venues WHERE code = ${code} FOR UPDATE`;
      if (locked.length === 0) {
        throw notFound('Dining venue not found.');
      }
      const venue = await tx.diningVenue.findUniqueOrThrow({ where: { id: locked[0].id } });

      const next = {
        description:
          dto.description === undefined ? undefined : normalizeNullableText(dto.description),
        openHour: dto.openHour,
        closeHour: dto.closeHour,
        reservationsEnabled: dto.reservationsEnabled,
        deliveryEnabled: dto.deliveryEnabled,
        reservationDepositMinor: dto.reservationDepositMinor,
        isActive: dto.isActive,
      };

      const issues: Issue[] = [];
      if (next.openHour !== undefined && !isIntInRange(next.openHour, 0, 23)) {
        issues.push({ field: 'openHour', message: 'openHour must be a whole hour from 0 to 23.' });
      }
      if (next.closeHour !== undefined && !isIntInRange(next.closeHour, 1, 24)) {
        issues.push({ field: 'closeHour', message: 'closeHour must be a whole hour from 1 to 24.' });
      }
      const openHour = next.openHour ?? venue.openHour;
      const closeHour = next.closeHour ?? venue.closeHour;
      if (issues.length === 0 && closeHour <= openHour) {
        issues.push({ field: 'closeHour', message: 'closeHour must be later than openHour.' });
      }
      if (
        next.reservationDepositMinor !== undefined &&
        !isIntInRange(next.reservationDepositMinor, 0, DINING_ADMIN_LIMITS.maxDepositMinor)
      ) {
        issues.push({
          field: 'reservationDepositMinor',
          message: `reservationDepositMinor must be a whole number of minor units from 0 to ${DINING_ADMIN_LIMITS.maxDepositMinor}.`,
        });
      }
      if (
        typeof next.description === 'string' &&
        next.description.length > DINING_ADMIN_LIMITS.descriptionMaxLength
      ) {
        issues.push({
          field: 'description',
          message: `description must be ${DINING_ADMIN_LIMITS.descriptionMaxLength} characters or fewer.`,
        });
      }
      reject(issues);

      const changes = diff(
        {
          description: venue.description,
          openHour: venue.openHour,
          closeHour: venue.closeHour,
          reservationsEnabled: venue.reservationsEnabled,
          deliveryEnabled: venue.deliveryEnabled,
          reservationDepositMinor: venue.reservationDepositMinor,
          isActive: venue.isActive,
        },
        next,
      );

      if (Object.keys(changes.after).length > 0) {
        await tx.diningVenue.update({
          where: { id: venue.id },
          data: changes.after as Prisma.DiningVenueUpdateInput,
        });
        await this.audit.record(
          {
            actorUserId: actor.id,
            action: AuditActions.DINING_VENUE_UPDATED,
            entityType: 'dining_venue',
            entityId: venue.id,
            details: { code: venue.code, ...changes },
            requestId,
          },
          tx,
        );
      }
      return venue.id;
    });

    const updated = await this.prisma.diningVenue.findUniqueOrThrow({
      where: { id: venueId },
      include: ADMIN_VENUE_INCLUDE,
    });
    return serializeAdminVenue(updated);
  }

  async updateMenuItem(
    actor: Actor,
    id: string,
    dto: UpdateMenuItemDto,
    requestId?: string,
  ): Promise<AdminMenuItemDto> {
    if (!UUID_PATTERN.test(id)) {
      throw notFound('Menu item not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM menu_items WHERE id = ${id}::uuid FOR UPDATE`;
      if (locked.length === 0) {
        throw notFound('Menu item not found.');
      }
      const item = await tx.menuItem.findUniqueOrThrow({
        where: { id },
        include: { venue: { select: { code: true } } },
      });

      const next = {
        name: dto.name === undefined ? undefined : dto.name.trim(),
        nameBn: dto.nameBn === undefined ? undefined : normalizeNullableText(dto.nameBn),
        description:
          dto.description === undefined ? undefined : normalizeNullableText(dto.description),
        priceMinor: dto.priceMinor,
        isAvailable: dto.isAvailable,
        sortOrder: dto.sortOrder,
      };

      const issues: Issue[] = [];
      const nameMax = DINING_ADMIN_LIMITS.menuItemNameMaxLength;
      if (next.name !== undefined && (next.name.length === 0 || next.name.length > nameMax)) {
        issues.push({ field: 'name', message: `name must be 1 to ${nameMax} characters.` });
      }
      if (typeof next.nameBn === 'string' && next.nameBn.length > nameMax) {
        issues.push({ field: 'nameBn', message: `nameBn must be ${nameMax} characters or fewer.` });
      }
      const descriptionMax = DINING_ADMIN_LIMITS.menuItemDescriptionMaxLength;
      if (typeof next.description === 'string' && next.description.length > descriptionMax) {
        issues.push({
          field: 'description',
          message: `description must be ${descriptionMax} characters or fewer.`,
        });
      }
      if (
        next.priceMinor !== undefined &&
        !isIntInRange(next.priceMinor, 1, DINING_ADMIN_LIMITS.maxMenuPriceMinor)
      ) {
        issues.push({
          field: 'priceMinor',
          message: `priceMinor must be a positive whole number of minor units up to ${DINING_ADMIN_LIMITS.maxMenuPriceMinor}.`,
        });
      }
      if (
        next.sortOrder !== undefined &&
        !isIntInRange(next.sortOrder, 0, DINING_ADMIN_LIMITS.maxSortOrder)
      ) {
        issues.push({
          field: 'sortOrder',
          message: `sortOrder must be a whole number from 0 to ${DINING_ADMIN_LIMITS.maxSortOrder}.`,
        });
      }
      reject(issues);

      const changes = diff(
        {
          name: item.name,
          nameBn: item.nameBn,
          description: item.description,
          priceMinor: item.priceMinor,
          isAvailable: item.isAvailable,
          sortOrder: item.sortOrder,
        },
        next,
      );

      if (Object.keys(changes.after).length === 0) {
        return serializeAdminMenuItem(item);
      }

      // Existing food orders keep their snapshotted names and unit prices.
      const updated = await tx.menuItem.update({
        where: { id: item.id },
        data: changes.after as Prisma.MenuItemUpdateInput,
      });
      await this.audit.record(
        {
          actorUserId: actor.id,
          action: AuditActions.MENU_ITEM_UPDATED,
          entityType: 'menu_item',
          entityId: item.id,
          details: { venueCode: item.venue.code, ...changes },
          requestId,
        },
        tx,
      );
      return serializeAdminMenuItem(updated);
    });
  }
}
