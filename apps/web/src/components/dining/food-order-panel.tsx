'use client';

import type { DiningVenueDetail, SessionUser } from '@coastline/api-contracts';

export interface FoodOrderPanelProps {
  venue: DiningVenueDetail;
  /** Null when the API could not resolve the demo persona. */
  viewer: SessionUser | null;
}

/**
 * Stream C (sunbed food delivery) owns this file. Rendered by the venue page
 * (stream A) when `venue.deliveryEnabled`. Placeholder until stream C lands.
 */
export function FoodOrderPanel(_props: FoodOrderPanelProps) {
  return null;
}
