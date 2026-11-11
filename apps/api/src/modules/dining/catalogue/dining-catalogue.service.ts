import { Injectable } from '@nestjs/common';
import type {
  DiningVenueDetail,
  DiningVenueQuery,
  DiningVenueSummary,
} from '@coastline/api-contracts';
import type { Prisma } from '@coastline/db';
import { notFound } from '../../../common/errors/api-errors';
import { PrismaService } from '../../../common/prisma/prisma.service';
import {
  DINING_VENUE_DETAIL_INCLUDE,
  DINING_VENUE_SUMMARY_INCLUDE,
  serializeVenueDetail,
  serializeVenueSummary,
} from './dining-catalogue.serializer';

const VENUE_CODE = /^[A-Za-z0-9-]{1,64}$/;

/**
 * Public, read-only dining catalogue. Only active venues are visible. Other
 * dining streams reuse this service and the serializers it is built on.
 */
@Injectable()
export class DiningCatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active venues matching the filter, ordered by sort order then name. */
  async listVenues(query: DiningVenueQuery = {}): Promise<DiningVenueSummary[]> {
    const where: Prisma.DiningVenueWhereInput = { isActive: true };
    if (query.kind !== undefined) {
      where.kind = query.kind;
    }
    if (query.beachPointCode !== undefined) {
      where.beachPoint = { is: { code: query.beachPointCode } };
    }
    if (query.reservable !== undefined) {
      where.reservationsEnabled = query.reservable;
    }
    if (query.delivers !== undefined) {
      where.deliveryEnabled = query.delivers;
    }

    const venues = await this.prisma.diningVenue.findMany({
      where,
      include: DINING_VENUE_SUMMARY_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    if (venues.length === 0) {
      return [];
    }

    const minima = await this.prisma.menuItem.groupBy({
      by: ['venueId'],
      where: { venueId: { in: venues.map((venue) => venue.id) }, isAvailable: true },
      _min: { priceMinor: true },
    });
    const priceFrom = new Map(minima.map((row) => [row.venueId, row._min.priceMinor ?? null]));

    return venues.map((venue) => serializeVenueSummary(venue, priceFrom.get(venue.id) ?? null));
  }

  /** One active venue with its full menu (unavailable items included and flagged). */
  async getVenue(code: string): Promise<DiningVenueDetail> {
    const venue = await this.findActiveVenue(code);
    if (!venue) {
      throw notFound('Dining venue not found.');
    }
    return serializeVenueDetail(venue);
  }

  /** Active venue row with its menu, or null when unknown or inactive. */
  async findActiveVenue(code: string) {
    if (!VENUE_CODE.test(code)) {
      return null;
    }
    return this.prisma.diningVenue.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
      include: DINING_VENUE_DETAIL_INCLUDE,
    });
  }
}
