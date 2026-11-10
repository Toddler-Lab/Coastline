/**
 * Integration-test bootstrap for the shared environment.
 *
 * `@prisma/client` loads the repository `.env` when it is imported, which leaves
 * `PORT` as a string. The shared environment validator requires an integer, and
 * NestJS ConfigModule validates while `AppModule` is being imported, before any
 * test body can adjust `process.env`.
 *
 * Importing Prisma here makes the ordering explicit: the `.env` is loaded once,
 * this module then drops `PORT`, and `AppModule` can be imported by the fixture
 * afterwards with a valid environment.
 *
 * Import this module before `integration-fixture` in every integration spec.
 */
import '@coastline/db';

delete process.env.PORT;
