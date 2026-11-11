import type {
  AdminFoodOrderDto,
  DeliverableBedDto,
  FoodOrderDto,
  FoodOrderLineDto,
} from '@coastline/api-contracts';
import type {
  FoodOrder as PrismaFoodOrder,
  FoodOrderItem as PrismaFoodOrderItem,
  OrderItem as PrismaOrderItem,
  Payment as PrismaPayment,
  User as PrismaUser,
} from '@coastline/db';
import { serializePayment } from '../../bookings/orders.serializer';

export type FoodOrderWithRelations = PrismaFoodOrder & {
  items: PrismaFoodOrderItem[];
  payments: PrismaPayment[];
  tourist?: PrismaUser;
};

/** Relations every food-order read loads, so serializers never see a partial row. */
export const FOOD_ORDER_INCLUDE = {
  items: { orderBy: { createdAt: 'asc' as const } },
  payments: { orderBy: { createdAt: 'asc' as const } },
  tourist: true,
} as const;

const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);

/** Only a freshly placed order can still be called off; the kitchen has not started. */
export function foodOrderCanCancel(status: PrismaFoodOrder['status']): boolean {
  return status === 'PLACED';
}

export function serializeFoodOrderLine(line: PrismaFoodOrderItem): FoodOrderLineDto {
  return {
    id: line.id,
    menuItemId: line.menuItemId,
    name: line.itemName,
    unitPriceMinor: line.unitPriceMinor,
    quantity: line.quantity,
    totalMinor: line.totalMinor,
  };
}

export function serializeFoodOrder(order: FoodOrderWithRelations): FoodOrderDto {
  return {
    id: order.id,
    publicRef: order.publicRef,
    status: order.status,
    venue: { code: order.venueCode, name: order.venueName },
    delivery: {
      sunbedCode: order.sunbedCode,
      beachPointCode: order.beachPointCode,
      beachPointName: order.beachPointName,
    },
    lines: order.items.map(serializeFoodOrderLine),
    subtotalMinor: order.subtotalMinor,
    totalMinor: order.totalMinor,
    currency: order.currency.trim(),
    note: order.note,
    placedAt: order.placedAt.toISOString(),
    preparingAt: iso(order.preparingAt),
    readyAt: iso(order.readyAt),
    deliveredAt: iso(order.deliveredAt),
    cancelledAt: iso(order.cancelledAt),
    cancelReason: order.cancelReason,
    payments: order.payments.map(serializePayment),
    canCancel: foodOrderCanCancel(order.status),
  };
}

export function serializeAdminFoodOrder(order: FoodOrderWithRelations): AdminFoodOrderDto {
  return {
    ...serializeFoodOrder(order),
    tourist: {
      id: order.tourist?.id ?? order.touristId,
      name: order.tourist?.name ?? 'Tourist',
      email: order.tourist?.email ?? null,
    },
  };
}

export function serializeDeliverableBed(item: PrismaOrderItem): DeliverableBedDto {
  return {
    orderItemId: item.id,
    sunbedCode: item.sunbedCode,
    beachPointCode: item.beachPointCode,
    beachPointName: item.beachPointName,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt.toISOString(),
    status: item.status,
  };
}
