# Agent instructions

This file contains rules that apply to every change. Read it plus only the project artifact(s)
relevant to the assigned task; [README.md](README.md) maps work areas to docs.

## Current state

The repository is a working pnpm monorepo on branch `dev`: the Next.js web app, the NestJS API,
the Prisma schema with 9 migrations and multi-destination seeds, and unit/API/integration tests.
Sunbed booking, dining, hotels, multi-destination discovery (`Cox's Bazar`, `Sylhet`, `Rangamati`),
saved items, checkout quotes (`SANDBOX`), and role-scoped workspaces (`TOURIST`, `PROVIDER`,
`DESK`, `ADMIN`) are running, while remaining v2 features are built in the order of
[docs/implementation-plan.md](docs/implementation-plan.md) and [docs/design.md](docs/design.md).
When a task asks for documentation or structure only, do not add application code.

## Read first

1. This file.
2. The work-area table in [README.md](README.md).
3. Your work package in [docs/implementation-plan.md](docs/implementation-plan.md): scope, tests,
   "done when" and the ground rules.
4. The documents it cites (design, data model, workflows, API, security).
5. The relevant code, schema and tests.

Do not load every guide by default. For cross-cutting work, read only the guides that intersect.

## Stack

- Next.js App Router, React, TypeScript and Tailwind CSS in `apps/web`. This Next.js version has
  breaking changes: read the guide in `apps/web/node_modules/next/dist/docs/` before writing code.
- Node.js 22–24 (`.nvmrc` `24.11.1`) + NestJS on its default Express adapter in `apps/api`.
- PostgreSQL 16+ with Prisma migrations in `packages/db`; reviewed SQL for inventory locks.
- Shared request/response types in `packages/api-contracts`.
- REST `/api/v1` with OpenAPI generated from NestJS DTOs.
- pnpm workspaces; no Turborepo.
- Vitest for unit/API/integration tests and Playwright for browser journeys.
- Docker Compose PostgreSQL in `infra/compose.yaml`.

The browser never connects to PostgreSQL. The API owns business rules, authorization and state
transitions.

## Invariants

- Coastline is an independent platform that earns a commission on bookings. Never imply government
  endorsement, official tariffs, police or regulator verification, or emergency dispatch.
- Payments go through the payment-provider port. The only adapter is `SANDBOX`: it approves,
  declines and refunds without moving money, while every payment, commission, refund and payout is
  recorded. Never render or accept card numbers, CVVs, wallet PINs or one-time codes. Receipts,
  exports and finance views show each payment's provider field. Enabling a live gateway is a
  separate, reviewed change.
- Validate every boundary with shared contracts. Never trust client price, total, commission,
  role, provider ID, desk scope or derived values.
- Store money as integer minor units plus an ISO currency. Store timestamps in UTC and present
  Asia/Dhaka.
- Protect inventory and ledger invariants with database transactions and constraints. Snapshot
  names, prices, commission rate and cancellation policy on bookings. Ledger entries balance per
  currency.
- Bids are sealed. Lost-and-found private details, private photos and verification answers are
  visible only to the item's desk staff and admin.
- Append audit events for privileged transitions. Never delete audit, ledger or payment rows;
  correct by reversal. Places, providers and listings are hidden, never deleted.
- Check migrations in and never rewrite an applied migration.
- Uploads are images only, validated, re-encoded and stripped of metadata; private media is served
  only through an authorised endpoint.
- Notifications are in-app only. Sign-in is built last; until then the seeded-account switcher is
  allowed only when `DEMO_AUTH_ENABLED=true` outside production, and guards and scopes are enforced
  exactly as they will be after sign-in.
- Keep secrets, real personal data and payment credentials out of logs, fixtures and seeds.
- UI work follows [docs/design.md](docs/design.md): role tokens and shared components only.

## Execution expectations

Inspect relevant code and docs; identify affected requirements; implement the complete cohesive
change, including migrations, contracts, API, UI, tests and docs when needed. Add or update tests for
validation, permissions, inventory, money and state transitions. Run the checks that actually exist
and report the commands and real results, including assumptions and gaps.

Do not invent public policy or authority. Escalate only when a missing decision changes legal
authority, real money (including enabling a live payment adapter), privacy obligations, government
participation or a new country.
