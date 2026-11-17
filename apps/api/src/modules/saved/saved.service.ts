import { Injectable } from '@nestjs/common';
import type { SavedItemDto, SavedItemType } from '@coastline/api-contracts';
import { notFound } from '../../common/errors/api-errors';
import { PrismaService } from '../../common/prisma/prisma.service';

interface Resolved {
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
}

/**
 * Saved items (WP-25). A save points at something visible right now; items
 * that were later hidden drop out of the list instead of showing stale data.
 */
@Injectable()
export class SavedService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<SavedItemDto[]> {
    const rows = await this.prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const resolved = await this.resolveMany(
      rows.map((row) => ({ type: row.itemType, key: row.itemKey })),
    );
    return rows.flatMap((row) => {
      const found = resolved.get(`${row.itemType}:${row.itemKey}`);
      return found
        ? [{ type: row.itemType, key: row.itemKey, savedAt: row.createdAt.toISOString(), ...found }]
        : [];
    });
  }

  async save(userId: string, type: SavedItemType, key: string): Promise<SavedItemDto> {
    const resolved = (await this.resolveMany([{ type, key }])).get(`${type}:${key}`);
    if (!resolved) {
      throw notFound('That place or listing was not found.');
    }
    const row = await this.prisma.savedItem.upsert({
      where: { userId_itemType_itemKey: { userId, itemType: type, itemKey: key } },
      update: {},
      create: { userId, itemType: type, itemKey: key },
    });
    return { type, key, savedAt: row.createdAt.toISOString(), ...resolved };
  }

  /** Idempotent: removing something not saved is not an error. */
  async remove(userId: string, type: SavedItemType, key: string): Promise<void> {
    await this.prisma.savedItem.deleteMany({ where: { userId, itemType: type, itemKey: key } });
  }

  private async resolveMany(
    items: Array<{ type: SavedItemType; key: string }>,
  ): Promise<Map<string, Resolved>> {
    const keys = (type: SavedItemType) =>
      items.filter((item) => item.type === type).map((item) => item.key);
    const spotKeys = keys('SPOT')
      .map((key) => key.split('/'))
      .filter((parts): parts is [string, string] => parts.length === 2);

    const [hotels, venues, spots] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { slug: { in: keys('HOTEL') }, isActive: true, destination: { isActive: true } },
        select: {
          slug: true,
          name: true,
          area: true,
          featuredImage: true,
          destination: { select: { name: true } },
        },
      }),
      this.prisma.diningVenue.findMany({
        where: { code: { in: keys('VENUE') }, isActive: true, destination: { isActive: true } },
        select: { code: true, name: true, imageUrl: true, destination: { select: { name: true } } },
      }),
      spotKeys.length === 0
        ? Promise.resolve([])
        : this.prisma.spot.findMany({
            where: {
              isActive: true,
              destination: { isActive: true },
              OR: spotKeys.map(([destination, slug]) => ({
                slug,
                destination: { slug: destination },
              })),
            },
            select: { slug: true, name: true, destination: { select: { slug: true, name: true } } },
          }),
    ]);

    const result = new Map<string, Resolved>();
    for (const hotel of hotels) {
      result.set(`HOTEL:${hotel.slug}`, {
        title: hotel.name,
        subtitle: [hotel.area, hotel.destination.name].filter(Boolean).join(', '),
        imageUrl: hotel.featuredImage,
        href: `/l/hotel-${hotel.slug}`,
      });
    }
    for (const venue of venues) {
      result.set(`VENUE:${venue.code}`, {
        title: venue.name,
        subtitle: venue.destination.name,
        imageUrl: venue.imageUrl,
        href: `/l/dining-${venue.code.toLowerCase()}`,
      });
    }
    for (const spot of spots) {
      result.set(`SPOT:${spot.destination.slug}/${spot.slug}`, {
        title: spot.name,
        subtitle: spot.destination.name,
        imageUrl: null,
        href: `/d/${spot.destination.slug}/s/${spot.slug}`,
      });
    }
    return result;
  }
}
