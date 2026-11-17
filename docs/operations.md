# Operations and Deployment

**Environment status:** local-first; hosting not chosen

## 1. Configuration

| Variable | Purpose |
|---|---|
| `NODE_ENV`, `APP_ENV` (`local`, `staging`, `production`), `PORT`, `TZ=UTC` | Runtime |
| `DATABASE_URL`, `TEST_DATABASE_URL`, `POSTGRES_PORT` | PostgreSQL |
| `WEB_ORIGIN`, `API_INTERNAL_URL`, `CORS_ORIGINS` | Web and API wiring |
| `DEMO_AUTH_ENABLED` | Seeded-account switcher; refused in production |
| `PAYMENT_PROVIDER` (`SANDBOX`) | Payment adapter; any other value needs a reviewed adapter |
| `STORAGE_DRIVER` (`local`, `s3`), `STORAGE_LOCAL_DIR`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT`, credentials | Uploads |
| `TICKET_SIGNING_SECRET` | QR ticket signatures (32+ random bytes) |
| `DINING_IGNORE_TIME_RULES` | Local testing aid; refused in production |
| `LOG_LEVEL` | Logging |

Business settings (commission, deposit percent, hold minutes, lost-and-found holding days) live in
the `settings` table and are edited in the admin console. Never commit secrets.

## 2. Local development

```bash
pnpm install
pnpm db:setup        # Docker PostgreSQL, migrations, seeds
pnpm dev             # API on 3001, web on 3000
```

Run `pnpm install` and `pnpm db:migrate` after every pull. Uploads go to `var/uploads` (ignored by
git). Seeds create Cox's Bazar, Sylhet and Rangamati with spots, providers of every type, and the
seeded accounts listed in the README.

## 3. Background jobs

In-process scheduler: expire booking holds (every minute), generate offering slots (hourly, 30 days
ahead), close quote requests at `bids_close_at`, auto-settle delivered jobs after 48 hours, expire
lost-and-found items, score matches for new items. Jobs are idempotent and batch-limited; a second
API instance must not run them (single scheduler flag) until a shared lock is added.

## 4. Health and observability

`/health/live` and `/health/ready` (database and storage). Structured logs with request ID; no
personal data or secrets. Watch HTTP errors and latency, booking conflicts, hold-expiry backlog,
ledger balance check failures, upload rejections and job failures.

## 5. Deployment

Hosting is not chosen. Requirements: TLS, a secret manager, a least-privilege database role,
migrations as a release step, object storage with private buckets, backups with a tested restore,
rate limits, and a rollback or mitigation note for every migration. `DEMO_AUTH_ENABLED` and
`DINING_IGNORE_TIME_RULES` must be off in production; a live payment adapter needs a separate
approval.
