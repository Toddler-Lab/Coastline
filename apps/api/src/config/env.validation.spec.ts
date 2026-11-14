import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation';

const DATABASE_URL = 'postgresql://user:pass@127.0.0.1:5432/db';

function validate(extra: Record<string, unknown>): Record<string, unknown> {
  return validateEnvironment({ DATABASE_URL, ...extra });
}

/** Production settings that pass every other guard. */
const PRODUCTION = { NODE_ENV: 'production', APP_ENV: 'production', DEMO_AUTH_ENABLED: 'false' };

describe('validateEnvironment: payments', () => {
  it('defaults to the sandbox adapter and does not allow it in production', () => {
    const config = validate({});
    expect(config.PAYMENT_PROVIDER).toBe('sandbox');
    expect(config.ALLOW_SANDBOX_PAYMENTS).toBe(false);
  });

  it('accepts the sandbox adapter outside production', () => {
    for (const appEnv of ['local', 'staging']) {
      expect(validate({ APP_ENV: appEnv, PAYMENT_PROVIDER: 'sandbox' }).PAYMENT_PROVIDER).toBe(
        'sandbox',
      );
    }
  });

  it('refuses an unknown provider at start-up', () => {
    expect(() => validate({ PAYMENT_PROVIDER: 'stripe' })).toThrow(/PAYMENT_PROVIDER/);
    expect(() => validate({ PAYMENT_PROVIDER: '' })).toThrow(/PAYMENT_PROVIDER/);
  });

  it.each([
    ['NODE_ENV=production', { NODE_ENV: 'production', DEMO_AUTH_ENABLED: 'false' }],
    ['APP_ENV=production', { APP_ENV: 'production', DEMO_AUTH_ENABLED: 'false' }],
  ])('refuses the sandbox adapter in production (%s) unless allowed', (_label, env) => {
    expect(() => validate(env)).toThrow(/ALLOW_SANDBOX_PAYMENTS/);
    expect(() => validate({ ...env, ALLOW_SANDBOX_PAYMENTS: 'false' })).toThrow(
      /ALLOW_SANDBOX_PAYMENTS/,
    );
  });

  it('starts in production with the sandbox adapter when explicitly allowed', () => {
    const config = validate({ ...PRODUCTION, ALLOW_SANDBOX_PAYMENTS: 'true' });
    expect(config.PAYMENT_PROVIDER).toBe('sandbox');
    expect(config.ALLOW_SANDBOX_PAYMENTS).toBe(true);
  });

  it('rejects a non-boolean ALLOW_SANDBOX_PAYMENTS', () => {
    expect(() => validate({ ALLOW_SANDBOX_PAYMENTS: 'maybe' })).toThrow(/ALLOW_SANDBOX_PAYMENTS/);
  });
});

describe('validateEnvironment: APP_ENV and existing guards', () => {
  it('accepts local, staging and production only', () => {
    expect(validate({ APP_ENV: 'local' }).APP_ENV).toBe('local');
    expect(validate({ APP_ENV: 'staging' }).APP_ENV).toBe('staging');
    expect(() => validate({ APP_ENV: 'demo' })).toThrow(/APP_ENV/);
  });

  it('still refuses the seeded-account switch in production', () => {
    expect(() =>
      validate({ ...PRODUCTION, DEMO_AUTH_ENABLED: 'true', ALLOW_SANDBOX_PAYMENTS: 'true' }),
    ).toThrow(/DEMO_AUTH_ENABLED/);
  });
});
