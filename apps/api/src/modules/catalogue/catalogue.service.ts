import { Injectable } from '@nestjs/common';
import type {
  BeachPointDetail,
  BeachPointSummary,
  SlotDto,
  SunbedAvailability,
} from '@coastline/api-contracts';
import { PrismaService } from '../../common/prisma/prisma.service';
import { notFound } from '../../common/errors/api-errors';
import { buildSummaries, resolveDhakaDay, slotsFor } from './catalogue.summary';

@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active beach points with reference-slot free-bed counts. */
  async list(
    date: string | undefined,
    now: Date = new Date(),
  ): Promise<{ data: BeachPointSummary[] }> {
    const day = resolveDhakaDay(date, now);
    const points = await this.prisma.beachPoint.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });

    return { data: await buildSummaries(this.prisma, points, day, now) };
  }

  /** One active point with its hourly grid and per-bed occupancy. */
  async detail(
    code: string,
    date: string | undefined,
    actorId: string | undefined,
    now: Date = new Date(),
  ): Promise<{ data: BeachPointDetail }> {
    const day = resolveDhakaDay(date, now);
    const point = await this.prisma.beachPoint.findUnique({ where: { code } });

    if (!point || !point.isActive) {
      throw notFound('Beach point not found.');
    }

    const [summary] = await buildSummaries(this.prisma, [point], day, now);
    const slots: SlotDto[] = slotsFor(point, day);

    // One query: beds, their active slots in the requested day and each slot's tourist.
    const beds = await this.prisma.sunbed.findMany({
      where: { beachPointId: point.id, status: { not: 'RETIRED' } },
      orderBy: { seq: 'asc' },
      select: {
        id: true,
        code: true,
        seq: true,
        hourlyPriceMinor: true,
        currency: true,
        status: true,
        slots: {
          where: {
            isActive: true,
            slotStart: { gte: day.start, lt: day.end },
            orderItem: { status: { not: 'CANCELLED' } },
          },
          orderBy: { slotStart: 'asc' },
          select: {
            slotStart: true,
            orderItem: { select: { order: { select: { touristId: true } } } },
          },
        },
      },
    });

    const sunbeds: SunbedAvailability[] = beds.map((bed) => {
      const bookedSlots = bed.slots.map((slot) => slot.slotStart.toISOString());
      const mineSlots = actorId
        ? bed.slots
            .filter((slot) => slot.orderItem.order.touristId === actorId)
            .map((slot) => slot.slotStart.toISOString())
        : [];

      return {
        id: bed.id,
        code: bed.code,
        seq: bed.seq,
        hourlyPriceMinor: bed.hourlyPriceMinor,
        currency: bed.currency,
        status: bed.status,
        bookedSlots,
        mineSlots,
        freeSlots: bed.status === 'AVAILABLE' ? Math.max(0, slots.length - bookedSlots.length) : 0,
      };
    });

    return { data: { ...summary, date: day.dateKey, slots, sunbeds } };
  }
}
