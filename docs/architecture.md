# System Architecture

**Status:** baseline · **Style:** TypeScript modular monolith

## 1. Context and system boundary

Browser clients use Next.js, which calls a separate REST API. The API owns domain rules,
authorization and transitions. PostgreSQL is the source of truth. There is no browser-to-database
path. No external payment, government, messaging or map dependency is required for MVP.

## 2. Technology decisions

- **Web:** Next.js App Router, React, TypeScript and Tailwind CSS.
- **API:** Node.js 22 LTS and NestJS using its default Express adapter. One modular API, not
  services or microservices.
- **Database:** PostgreSQL 16+ using a standard `DATABASE_URL`; no provider-specific features while
  “dbx” is unconfirmed.
- **Data access:** Prisma for schema, migrations and ordinary queries. Use transactions for
  multi-step writes and reviewed SQL for `SELECT ... FOR UPDATE` inventory locking.
- **Contracts:** shared types and enums in `packages/api-contracts`; NestJS DTOs with
  `class-validator`; OpenAPI generated with `@nestjs/swagger`.
- **Local:** pnpm workspaces and Docker Compose PostgreSQL in `infra/compose.yaml`. Turborepo is not
  used.
- **Tests:** Vitest for unit, API and PostgreSQL integration tests; Playwright for core browser
  journeys.
- **CI:** format, lint, typecheck, Prisma validation, tests, build and migration validation.

NestJS is selected for modules, guards, validation, dependency injection and API documentation.
The Express adapter supplies the HTTP layer without requiring a separate application structure.
See [ADR-001-stack.md](ADR-001-stack.md).

## 3. Container/component view

- **Web app:** public discovery, visitor account, provider portal and admin portal.
- **API app:** REST controllers, guards, application services, domain modules and persistence
  adapters.
- **Database:** relational records, workflow history, inventory, audit and finance ledger.
- **Optional later:** licensed map tiles, email/SMS, real payment integration only after separate
  authorization and design.

## 4. Module decomposition

Identity; providers; catalogue; moderation; tariffs; inventory; bookings; procurement; contracts;
finance; reporting; audit; shared/common. Each module owns its invariants and data access.
Cross-module calls use explicit application-service interfaces; avoid circular dependencies.

Do not introduce microservices, an event broker or Kubernetes in MVP.

## 5. Repository shape

```text
apps/web/src/app/(public|account|provider|admin)
apps/web/src/components
apps/web/src/hooks
apps/web/public
apps/api/src/common
apps/api/src/modules/{identity,providers,catalogue,moderation,tariffs,inventory,
                     bookings,procurement,contracts,finance,reporting,audit}
packages/api-contracts/src
packages/db/prisma
packages/db/src
packages/tsconfig
infra/compose.yaml
```

`apps/api/src/routes` and `apps/api/src/middleware` are not used. NestJS controllers and guards live
inside domain modules; cross-cutting middleware lives in `common`.

## 6. Key runtime decisions

REST `/api/v1`, JSON; UUID internal identifiers plus separate public references; UTC database
timestamps and Asia/Dhaka presentation; standard `DATABASE_URL`. “dbx” is unconfirmed: no vendor SDK
or proprietary feature. Use transactions for bookings and ledger posting. Cache only safe public
catalogue data. Hosting and managed database vendor selection are deferred.

The API exposes `/health/live` and `/health/ready` outside the versioned business API. OpenAPI is
generated from DTOs and must match implemented routes.

## 7. Quality attributes and trade-offs

Prioritize maintainability and transactional correctness over early scale. A small team gets clear
module ownership without distributed-system overhead. PostgreSQL constraints enforce relational and
financial integrity. PostGIS is optional to avoid blocking while boundary data and provider are
unresolved. The API remains authoritative even when web uses server components.

## 8. Architecture decision records

Record later changes under `ADR-NNN-title.md` with context, decision, alternatives, consequences and
date. Existing stack rationale is [ADR-001-stack.md](ADR-001-stack.md).
