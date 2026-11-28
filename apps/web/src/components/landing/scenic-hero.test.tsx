import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { DestinationSummaryDto } from '@coastline/api-contracts';
import { DroneLandingView } from './explore-landing-view';
import { LanguageProvider } from '@/components/patterns/language';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const SEEDED_DESTINATIONS: DestinationSummaryDto[] = [
  {
    slug: 'coxs-bazar',
    name: "Cox's Bazar",
    nameBn: 'কক্সবাজার',
    tagline: 'Sea, sand and the Marine Drive',
    accent: 'SEA',
    latitude: 21.385,
    longitude: 91.995,
    mapZoom: 13,
    spotCount: 6,
    services: { stay: 3, food: 3, sunbeds: 6 },
    topAlert: null,
  },
  {
    slug: 'sylhet',
    name: 'Sylhet',
    nameBn: 'সিলেট',
    tagline: 'Tea gardens, swamp forest and clear hill rivers',
    accent: 'FOREST',
    latitude: 25.05,
    longitude: 91.93,
    mapZoom: 11,
    spotCount: 3,
    services: { stay: 0, food: 0, sunbeds: 0 },
    topAlert: null,
  },
  {
    slug: 'rangamati',
    name: 'Rangamati',
    nameBn: 'রাঙামাটি',
    tagline: 'Hills around the wide waters of Kaptai Lake',
    accent: 'LAKE',
    latitude: 22.65,
    longitude: 92.2,
    mapZoom: 11,
    spotCount: 3,
    services: { stay: 0, food: 0, sunbeds: 0 },
    topAlert: null,
  },
];

describe('DroneLandingView', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
  });

  it('renders High-Res video by default without fake camera HUD or right rail and switches to Lite mode', () => {
    const { container } = render(
      <LanguageProvider initial="en">
        <DroneLandingView
          destinations={SEEDED_DESTINATIONS}
          destination={null}
          searchIndex={[]}
          inventory={null}
        />
      </LanguageProvider>,
    );

    expect(screen.queryByText('REC')).toBeNull();
    expect(container.querySelector('.dl-rail')).toBeNull();
    expect(container.querySelector('video')).not.toBeNull();
    expect(screen.getByRole('button', { name: /Play ambient background music/i })).toBeTruthy();

    const liteBtn = screen.getByRole('button', { name: /Switch to Lite mode/i });
    fireEvent.click(liteBtn);

    expect(container.querySelector('video')).toBeNull();
    expect(localStorage.getItem('coastline_lite_mode')).toBe('true');
    expect(screen.getByRole('button', { name: /Switch to High-Res mode/i })).toBeTruthy();
  });

  it('shows Coming soon for unseeded destinations instead of broken links', () => {
    const { container } = render(
      <LanguageProvider initial="en">
        <DroneLandingView
          destinations={SEEDED_DESTINATIONS}
          destination={null}
          searchIndex={[]}
          inventory={null}
        />
      </LanguageProvider>,
    );

    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="/d/bandarban"]')).toBeNull();
    expect(container.querySelector('a[href="/d/sundarbans"]')).toBeNull();
    expect(container.querySelector('a[href="/d/coxs-bazar"]')).not.toBeNull();
  });

  it('uses luminous 2-tier glass panels and cards without opaque bg-surface section overrides', () => {
    const { container } = render(
      <LanguageProvider initial="en">
        <DroneLandingView
          destinations={SEEDED_DESTINATIONS}
          destination={null}
          searchIndex={[]}
          inventory={null}
        />
      </LanguageProvider>,
    );

    expect(container.querySelectorAll('.dl-glass-panel').length).toBeGreaterThanOrEqual(7);
    expect(container.querySelectorAll('.glass-card').length).toBeGreaterThan(0);
    expect(container.querySelector('section#about')?.className).not.toContain('bg-surface/30');
    expect(container.querySelector('section#help')?.getAttribute('style') ?? '').not.toContain(
      'var(--surface)',
    );
  });
});
