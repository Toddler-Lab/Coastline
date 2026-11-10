import type {
  BeachPointDetail,
  BeachPointSummary,
  SunbedAvailability,
} from '@coastline/api-contracts';

export interface BedPosition {
  id: string;
  code: string;
  latitude: number;
  longitude: number;
  sunbed: SunbedAvailability;
}

const COLUMNS = 4;
const LAT_STEP = 0.00014;
const LNG_STEP = 0.00016;

/**
 * Beds are drawn as a tidy field anchored on the beach point. The layout is
 * schematic (not survey-accurate) and deterministic, so a bed keeps its place
 * between renders and between devices.
 */
export function layoutBeds(point: BeachPointSummary | BeachPointDetail): BedPosition[] {
  const beds = 'sunbeds' in point ? point.sunbeds : [];
  return beds.map((sunbed, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const rows = Math.ceil(beds.length / COLUMNS);
    const offsetX = (column - (COLUMNS - 1) / 2) * LNG_STEP;
    const offsetY = ((rows - 1) / 2 - row) * LAT_STEP;

    return {
      id: sunbed.id,
      code: sunbed.code,
      latitude: point.latitude + offsetY,
      longitude: point.longitude + offsetX,
      sunbed,
    };
  });
}
