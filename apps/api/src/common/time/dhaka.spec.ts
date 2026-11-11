import { describe, expect, it } from 'vitest';
import { dhakaDateTimeToUtc } from './dhaka';

describe('dhakaDateTimeToUtc', () => {
  it('converts a Dhaka wall-clock time to the UTC instant', () => {
    expect(dhakaDateTimeToUtc('2026-12-01', '14:00').toISOString()).toBe(
      '2026-12-01T08:00:00.000Z',
    );
    expect(dhakaDateTimeToUtc('2026-12-01', '09:30').toISOString()).toBe(
      '2026-12-01T03:30:00.000Z',
    );
    expect(dhakaDateTimeToUtc('2026-12-01', '00:00').toISOString()).toBe(
      '2026-11-30T18:00:00.000Z',
    );
  });

  it('falls back to the 14:00 default for malformed or out-of-range times', () => {
    for (const bad of ['', 'noon', '25:00', '10:75']) {
      expect(dhakaDateTimeToUtc('2026-12-01', bad).toISOString()).toBe('2026-12-01T08:00:00.000Z');
    }
  });
});
