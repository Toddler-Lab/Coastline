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

interface BeachLineSpec {
  /** Shoreline bearing from North in degrees (NW to SE along Bay of Bengal). */
  bearingDeg: number;
  /** Center-to-center spacing between consecutive sunbeds in meters along the shoreline line. */
  bedSpacingMeters: number;
}

const DEFAULT_SPEC: BeachLineSpec = {
  bearingDeg: 140,
  bedSpacingMeters: 26,
};

/**
 * Shoreline angles along Cox's Bazar coast from north to south.
 * In Cox's Bazar, kitkots (sunbeds with umbrella) form a single line along the
 * sandy shoreline facing the Bay of Bengal waves.
 */
const POINT_SPECS: Record<string, Partial<BeachLineSpec>> = {
  LAB: { bearingDeg: 138, bedSpacingMeters: 26 },
  SUG: { bearingDeg: 138, bedSpacingMeters: 26 },
  KOL: { bearingDeg: 142, bedSpacingMeters: 25 },
  HIM: { bearingDeg: 155, bedSpacingMeters: 26 },
  INA: { bearingDeg: 165, bedSpacingMeters: 26 },
  TEK: { bearingDeg: 150, bedSpacingMeters: 26 },
};

const METERS_PER_DEG_LAT = 110740;
const METERS_PER_DEG_LON = 103500;

/**
 * Beds are laid out in a single continuous line following the authentic sea beach shoreline.
 *
 * Rather than a grid, kitkots in Cox's Bazar are arranged side-by-side in one
 * line directly along the sandy beach facing the surf.
 */
export function layoutBeds(point: BeachPointSummary | BeachPointDetail): BedPosition[] {
  const beds = 'sunbeds' in point ? point.sunbeds : [];
  if (beds.length === 0) {
    return [];
  }

  const code = 'code' in point ? point.code : '';
  const spec: BeachLineSpec = {
    ...DEFAULT_SPEC,
    ...(POINT_SPECS[code] ?? {}),
  };

  const bearingRad = (spec.bearingDeg * Math.PI) / 180;
  // Unit vector along the coast: North = +lat, East = +lon
  const alongX = Math.sin(bearingRad);
  const alongY = Math.cos(bearingRad);

  return beds.map((sunbed, index) => {
    // Symmetrically center the single line of sunbeds on the beach point coordinates.
    // Index 0 is northernmost along the shore line, increasing toward the south.
    const distAlongM = (index - (beds.length - 1) / 2) * spec.bedSpacingMeters;

    const dxM = distAlongM * alongX;
    const dyM = distAlongM * alongY;

    const deltaLon = dxM / METERS_PER_DEG_LON;
    const deltaLat = dyM / METERS_PER_DEG_LAT;

    return {
      id: sunbed.id,
      code: sunbed.code,
      latitude: point.latitude + deltaLat,
      longitude: point.longitude + deltaLon,
      sunbed,
    };
  });
}
