'use client';

import type { DiningVenueDetail, SessionUser } from '@coastline/api-contracts';

export interface ReservationPanelProps {
  venue: DiningVenueDetail;
  /** Null when the API could not resolve the demo persona. */
  viewer: SessionUser | null;
}

/**
 * Stream B (table reservations) owns this file. Rendered by the venue page
 * (stream A) when `venue.reservationsEnabled`. Placeholder until stream B lands.
 */
export function ReservationPanel(_props: ReservationPanelProps) {
  return null;
}
