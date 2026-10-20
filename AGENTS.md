# Agent instructions

This file contains rules that apply to every change. Read it plus only the project artifact(s)
relevant to the assigned task; [README.md](README.md) maps work areas to docs.

## Current state

The repository is a directory skeleton plus documentation. There is no package manifest,
application code, dependency install or working command yet. Do not assume a script, framework
configuration or database exists. When a task asks for documentation or structure only, do not add
application code.

## Read first

1. This file.
2. The work-area table in [README.md](README.md).
3. The matching guide under `docs/`.
4. The relevant code, schema and tests.

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

- Proposal-stage demonstrator only. No official government service/endorsement, legally
  authoritative tariffs, binding procurement/contract, or real monetary transaction.
- Mark internal approvals, indicative prices, mock payments, prototype revenue and dues as
  demo/simulated wherever shown, including exports.
- Validate every boundary with shared contracts. Never trust client price, role, provider ID or
  derived values.
- Store money as integer minor units plus an ISO currency. Store timestamps in UTC and present
  Asia/Dhaka where relevant.
- Protect inventory and ledger invariants with database transactions and constraints. Snapshot
  names, tariff versions, prices and cancellation policy on bookings.
- Append audit events for privileged transitions. Never delete audit or ledger rows; correct by
  reversal.
- Check migrations in and never rewrite an applied migration.
- Keep secrets, real personal data and payment credentials out of logs, fixtures and the demo.
- MVP has no file uploads, notifications or real map/payment/government integration. Listing images
  use seeded or remote URLs.

## Execution expectations

Inspect relevant code and docs; identify affected requirements; implement the complete cohesive
change, including migrations, contracts, API, UI, tests and docs when needed. Add or update tests for
validation, permissions, inventory, ledger and state transitions. Run the checks that actually
exist and report the commands and real results, including assumptions and gaps.

Do not invent public policy or authority. Escalate only when a missing decision changes legal
authority, real money, privacy obligations, government participation or pilot geography.
