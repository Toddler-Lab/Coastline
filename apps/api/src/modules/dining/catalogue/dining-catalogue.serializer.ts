import type {
  DiningVenueDetail,
  DiningVenueKind,
  DiningVenueSummary,
  MenuCategoryDto,
  MenuItemDto,
} from '@coastline/api-contracts';
import type { Prisma } from '@coastline/db';

/** Include for a venue row with its beach point label. */
export const DINING_VENUE_SUMMARY_INCLUDE = {
  beachPoint: { select: { code: true, name: true } },
} satisfies Prisma.DiningVenueInclude;

/** Include for a venue with its full menu in display order. */
export const DINING_VENUE_DETAIL_INCLUDE = {
  beachPoint: { select: { code: true, name: true } },
  categories: {
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      items: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
    },
  },
} satisfies Prisma.DiningVenueInclude;

export type DiningVenueSummaryRow = Prisma.DiningVenueGetPayload<{
  include: typeof DINING_VENUE_SUMMARY_INCLUDE;
}>;

export type DiningVenueDetailRow = Prisma.DiningVenueGetPayload<{
  include: typeof DINING_VENUE_DETAIL_INCLUDE;
}>;

type MenuItemRow = DiningVenueDetailRow['categories'][number]['items'][number];
type MenuCategoryRow = DiningVenueDetailRow['categories'][number];

export function serializeMenuItem(item: MenuItemRow): MenuItemDto {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    nameBn: item.nameBn,
    description: item.description,
    priceMinor: item.priceMinor,
    currency: item.currency,
    isAvailable: item.isAvailable,
    imageUrl: item.imageUrl,
  };
}

export function serializeMenuCategory(category: MenuCategoryRow): MenuCategoryDto {
  return {
    id: category.id,
    name: category.name,
    nameBn: category.nameBn,
    sortOrder: category.sortOrder,
    items: category.items.map(serializeMenuItem),
  };
}

/** Cheapest available item price, or null when nothing on the menu is available. */
export function cheapestAvailablePrice(
  items: ReadonlyArray<Pick<MenuItemRow, 'priceMinor' | 'isAvailable'>>,
): number | null {
  let cheapest: number | null = null;
  for (const item of items) {
    if (item.isAvailable && (cheapest === null || item.priceMinor < cheapest)) {
      cheapest = item.priceMinor;
    }
  }
  return cheapest;
}

export function serializeVenueSummary(
  venue: DiningVenueSummaryRow,
  priceFromMinor: number | null,
): DiningVenueSummary {
  return {
    id: venue.id,
    code: venue.code,
    name: venue.name,
    nameBn: venue.nameBn,
    kind: venue.kind as DiningVenueKind,
    description: venue.description,
    imageUrl: venue.imageUrl,
    cuisineTags: [...venue.cuisineTags],
    beachPointCode: venue.beachPoint?.code ?? null,
    beachPointName: venue.beachPoint?.name ?? null,
    openHour: venue.openHour,
    closeHour: venue.closeHour,
    reservationsEnabled: venue.reservationsEnabled,
    deliveryEnabled: venue.deliveryEnabled,
    priceFromMinor,
    currency: venue.currency,
  };
}

export function serializeVenueDetail(venue: DiningVenueDetailRow): DiningVenueDetail {
  const items = venue.categories.flatMap((category) => category.items);
  return {
    ...serializeVenueSummary(venue, cheapestAvailablePrice(items)),
    address: venue.address,
    contactPhone: venue.contactPhone,
    reservationDepositMinor: venue.reservationDepositMinor,
    menu: venue.categories.map(serializeMenuCategory),
  };
}
