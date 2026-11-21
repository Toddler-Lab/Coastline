import { describe, expect, it } from 'vitest';
import { LANG_COOKIE, parseLanguage } from './i18n';

describe('parseLanguage', () => {
  it('defaults to English when the cookie is missing or unknown', () => {
    expect(parseLanguage(undefined)).toBe('en');
    expect(parseLanguage('')).toBe('en');
    expect(parseLanguage('fr')).toBe('en');
  });

  it('reads Bangla from the cookie', () => {
    expect(parseLanguage('bn')).toBe('bn');
    expect(LANG_COOKIE).toBe('coastline_lang');
  });
});
