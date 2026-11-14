/**
 * Hero photo per beach point, keyed by beach point code.
 *
 * All entries are null on purpose. The orchestrator fills them in with verified,
 * licensed photos under the sourcing rules of docs/implementation-plan.md WP-09
 * (Unsplash, Pexels, or Wikimedia Commons CC0 / CC BY / CC BY-SA; the photo must
 * show that beach point; landscape, at least 1600 px wide; no watermark) and
 * records each choice in the sourcing table there. Never invent a URL here.
 *
 * - imageUrl: https URL of the photo (the database rejects anything else).
 * - imageAlt: text describing what is in the picture.
 * - imageCredit: attribution, when the licence requires it (CC BY, CC BY-SA).
 */
export interface BeachPointImage {
  imageUrl: string | null;
  imageAlt: string | null;
  imageCredit: string | null;
}

export type BeachPointCode = 'LAB' | 'SUG' | 'KOL' | 'HIM' | 'INA' | 'TEK';

export const BEACH_POINT_IMAGES: Record<BeachPointCode, BeachPointImage> = {
  LAB: { imageUrl: null, imageAlt: null, imageCredit: null },
  SUG: { imageUrl: null, imageAlt: null, imageCredit: null },
  KOL: { imageUrl: null, imageAlt: null, imageCredit: null },
  HIM: { imageUrl: null, imageAlt: null, imageCredit: null },
  INA: { imageUrl: null, imageAlt: null, imageCredit: null },
  TEK: { imageUrl: null, imageAlt: null, imageCredit: null },
};

/** Image fields for a code, all null when the code has no entry. */
export function beachPointImageFor(code: string): BeachPointImage {
  return (
    BEACH_POINT_IMAGES[code as BeachPointCode] ?? {
      imageUrl: null,
      imageAlt: null,
      imageCredit: null,
    }
  );
}
