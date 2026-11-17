# System Architecture

**Style:** TypeScript modular monolith · **Status:** v2 target

## 1. Context

Browsers use the Next.js web app, which calls the NestJS REST API. The API owns business rules,
authorization and state transitions. PostgreSQL is the source of truth; the browser never reaches
it. Images go to object storage through the API. External dependencies are behind ports with a
local adapter so the system runs fully offline in development:

| Port | Adapter today | Later |
|---|---|---|
| Payments | `SANDBOX` gateway (approve or decline, no money) | Live gateway after a reviewed decision |
| File storage | Local disk under `var/uploads` | S3-compatible storage |
| Notifications | In-app inbox (`notifications` table) | SMS and email |
| Weather | None (alerts are entered by staff) | A weather data provider |
| Maps | MapLibre with open tiles | Licensed tiles if needed |

## 2. Technology

- **Web:** Next.js App Router, React, TypeScript, Tailwind CSS v4 with role tokens, Radix
  primitives, MapLibre GL for maps, SWR for client data.
- **API:** Node.js 22, NestJS on Express, `class-validator` DTOs, `@nestjs/swagger` OpenAPI.
- **Data:** PostgreSQL 16+, Prisma for schema, migrations and ordinary queries; reviewed SQL for
  `SELECT ... FOR UPDATE` and ledger checks.
- **Images:** `sharp` for validation, resizing and stripping metadata.
- **Jobs:** an in-process scheduler for hold expiry, slot generation, quote and lost-and-found
  expiry, and match scoring; each job is idempotent and works in small batches.
- **Monorepo:** pnpm workspaces; Docker Compose PostgreSQL in `infra/compose.yaml`.
- **Tests:** Vitest (unit, API, PostgreSQL integration) and Playwright (browser journeys).

See [ADR-001-stack.md](ADR-001-stack.md) and [ADR-002-multi-destination-platform.md](ADR-002-multi-destination-platform.md).

## 3. API modules

```text
apps/api/src/
  common/            auth guards (roles, provider scope, desk scope), errors, http, prisma,
                     time, idempotency, audit writer, storage port, payments port
  modules/
    places/          destinations, spots, alerts, emergency contacts
    providers/       applications, members, service types
    listings/        listings, revisions, media links, search, nearby
    inventory/       offerings, schedules, slots (generic engine)
    bookings/        generic bookings + trips aggregation across engines
    sunbeds/         existing sunbed engine (renamed from bookings + catalogue)
    hotels/          existing stay engine
    dining/          existing dining engine
    quotes/          requests, bids, counters, jobs, previews
    checkout/        checkout sessions, payments, receipts, sandbox gateway
    finance/         commission rules, ledger, payouts, reports
    help/            lost and found, claims, matching, complaints
    engagement/      conversations, messages, notifications, reviews, saved
    media/           uploads and serving
    identity/        users, seeded-account switch (sign-in last)
    admin/           overview, settings, users, audit search
    audit/
  health/
```

Each module owns its tables and invariants. Cross-module calls go through exported services, for
example `checkout` asks each engine to confirm or release a booking through a small
`BookableEngine` interface (`price`, `confirm`, `release`, `refundable`). Modules never write
another module's tables directly. No microservices, broker or Kubernetes.

The placeholder module folders from the original proposal (`procurement`, `tariffs`, `contracts`,
`moderation`, `reporting`, `providers`, `inventory`, `finance`) are removed or reused by the
modules above.

## 4. Web app structure

```text
apps/web/src/
  app/
    (visitor)/        Explore, destination, spot, lists, listing, sunbeds, photographers,
                      requests, checkout, trips, inbox, saved, help, profile
    provider/         provider workspace
    desk/             desk workspace
    admin/            admin console
  components/
    ui/               foundations (button, chip, sheet, dialog, tabs, field, ...)
    patterns/         bars, hero, cards, filter bar, gallery, booking card, ticket, ...
    features/         per feature: places, listings, sunbeds, stays, dining, quotes,
                      checkout, trips, inbox, help, provider, desk, admin
  lib/                api client, session, format, i18n, theme, features flags
```

Server components fetch public data; client components handle interaction. Each workspace has its
own layout and navigation. Old routes redirect (see [design.md](design.md) section 6.3).

## 5. Key runtime decisions

- REST under `/api/v1`; UUIDs internally; separate non-secret public references for anything a
  person reads aloud (`CXB-SB-4821`).
- UTC storage, Asia/Dhaka presentation and business rules (opening hours, cut-offs).
- Transactions for every booking, payment, refund, payout and ledger posting.
- Public catalogue responses may be cached briefly; anything personal or money-related is not.
- Health: `/health/live` (process) and `/health/ready` (database and storage).

## 6. Trade-offs

A modular monolith keeps a small team fast while module boundaries keep features separable. A
generic offering engine avoids writing one engine per new service; the three existing engines stay
because they are tested and have special rules (bed map, nights, menus). A common `Trips`
aggregation gives the visitor one timeline without merging the engines' tables.
