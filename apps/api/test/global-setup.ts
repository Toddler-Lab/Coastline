import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { repoRoot, resolveTestDatabaseUrl } from './test-env';

/**
 * Applies checked-in migrations to the isolated test database once per run.
 * Integration specs skip when no test database is reachable.
 */
export default function setup(): void {
  const databaseUrl = resolveTestDatabaseUrl();
  const prismaCli = join(repoRoot, 'packages/db/node_modules/prisma/build/index.js');
  const schema = join(repoRoot, 'packages/db/prisma/schema.prisma');

  if (!databaseUrl || !existsSync(prismaCli)) {
    process.env.COASTLINE_TEST_DB_READY = '0';
    return;
  }

  try {
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schema], {
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    process.env.COASTLINE_TEST_DB_READY = '1';
    process.env.TEST_DATABASE_URL = databaseUrl;
    process.env.DATABASE_URL = databaseUrl;
  } catch {
    console.warn('Test database migrations failed; integration specs will be skipped.');
    process.env.COASTLINE_TEST_DB_READY = '0';
  }
}

export const testDatabasePath = resolve(repoRoot, 'packages/db/prisma/schema.prisma');
