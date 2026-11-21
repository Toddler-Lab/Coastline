import creditsData from '../../public/media/credits.json';

export interface MediaCredit {
  file: string;
  source_title: string;
  author: string;
  license: string;
  source_url: string;
  used_for: string;
  modified: string;
}

export const MEDIA_CREDITS: MediaCredit[] = creditsData as MediaCredit[];

export function getMediaCredits(): MediaCredit[] {
  return MEDIA_CREDITS;
}
