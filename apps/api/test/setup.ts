import 'reflect-metadata';
import { resolveTestDatabaseUrl } from './test-env';

process.env.NODE_ENV = 'test';
process.env.DEMO_AUTH_ENABLED = 'true';
process.env.TICKET_SECRET = 'test-ticket-secret';
// Specs assert the real time rules; a developer's local .env must not relax them.
process.env.DINING_IGNORE_TIME_RULES = 'false';

const testUrl = resolveTestDatabaseUrl();
if (testUrl && process.env.COASTLINE_TEST_DB_READY === '1') {
  process.env.DATABASE_URL = testUrl;
}
