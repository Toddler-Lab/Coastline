import type { FoodOrderListDto } from '@coastline/api-contracts';
import { serverApi } from '@/lib/api';
import { FoodOrderCard } from '@/components/dining/food-order-card';

/**
 * Stream C: the persona's sunbed food orders on /bookings. Renders nothing
 * when there are none or the API call fails, so the sunbed list stays primary.
 */
export async function MyFoodOrders({ userId }: { userId: string }) {
  let orders: FoodOrderListDto['orders'];
  try {
    orders = (await serverApi<FoodOrderListDto>('/dining/food-orders/me', userId)).orders;
  } catch {
    return null;
  }
  if (orders.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="group-food-orders" className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <div>
          <p className="label">Sunbed delivery · demo</p>
          <h2 id="group-food-orders" className="mt-1 text-[22px]">
            Food orders
          </h2>
        </div>
        <span className="font-mono text-[10px] text-mist">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {orders.map((order) => (
          <FoodOrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
