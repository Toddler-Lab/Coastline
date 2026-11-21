import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider, LanguageSwitch, useLanguage } from './language';

function Probe() {
  const { lang, t } = useLanguage();
  return <span data-testid="probe">{t('Search spots', 'স্পট খুঁজুন')}</span>;
}

describe('LanguageProvider', () => {
  it('renders English copy by default and switches to Bangla from the shared switch', () => {
    render(
      <LanguageProvider initial="en">
        <LanguageSwitch />
        <Probe />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('probe').textContent).toBe('Search spots');

    fireEvent.click(screen.getByRole('button', { name: 'বাংলা' }));

    expect(screen.getByTestId('probe').textContent).toBe('স্পট খুঁজুন');
    expect(screen.getByRole('button', { name: 'বাংলা' }).getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.lang).toBe('bn');
    expect(document.cookie).toContain('coastline_lang=bn');
  });
});
