# ADR-001: Web-first modular monolith and PostgreSQL

- **Status:** Accepted for MVP baseline
- **Date:** 2026-10-20
- **Decision owners:** project team (revisit when hosting/vendor constraints are known)

## Context

The team has 2–4 developers and under 3 months. The product has relational governance, inventory,
booking, audit and finance data. The database provider called “dbx” is not identified. The prototype
is web first; Android may follow.

## Decision

Use TypeScript; Next.js App Router + Tailwind for web; a separate Node.js/NestJS REST API using the
default Express adapter; PostgreSQL-compatible persistence with Prisma migrations; PostGIS optional;
one modular monolith in one repository. Use standard PostgreSQL URL/protocol and avoid
provider-specific features. Generate OpenAPI from NestJS DTOs. Use pnpm workspaces and Docker Compose
for local PostgreSQL. Turborepo is not used.

## Rationale

Relational constraints and transactions fit cross-linked governance and finance. A modular monolith
keeps deployment and collaboration manageable while preserving domain boundaries. NestJS supplies
modules, guards, validation and API documentation; its default Express adapter provides a familiar
HTTP layer. Next.js/Tailwind supports rapid responsive web delivery. Vendor-neutral database access
preserves the ability to select “dbx” after clarification. pnpm workspaces are sufficient for this
small repository without another orchestration layer.

## Alternatives considered

- Document databases: weaker fit for relational integrity.
- Microservices: unnecessary deployment and coordination overhead.
- Plain Express 5 without module conventions: viable for a team that already knows it, but this
  team would have to invent and maintain module, validation, authorization and OpenAPI conventions.
- NestJS on Fastify: acceptable later, but the default Express adapter is the baseline.
- Managed-vendor-specific SDK/database features: provider unknown.
- Native Android-first: conflicts with the web-first choice.
- Turborepo: unnecessary task orchestration for this repository at MVP scale.

## Consequences

The team must maintain clear module boundaries and migration discipline. PostgreSQL remains the
system of record. Spatial behavior can use PostGIS later. Hosting, database vendor, map provider and
external integrations remain open. Any switch requires a new ADR and migration plan.

The repository uses `apps/web/src`, `apps/api/src/modules`, `packages/api-contracts`,
`packages/db/prisma`, `packages/tsconfig` and `infra/compose.yaml`.
