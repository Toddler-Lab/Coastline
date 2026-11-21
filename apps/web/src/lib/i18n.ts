export const LANG_COOKIE = 'coastline_lang';

export const LANGUAGES = ['en', 'bn'] as const;
export type Language = (typeof LANGUAGES)[number];

export function parseLanguage(value: string | undefined): Language {
  return value === 'bn' ? 'bn' : 'en';
}

/** Persist the choice in a cookie so the server renders <html lang> on the next request. */
export function applyLanguage(lang: Language): void {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
}
