#!/usr/bin/env node
// Starts the local Docker PostgreSQL, waits until it is healthy and makes sure
// the test database exists. Safe to run repeatedly.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compose = resolve(root, 'infra/compose.yaml');
const envFile = resolve(root, '.env');
const envArgs = existsSync(envFile) ? ['--env-file', envFile] : [];

function run(args, { capture = false } = {}) {
  const result = spawnSync('docker', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.error) {
    console.error(
      'Could not run Docker. Install Docker Desktop and make sure it is running, then retry.',
    );
    process.exit(1);
  }
  return result;
}

const up = run(['compose', ...envArgs, '-f', compose, 'up', '-d', '--wait']);
if (up.status !== 0) {
  console.error(
    '\nDocker Compose failed. If the port is already in use (often a native PostgreSQL on 5432),\n' +
      'set POSTGRES_PORT=5433 in .env and use port 5433 in DATABASE_URL and TEST_DATABASE_URL.',
  );
  process.exit(up.status ?? 1);
}

const exists = run(
  [
    'exec',
    'coastline-postgres',
    'psql',
    '-U',
    'coastline_app',
    '-d',
    'coastline_dev',
    '-Atc',
    "select 1 from pg_database where datname = 'coastline_test'",
  ],
  { capture: true },
);
if (exists.stdout.trim() !== '1') {
  const created = run([
    'exec',
    'coastline-postgres',
    'psql',
    '-U',
    'coastline_app',
    '-d',
    'coastline_dev',
    '-c',
    'create database coastline_test',
  ]);
  if (created.status !== 0) process.exit(created.status ?? 1);
}

console.log('PostgreSQL is ready (databases: coastline_dev, coastline_test).');
