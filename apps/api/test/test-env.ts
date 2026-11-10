import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Repository root, resolved from the API package. */
export const repoRoot = resolve(__dirname, '../../..');

export function loadEnvironment(): void {
  const envPath = resolve(repoRoot, '.env');
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

/** Test URL, or the development URL with the database name switched. */
export function resolveTestDatabaseUrl(): string | undefined {
  loadEnvironment();

  if (process.env.TEST_DATABASE_URL) {
    return process.env.TEST_DATABASE_URL;
  }

  const developmentUrl = process.env.DATABASE_URL;
  if (!developmentUrl) {
    return undefined;
  }

  try {
    const url = new URL(developmentUrl);
    url.pathname = '/coastline_test';
    return url.toString();
  } catch {
    return undefined;
  }
}
