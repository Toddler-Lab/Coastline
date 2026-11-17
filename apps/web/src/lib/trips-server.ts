import type { FoodOrderDto, OrderDto, ReservationDto } from '@coastline/api-contracts';
import { serverApi } from './api';
import { foodOrderToTrip, orderToTrip, reservationToTrip, type TripItem } from './trips';

export interface TripsResult {
  trips: TripItem[];
  failed: boolean;
}

/** Aggregates every engine's bookings for the signed-in visitor. */
export async function loadTrips(userId: string): Promise<TripsResult> {
  const [orders, reservations, food] = await Promise.allSettled([
    serverApi<OrderDto[] | { orders: OrderDto[] }>('/orders/me', userId),
    serverApi<ReservationDto[] | { reservations: ReservationDto[] }>(
      '/dining/reservations/me',
      userId,
    ),
    serverApi<FoodOrderDto[] | { orders: FoodOrderDto[] }>('/dining/food-orders/me', userId),
  ]);
  const trips: TripItem[] = [];
  if (orders.status === 'fulfilled') {
    const list = Array.isArray(orders.value) ? orders.value : orders.value.orders;
    trips.push(...list.map(orderToTrip));
  }
  if (reservations.status === 'fulfilled') {
    const list = Array.isArray(reservations.value)
      ? reservations.value
      : reservations.value.reservations;
    trips.push(...list.map(reservationToTrip));
  }
  if (food.status === 'fulfilled') {
    const list = Array.isArray(food.value) ? food.value : food.value.orders;
    trips.push(...list.map(foodOrderToTrip));
  }
  return {
    trips,
    failed: [orders, reservations, food].some((result) => result.status === 'rejected'),
  };
}
