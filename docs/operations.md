# Operations and Deployment

**Environment status:** local/demo-first; production provider choices open

## 1. Configuration

`NODE_ENV`; `APP_ENV` (`local`/`demo`/`staging`/`production`); `DATABASE_URL` (standard PostgreSQL);
`DATABASE_SSL`; `WEB_BASE_URL`; `API_BASE_URL`; `CORS_ORIGINS`; `SESSION_SECRET` (random, at least 32
bytes); `SESSION_IDLE_MINUTES`; `SESSION_ABSOLUTE_HOURS`; `DEMO_MODE`; `LOG_LEVEL`; `PORT`; `TZ=UTC`;
optional `MAP_PROVIDER`.

Never commit secrets. Startup must reject demo mode or seeded demo credentials in production.

## 2. Local development

Use Node.js 22 LTS and pnpm workspaces. Start PostgreSQL with Docker Compose from
`infra/compose.yaml`; PostGIS is optional. Apply migrations before starting the API.

When the scaffold is added, expose root scripts for install, dev, lint, typecheck, test, test:e2e,
build, migrate, seed and reset. Use pnpm workspace filters for per-app commands. Turborepo is not
used. `.env.example` contains placeholders only. Seed/reset must be explicit, repeatable and blocked
outside local/demo.

MVP has no file-upload storage or notification service.

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

Document backup retention and a restoration owner before production. Never run destructive demo
reset in production. No real payments or government integrations may be enabled by merely setting a
URL; those require separate product/legal/security approval and implementation design.
