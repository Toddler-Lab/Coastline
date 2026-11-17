/**
 * Real aerial imagery of a place, built from Esri World Imagery tiles (the same
 * source the sunbed map uses). Used for destination and spot heroes until the
 * operator uploads photos (WP-07 and WP-18).
 */
export const IMAGERY_CREDIT = 'Imagery © Esri, Maxar, Earthstar Geographics';

const TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';

export interface TileMosaic {
  cols: number;
  rows: number;
  tiles: string[];
}

function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

/** A cols x rows block of tiles centred on the coordinate. */
export function tileMosaic(
  latitude: number,
  longitude: number,
  zoom: number,
  cols = 4,
  rows = 3,
): TileMosaic {
  const x0 = Math.floor(lonToTileX(longitude, zoom) - cols / 2 + 0.5);
  const y0 = Math.floor(latToTileY(latitude, zoom) - rows / 2 + 0.5);
  const tiles: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      tiles.push(`${TILE_URL}/${zoom}/${y0 + row}/${x0 + col}`);
    }
  }
  return { cols, rows, tiles };
}
