export const THEME_COOKIE = 'coastline_theme';
export const THEMES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEMES)[number];

export function parseTheme(value: string | undefined): ThemePreference {
  return (THEMES as readonly string[]).includes(value ?? '')
    ? (value as ThemePreference)
    : 'system';
}

/**
 * Stores the choice in a cookie so the server renders <html data-theme> and
 * the first paint is already in the right theme (no flash, no inline script).
 */
export function applyTheme(theme: ThemePreference): void {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  const root = document.documentElement;
  if (theme === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }
}
