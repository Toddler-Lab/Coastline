# Operations and Deployment

**Environment status:** local-first; production provider choices open

## 1. Configuration

`NODE_ENV`; `APP_ENV` (`local`/`staging`/`production`); `DATABASE_URL` (standard PostgreSQL);
`DATABASE_SSL`; `WEB_BASE_URL`; `API_BASE_URL`; `CORS_ORIGINS`; `SESSION_SECRET` (random, at least 32
bytes); `SESSION_IDLE_MINUTES`; `SESSION_ABSOLUTE_HOURS`; `DEMO_AUTH_ENABLED` (seeded-account
switch); `PAYMENT_PROVIDER` (`sandbox` is the only value today); `ALLOW_SANDBOX_PAYMENTS`;
`FEATURE_RIDES`; `FEATURE_ACTIVITIES`; `LOG_LEVEL`; `PORT`; `TZ=UTC`; optional `MAP_PROVIDER`.

Never commit secrets. Startup must reject the seeded-account switch and seeded credentials in
production.

**Sandbox payments in production.** With `APP_ENV=production` and `PAYMENT_PROVIDER=sandbox`,
startup fails unless `ALLOW_SANDBOX_PAYMENTS=true` is set deliberately. The interface does not tell
visitors that payments are sandboxed, so a public deployment in this mode confirms bookings without
collecting money. That is acceptable for a presentation or a closed pilot and is the operator's
explicit decision, never a default.

**Feature flags.** `FEATURE_RIDES` and `FEATURE_ACTIVITIES` default to off. While off, the routes
answer not-found and the services are absent from navigation ([design.md](design.md) section 6.1).

`PAYMENT_PROVIDER`, `ALLOW_SANDBOX_PAYMENTS` and the feature flags are specified here and not yet
implemented; see WP-07 and WP-10 of [implementation-plan.md](implementation-plan.md). The API's
environment validation currently also accepts `APP_ENV=demo`; WP-10 either keeps it as an alias of
`staging` or removes it. Variables in use today that are not listed above: `WEB_ORIGIN`,
`API_INTERNAL_URL`, `TEST_DATABASE_URL`, `POSTGRES_PORT`, `TICKET_SECRET` and the testing aid
`DINING_IGNORE_TIME_RULES` (refused in production).

## 2. Local development

Use Node.js 22 LTS and pnpm workspaces. Start PostgreSQL with Docker Compose from
`infra/compose.yaml` with `pnpm db:up` (it also creates the test database; set `POSTGRES_PORT` in
`.env` if 5432 is taken). PostGIS is optional. Run `pnpm db:migrate` after every pull and before
starting the API.

When the scaffold is added, expose root scripts for install, dev, lint, typecheck, test, test:e2e,
build, migrate, seed and reset. Use pnpm workspace filters for per-app commands. Turborepo is not
used. `.env.example` contains placeholders only. Seed/reset must be explicit, repeatable and blocked
outside local and staging.

There is no file-upload storage or notification service.

## 3. Health and observability

`/health/live` checks the process; `/health/ready` checks essential dependencies, especially the
database. Structured logs include request ID and safe domain event fields; redact personal data and
secrets. Track HTTP errors/latency, booking conflicts, expiry backlog and ledger validation failures
without sensitive metric labels.

## 4. Deployment

Hosting and managed PostgreSQL provider are not selected; “dbx” remains unconfirmed. Require TLS, a
secret manager, a least-privilege DB role, a migration job before rollout, backup and tested restore,
rate limits and a rollback/mitigation plan. Avoid platform-specific database features until the
provider is chosen and documented.

## 5. Recovery and release safeguards

Document backup retention and a restoration owner before production. Never run a destructive seed
reset in production. A live payment gateway or a government integration is never enabled by merely
setting a URL or a provider name; each requires separate product/legal/security approval and
implementation design.
