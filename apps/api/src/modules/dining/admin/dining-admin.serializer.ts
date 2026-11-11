import type {
  AdminMenuCategoryDto,
  AdminMenuItemDto,
  DiningAdminVenueDto,
} from '@coastline/api-contracts';
import type {
  Prisma,
  BeachPoint as PrismaBeachPoint,
  DiningVenue as PrismaDiningVenue,
  MenuCategory as PrismaMenuCategory,
  MenuItem as PrismaMenuItem,
} from '@coastline/db';

/**
 * Admin venue serializer. Stream A owns the public catalogue serializer; this
 * one is kept local so the streams do not depend on each other. The output is
 * a superset of `DiningVenueDetail` and may be consolidated after merge.
 */
export type AdminVenueRecord = PrismaDiningVenue & {
  beachPoint: Pick<PrismaBeachPoint, 'code' | 'name'> | null;
  categories: Array<PrismaMenuCategory & { items: PrismaMenuItem[] }>;
};

/** Prisma include that loads everything `serializeAdminVenue` needs, in display order. */
export const ADMIN_VENUE_INCLUDE = {
  beachPoint: { select: { code: true, name: true } },
  categories: {
    orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
    include: { items: { orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }] } },
  },
} satisfies Prisma.DiningVenueInclude;

export function serializeAdminMenuItem(item: PrismaMenuItem): AdminMenuItemDto {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    nameBn: item.nameBn,
    description: item.description,
    priceMinor: item.priceMinor,
    currency: item.currency.trim(),
    isAvailable: item.isAvailable,
    imageUrl: item.imageUrl,
    sortOrder: item.sortOrder,
  };
}

export function serializeAdminVenue(venue: AdminVenueRecord): DiningAdminVenueDto {
  const menu: AdminMenuCategoryDto[] = venue.categories.map((category) => ({
    id: category.id,
    name: category.name,
    nameBn: category.nameBn,
    sortOrder: category.sortOrder,
    items: category.items.map(serializeAdminMenuItem),
  }));

  const availablePrices = venue.categories
    .flatMap((category) => category.items)
    .filter((item) => item.isAvailable)
    .map((item) => item.priceMinor);

  return {
    id: venue.id,
    code: venue.code,
    name: venue.name,
    nameBn: venue.nameBn,
    kind: venue.kind,
    description: venue.description,
    imageUrl: venue.imageUrl,
    cuisineTags: venue.cuisineTags,
    beachPointCode: venue.beachPoint?.code ?? null,
    beachPointName: venue.beachPoint?.name ?? null,
    openHour: venue.openHour,
    closeHour: venue.closeHour,
    reservationsEnabled: venue.reservationsEnabled,
    deliveryEnabled: venue.deliveryEnabled,
    priceFromMinor: availablePrices.length > 0 ? Math.min(...availablePrices) : null,
    currency: venue.currency.trim(),
    address: venue.address,
    contactPhone: venue.contactPhone,
    reservationDepositMinor: venue.reservationDepositMinor,
    menu,
    isActive: venue.isActive,
    sortOrder: venue.sortOrder,
  };
}
