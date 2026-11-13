# Agent instructions

This file contains rules that apply to every change. Read it plus only the project artifact(s)
relevant to the assigned task; [README.md](README.md) maps work areas to docs.

## Current state

The repository is a working pnpm monorepo: the web app, the API, the Prisma schema with migrations
and seeds, and tests. Sunbed booking, dining, hotels and the operations pages are implemented; the
root `package.json` lists the commands that exist. The web interface is being rebuilt to
[docs/design.md](docs/design.md), which is the target for all UI work. When a task asks for
documentation or structure only, do not add application code.

## Read first

1. This file.
2. The work-area table in [README.md](README.md).
3. The matching guide under `docs/`.
4. For redesign work, your work package in
   [docs/implementation-plan.md](docs/implementation-plan.md): it names the files, tests and
   completion test, and its ground rules apply.
5. The relevant code, schema and tests.

Do not load every guide by default. For cross-cutting work, read only the guides that intersect.

## Planned stack

- Next.js App Router, React, TypeScript and Tailwind CSS in `apps/web`.
- Node.js 22 + NestJS on its default Express adapter in `apps/api`.
- PostgreSQL 16+ with Prisma migrations in `packages/db`; reviewed SQL for inventory locks.
- Shared request/response types in `packages/api-contracts`.
- REST `/api/v1` with OpenAPI generated from NestJS DTOs.
- pnpm workspaces; no Turborepo.
- Vitest for unit/API/integration tests and Playwright for browser journeys.
- Docker Compose PostgreSQL in `infra/compose.yaml`.

The browser never connects to PostgreSQL. The API owns business rules, authorization and state
transitions.

## Invariants

- Coastline is built as a publishable product run by an independent operator. Never imply
  government endorsement, legally authoritative tariffs, police or regulator verification, or
  binding procurement/contracts. The independence statement lives in the footer and on `/about`.
- No user-facing surface (pages, toasts, emails, exports, metadata) uses the words demo, mock,
  fake, simulated, sandbox, prototype, proposal or persona. The full list and replacements are in
  [docs/design.md](docs/design.md) section 12. The one exception: finance views and exports show
  each record's payment provider as a data field, so unsettled records are not read as collected
  money.
- Payments go through the payment-provider port. The only adapter today is the sandbox adapter: it
  approves and refunds without moving money, and it must behave and read exactly like a live
  provider. While it is active, never render or accept card numbers, CVVs, wallet PINs or one-time
  codes. A live gateway adapter is a separate, reviewed change.
- Validate every boundary with shared contracts. Never trust client price, role, provider ID or
  derived values.
- Store money as integer minor units plus an ISO currency. Store timestamps in UTC and present
  Asia/Dhaka where relevant.
- Protect inventory and ledger invariants with database transactions and constraints. Snapshot
  names, tariff versions, prices and cancellation policy on bookings.
- Append audit events for privileged transitions. Never delete audit or ledger rows; correct by
  reversal.
- Check migrations in and never rewrite an applied migration.
- Keep secrets, real personal data and payment credentials out of logs, fixtures and seeds.
- There are no file uploads, notifications or live payment-gateway/government integrations yet.
  Listing images use seeded or remote URLs.
- UI work follows [docs/design.md](docs/design.md): role-named design tokens only, Material window
  size classes, and the same route, token and component names as the planned Android (Kotlin,
  Compose) app.

## Execution expectations

Inspect relevant code and docs; identify affected requirements; implement the complete cohesive
change, including migrations, contracts, API, UI, tests and docs when needed. Add or update tests for
validation, permissions, inventory, ledger and state transitions. Run the checks that actually
exist and report the commands and real results, including assumptions and gaps.

Do not invent public policy or authority. Escalate only when a missing decision changes legal
authority, real money (including enabling a live payment adapter), privacy obligations, government
participation or pilot geography.
