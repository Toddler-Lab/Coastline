# Smart Cox’s Bazar

Proposal-stage demonstrator for discovering, booking and governing beach tourism services along the
central Cox’s Bazar coast.

> **Proposal demo — not an official government service.** Tariffs, payments, revenue, procurement,
> contracts, awards and internal approvals are simulated. No money is collected or owed, and no
> government endorsement or legal authority is implied.

## Status

The repository currently contains the directory skeleton and documentation only. There is no
package manifest, application code, database migration, dependency installation or working command
yet. Do not assume scripts exist until the scaffold is added.

## Planned stack

- TypeScript modular monolith.
- Web: Next.js App Router, React and Tailwind CSS in `apps/web`.
- API: Node.js 22 + NestJS using the default Express adapter in `apps/api`.
- Database: PostgreSQL 16+ with Prisma migrations in `packages/db`.
- Contracts: shared request/response types and enums in `packages/api-contracts`.
- API contract: REST `/api/v1` with OpenAPI generated from NestJS DTOs.
- Tests: Vitest for unit, API and PostgreSQL integration tests; Playwright for browser journeys.
- Workspace: pnpm workspaces. Turborepo is not used.
- Local infrastructure: Docker Compose PostgreSQL in `infra/compose.yaml` (to be added with the
  scaffold).

The browser calls Next.js and the REST API; it never connects to PostgreSQL. Hosting, database
vendor, map vendor and the authoritative pilot polygon remain undecided.

## Repository layout

```text
.
├── .github/workflows/              # CI workflows (empty)
├── apps/
│   ├── web/
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       └── hooks/
│   └── api/
│       └── src/
│           ├── common/
│           └── modules/
│               ├── identity/
│               ├── providers/
│               ├── catalogue/
│               ├── moderation/
│               ├── tariffs/
│               ├── inventory/
│               ├── bookings/
│               ├── procurement/
│               ├── contracts/
│               ├── finance/
│               ├── reporting/
│               └── audit/
├── packages/
│   ├── api-contracts/src/
│   ├── db/
│   │   ├── prisma/
│   │   └── src/
│   └── tsconfig/
├── infra/                          # Docker Compose and local infrastructure
├── docs/                           # Task-scoped project guides
├── AGENTS.md                       # Agent entry point and rules
└── README.md
```

## Documentation

Read [AGENTS.md](AGENTS.md) first, then use this task router.

| Work area | Read |
|---|---|
| Product scope, user stories, MVP boundaries | [PRD.md](docs/PRD.md) |
| System structure, stack, deployment topology | [architecture.md](docs/architecture.md), [ADR-001-stack.md](docs/ADR-001-stack.md) |
| Visual system, UX patterns, accessibility | [design.md](docs/design.md) |
| Entities, relationships, persistence constraints | [data-model.md](docs/data-model.md) |
| HTTP contract, endpoints, errors, pagination | [api.md](docs/api.md) |
| Identity, authorization, privacy, threat controls | [security.md](docs/security.md) |
| Booking, tariffs, procurement, finance transitions | [workflows.md](docs/workflows.md) |
| Test approach and quality gates | [testing.md](docs/testing.md) |
| Environments, deployment, monitoring, recovery | [operations.md](docs/operations.md) |
| Milestones, acceptance, proposal demo | [delivery-plan.md](docs/delivery-plan.md) |

## Product boundary

No formal government participation or endorsement exists. Internal platform review is not
government approval. Tariffs are illustrative and have no official or legal authority. Payments,
public revenue, procurement decisions, contracts and dues are simulated; no money is collected or
owed. The exact “dbx” vendor and pilot boundary are unconfirmed.
