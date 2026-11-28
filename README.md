# Coastline

> **Tourism service platform for Bangladesh**  
> *Pick a destination and a spot, then find and book everything there: stays, food, sunbeds, rides, boats, tours, entry tickets and photographers, with help on the spot.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.2-red.svg)](https://nestjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748.svg)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18.svg)](https://vitest.dev/)

---

> [!IMPORTANT]
> **Active v2 development on branch `dev`.** Coastline is being expanded from its Cox's Bazar
> beach foundation into a full multi-destination service platform. The target is described in
> [docs/design.md](docs/design.md) and built in the order of
> [docs/implementation-plan.md](docs/implementation-plan.md) (previous `redesign/v2` and
> `design/drone-landing` branches are already merged into `dev`). Sections marked *current build*
> describe what runs today.
>
> **Payments and affiliation.** Payments use a sandbox gateway: every payment, commission and
> payout is recorded, and no money moves. Coastline is an independent platform; nothing implies
> government endorsement or official tariffs.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Target (v2)](#target-v2)
  - [Current build](#current-build)
- [Technology Stack & Monorepo Architecture](#technology-stack--monorepo-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone & Install Dependencies](#1-clone--install-dependencies)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Start PostgreSQL Database](#3-start-postgresql-database)
  - [4. Run Migrations & Seed Data](#4-run-migrations--seed-data)
  - [5. Run the Application](#5-run-the-application)
- [Application URLs & Access Points](#application-urls--access-points)
- [Demo Personas](#demo-personas)
- [Workspace Commands & Scripts](#workspace-commands--scripts)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [REST API Reference](#rest-api-reference)
- [Project Invariants & Design Principles](#project-invariants--design-principles)
- [Repository Structure](#repository-structure)
- [Documentation Index](#documentation-index)

---

## Overview

Coastline brings every service a tourist needs at a destination into one place. The operator adds
destinations (Cox's Bazar, Sylhet, Rangamati, ...) and their spots (Laboni Beach, Ratargul, Kaptai
Lake, ...) from the admin console. Service providers run their own business in a provider portal,
spot staff run a desk, and the platform earns a commission on each booking.

| Workspace | Who | What they do |
|---|---|---|
| Visitor | Tourists | Explore destinations and spot hubs, book through one checkout, keep tickets in Trips, message providers, hire photographers, get help |
| Provider | Hotels, restaurants, sunbed operators, transport, boats, tours, guides, photographers, ticketed sites | Listings, prices, availability, bookings, check-in, bids, earnings |
| Desk | Spot staff | Ticket scan, lost and found, complaints, alerts |
| Admin | Platform operator | Destinations and spots, approvals, commission, payments and payouts, audit |

---

## Key Features

### Target (v2)

- **Explore and spot hubs:** every spot shows what you can book, what is nearby (ATM, pharmacy,
  hospital, washroom, prayer room), what to know (rules, safety, best time) and where to get help.
- **One checkout and one ticket** for stays, food, sunbeds, rides, boats, tours and entry tickets.
- **Photographers:** book a package (for example 20 photos for Tk 100, or Tk 5 per photo) or post a
  request and compare sealed bids; pay a deposit, keep the photos you want, pay the balance.
- **Help:** emergency information, lost and found with verified claims and desk handover, and
  problem reports.
- **Inbox, reviews and saved items.**
- **Business model:** commission per booking, double-entry ledger, provider payouts.
- **Light and dark themes, Bangla and English, phone-first.** Sign-in is the last phase.

### Current build

What runs on `dev` today:

1. **Multi-destination Discovery & Immersive Hub Pages (`/`, `/destinations`, `/d/[destination]`, `/d/[destination]/s/[spot]`)**:
   - Full-viewport drone stage hero, interactive Bangladesh outline map, spots rail, and nested crossfading spot hubs (Cox's Bazar, Sylhet, and Rangamati seeded in PostgreSQL; Bandarban and Sundarbans appear in static showcase data in `apps/web/src/lib/drone-landing-data.ts` until seeded).
   - Cookie-backed English and Bangla toggle and light/dark/system themes.
   - Search across places and services (`/search`) and saved wishlist (`/saved`).
   - Top-level service directories (`/stays`, `/dining`, `/sunbeds`, `/photographers`) alongside destination-scoped lists (`/d/[destination]/[service]`).

2. **Interactive 2D Sunbed Map Picker (`/sunbeds`, `/sunbeds/[beachPoint]`)**:
   - Built on [MapLibre GL](https://maplibre.org/) with multi-layer satellite imagery, bathymetry styling, and an accessible bed list below the map.
   - Six Cox's Bazar beach points (`SUG`, `KOL`, `LAB`, `HIM`, `INA`, `TEK`) with 1–4 hour slots, minor-unit pricing, and PostgreSQL row/slot locking against double booking.

3. **Stays (`/stays`, `/l/hotel-[slug]`) & Dining (`/dining`, `/l/dining-[code]`)**:
   - Hotel discovery, room-type availability, and night-level locking (`hotel_room_nights`).
   - Dining venues with hourly table reservations (`1–3` hours, optional deposit, `table_slots` locking) and food delivery to an active booked sunbed (`Placed -> Preparing -> Ready -> Delivered`).

4. **Shared Checkout Quote, Trips & Digital QR Tickets (`/checkout/[draft]`, `/trips`, `/trips/[ref]`)**:
   - Server-verified price quotes via `POST /api/v1/checkout/quote` and sandbox payment selection (`BKASH`, `NAGAD`, `CARD` via `SANDBOX` adapter).
   - Unified Trips timeline and HMAC-signed QR tickets across sunbeds, stays, table reservations, and food orders.

5. **Role-Scoped Workspaces (`/provider`, `/desk`, `/admin`)**:
   - **Provider (`/provider`)**: Today summary, dining reservations, kitchen order board, and venue/menu editing scoped by `provider_members`.
   - **Desk (`/desk`)**: Ticket QR/reference lookup (`POST /api/v1/desk/lookup`), arrivals list, and check-in scoped by `desk_assignments`.
   - **Admin (`/admin`)**: Overview, read-only destinations view, and bookings management (`Soon` pages mark unbuilt portals such as provider onboarding, payouts, lost-and-found, complaints, and audit search).

6. **Photographers Preview (`/photographers`)**:
   - Interactive client-side marketplace preview using sample data (`apps/web/src/components/photographers/demo-data.ts`); backend bidding and settlement APIs are planned in `WP-26` to `WP-28`.

---

## Technology Stack & Monorepo Architecture

Coastline is structured as a clean TypeScript modular monorepo using **pnpm workspaces** (no Turborepo required):

```text
Coastline/
├── apps/
│   ├── web/                     # Next.js 16 (App Router), React 19, Tailwind CSS v4, MapLibre GL
│   └── api/                     # NestJS 11 + Express, Class-Validator, Swagger OpenAPI
├── packages/
│   ├── api-contracts/           # Shared TypeScript request/response DTOs, enums, and types
│   ├── db/                      # PostgreSQL 16+ Prisma schema, migrations, and seed scripts
│   └── tsconfig/                # Base, NestJS, and Library tsconfig definitions
├── infra/
│   └── compose.yaml             # Docker Compose for PostgreSQL 16
├── docs/                        # Specifications, PRD, and architecture documentation
├── .vscode/                     # IDE settings (Tailwind CSS v4 lint rules)
└── AGENTS.md                    # Core engineering rules and domain invariants
```

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | Next.js 16.4, React 19, Tailwind CSS v4, Lucide Icons | Responsive modern UI, server-side data fetching, client state |
| **Mapping Engine** | MapLibre GL 6.x | High-performance WebGL 2D satellite and shoreline mapping |
| **Backend API** | NestJS 11.2, Node.js 22–24, Express | Business logic, authentication guards, orders API, OpenAPI docs |
| **Database & ORM** | PostgreSQL 16+, Prisma ORM 6.19 | ACID transactions, inventory slot locking, audit logs |
| **Contracts** | TypeScript 5.9 | Shared end-to-end type safety between client and server |
| **Testing** | Vitest 3.2, Supertest | Unit testing, NestJS controllers/services, DB integration tests |

---

## Prerequisites

Before running the application, ensure you have the following installed:
- **Node.js**: `v24.11.1` for this project (see `.nvmrc`; Node 22–24 is supported)
- **pnpm**: `v9.0.0` or higher (`corepack enable pnpm` or `npm i -g pnpm`)
- **Docker & Docker Compose**: (Recommended for running PostgreSQL locally) or an existing PostgreSQL 16+ instance.

---

## Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Toddler-Lab/Coastline.git
cd Coastline
nvm use  # reads .nvmrc; run nvm install first if the version is not installed

# Install all workspace dependencies
pnpm install
```

If you use `nvm`, run `nvm use` from the repository root before `pnpm dev` too. This selects
the version in `.nvmrc` for the current shell only; your global Node default stays as-is.
The API uses port 3001 and the web dev script uses port 3000 even when your shell exports `PORT=3001`.

### 2. Configure Environment Variables

Create your local `.env` file by copying the example:

```bash
cp .env.example .env
```

The default values in `.env.example` work out of the box for local development:
```env
NODE_ENV=development
APP_ENV=local
PORT=3001
WEB_ORIGIN=http://localhost:3000
API_INTERNAL_URL=http://127.0.0.1:3001
CORS_ORIGINS=http://localhost:3000
DEMO_AUTH_ENABLED=true
DATABASE_URL=postgresql://coastline_app:dev_0bac4f806eae423aa5869ebf7c2f2c927f08cb5d@127.0.0.1:5432/coastline_dev?schema=public
TEST_DATABASE_URL=postgresql://coastline_app:dev_0bac4f806eae423aa5869ebf7c2f2c927f08cb5d@127.0.0.1:5432/coastline_test?schema=public
```

### 3. Start PostgreSQL Database (Docker)

The project database runs in Docker, so everyone gets the same PostgreSQL 16 setup. Docker Desktop
must be running. One command starts it and makes sure both databases exist (`coastline_dev` and
`coastline_test`):

```bash
pnpm db:up
```

> **Port 5432 already in use?** A native PostgreSQL install often uses 5432. Add
> `POSTGRES_PORT=5433` to your `.env` and use `5433` in `DATABASE_URL` and `TEST_DATABASE_URL`;
> `pnpm db:up` publishes the container on that port. Do not stop or change your native PostgreSQL.

Other database commands: `pnpm db:down` stops the container (data is kept in a Docker volume),
`pnpm db:setup` starts it, applies migrations and seeds demo data in one go.

> **After every `git pull`:** run `pnpm install` and `pnpm db:migrate`. New migrations and
> dependencies are the usual reason a fresh pull does not start. Also compare your `.env` with
> `.env.example`: new settings are added there, and `.env` is not committed.

### 4. Run Migrations & Seed Data

Deploy the Prisma migrations and seed the 6 beach points, sunbeds, and initial demo bookings:

```bash
# Apply schema migrations
pnpm db:migrate

# Seed beach points, sunbeds, tariffs, and demo orders
pnpm db:seed
```

### 5. Run the Application

Start both the backend API and frontend web application concurrently:

```bash
pnpm dev
```

Or run them in separate terminals if preferred:
```bash
# Terminal 1: Backend API (port 3001)
pnpm dev:api

# Terminal 2: Frontend Web (port 3000)
pnpm dev:web
```

---

## Application URLs & Access Points

Once started, the following services are available:

| Service | URL | Description |
|---|---|---|
| **Explore** | [http://localhost:3000](http://localhost:3000) | Drone stage hero, Bangladesh map, spots rail, service overview, help |
| **Top-level discovery** | `/destinations`, `/stays`, `/dining`, `/sunbeds`, `/photographers` | Cross-destination directories and interactive photographer marketplace preview |
| **Destination & spots** | [/d/coxs-bazar](http://localhost:3000/d/coxs-bazar) | Destination hub; spot hubs at `/d/coxs-bazar/s/<spot>` |
| **Sunbed picker** | [/sunbeds/kol](http://localhost:3000/sunbeds/kol) | Beach chips, time controls, map, accessible bed list |
| **Listing & booking** | `/l/<listing>`, `/l/<listing>/book` | Stays, tables and food to your sunbed, then `/checkout/<draft>` |
| **Trips & Saved** | [/trips](http://localhost:3000/trips), [/saved](http://localhost:3000/saved) | Bookings with QR tickets and receipts; saved places and listings |
| **Provider portal** | [/provider](http://localhost:3000/provider) | Today, table bookings, kitchen, venue and menu editor (provider-scoped) |
| **Desk** | [/desk](http://localhost:3000/desk) | Scan or type a reference, check in; arrivals by day (desk-scoped) |
| **Admin console** | [/admin](http://localhost:3000/admin) | Overview, destinations and spots (read-only), all bookings |
| **REST API Base** | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) | Backend REST API endpoints |
| **Swagger / OpenAPI** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Interactive API documentation and test harness |
| **API Health Checks** | [http://localhost:3001/api/v1/health/live](http://localhost:3001/api/v1/health/live) | Kubernetes/Docker liveness & readiness probes |

Legacy routes (`/hotels`, `/food`, `/bookings`, `/rides`, `/activities`, `/admin/dining`, `/admin/points`, ...) redirect permanently to their v2 equivalents in `apps/web/next.config.ts`.

---

## Demo Personas

Seeded accounts are picked from the account switcher while `DEMO_AUTH_ENABLED=true`
(local only; real sign-in is `WP-32` at the end of the plan):

1. **Rafiq Hasan, Nusrat Jahan, Tanvir Ahmed (`TOURIST`)** (`rafiq@coastline.demo`, `nusrat@coastline.demo`, `tanvir@coastline.demo`):
   - Domestic tourist personas for testing bookings, concurrency, Trips QR tickets, and saved items.
2. **Karim Uddin (`PROVIDER`, `OWNER`) & Shila Akter (`PROVIDER`, `STAFF`)** (`karim@coastline.demo`, `shila@coastline.demo`):
   - Members of seeded provider **Sea Breeze Dining** (`SUG-SEAFOOD`, `KOL-KITKOT`) for testing `/provider` reservations, kitchen board, and menu edits.
3. **Rana Desk (`DESK`)** (`rana@coastline.demo`):
   - Desk staff assigned to Cox's Bazar for testing `/desk` QR/reference lookup, arrivals, and check-ins.
4. **Coastline Admin (`ADMIN`)** (`admin@coastline.demo`):
   - Platform operator with access to `/admin`, `/desk`, and `/provider`.

---

## Workspace Commands & Scripts

Run these from the repository root:

| Command | Description |
|---|---|
| `pnpm dev` | Starts API and Web development servers in parallel |
| `pnpm dev:api` | Starts only the NestJS API server on port 3001 with hot reload |
| `pnpm dev:web` | Starts only the Next.js Web server on port 3000 |
| `pnpm build` | Compiles all packages and applications for production |
| `pnpm typecheck` | Runs `tsc --noEmit` across all 5 workspace projects |
| `pnpm test` | Runs the full Vitest unit and integration test suite |
| `pnpm format` | Formats all files across the repository with Prettier |
| `pnpm format:check`| Checks formatting compliance across all files |
| `pnpm db:up` | Starts the Docker PostgreSQL and creates the dev and test databases |
| `pnpm db:down` | Stops the Docker PostgreSQL (data is kept) |
| `pnpm db:setup` | `db:up` + migrations + seed in one command |
| `pnpm db:generate` | Generates the Prisma Client |
| `pnpm db:validate` | Validates the Prisma schema |
| `pnpm db:migrate` | Runs database migrations (`prisma migrate deploy`) |
| `pnpm db:migrate:dev` | Creates/applies a development migration (`prisma migrate dev`) |
| `pnpm db:seed` | Populates database with destinations, spots, beach points, sunbeds, hotels, dining, and demo orders |
| `pnpm db:reset` | Resets the database and reapplies seeds from scratch |

---

## Testing & Quality Assurance

The repository enforces strict type-safety and automated test coverage across services, controllers, guards, and business logic:

```bash
# Run all tests
pnpm test

# Run tests in watch mode for the API
pnpm --filter @coastline/api test:watch

# Validate TypeScript across all projects
pnpm typecheck
```

Current test suite coverage includes:
- **`OrdersService`**: Inventory validation, slot booking, double-booking prevention, cancellation rules, check-in validation.
- **`OrdersController` & `AdminOrdersController`**: Tourist and admin HTTP boundaries, persona authentication, DTO validation.
- **`CatalogueService` & `CatalogueController`**: Beach point geodata, availability queries, sunbed state serialization.
- **`IdentityController`**: Demo persona switching and session persistence.
- **`Guards & Filters`**: Role-based access control, demo auth headers, global exception normalization.

---

## REST API Reference

The API is fully documented with OpenAPI/Swagger at [http://localhost:3001/api/docs](http://localhost:3001/api/docs). Key endpoints:

### Public Places, Catalogue & Availability
- `GET /api/v1/destinations`, `GET /api/v1/destinations/:destination`, `GET /api/v1/destinations/:destination/spots/:spot` — Active destinations, spots, alerts, and emergency contacts.
- `GET /api/v1/beach-points?date=&destination=` — List shoreline beach points with live free-bed counts.
- `GET /api/v1/beach-points/:code?date=` — Hourly slot matrix and live sunbed availability for a beach point.
- `GET /api/v1/hotels?destination=&spot=...`, `GET /api/v1/hotels/:slug` — Hotel listings and room types.

### Orders, Checkout & Saved Items
- `POST /api/v1/checkout/quote` — Server-side price quote before payment (`sunbed`, `stay`, `table`, `food`).
- `GET /api/v1/payments/methods` — Supported sandbox checkout methods (`BKASH`, `NAGAD`, `CARD`).
- `POST /api/v1/orders`, `GET /api/v1/orders`, `GET /api/v1/orders/me`, `GET /api/v1/orders/:ref`, `POST /api/v1/orders/:ref/cancel` — Sunbed bookings and tickets.
- `POST /api/v1/hotels/bookings` — Room stay bookings.
- `GET /api/v1/saved`, `POST /api/v1/saved`, `DELETE /api/v1/saved` — Saved hotels, dining venues, and spots.

### Dining
- `GET /api/v1/dining/venues` and `GET /api/v1/dining/venues/:code` — Venue directory and venue menu.
- `GET /api/v1/dining/venues/:code/availability?date=` — Hourly table availability for a Dhaka date.
- `POST /api/v1/dining/reservations`, `GET /api/v1/dining/reservations/me`, `GET /api/v1/dining/reservations/:ref`, `POST /api/v1/dining/reservations/:ref/cancel` — Table reservations.
- `GET /api/v1/dining/delivery/beds`, `POST /api/v1/dining/food-orders`, `GET /api/v1/dining/food-orders/me`, `GET /api/v1/dining/food-orders/:ref`, `POST /api/v1/dining/food-orders/:ref/cancel` — Food delivery to a booked sunbed.

### Provider, Desk & Administration
- `/api/v1/provider/*` — Provider-scoped `today`, venues/menu edits, reservations check-in/cancel, and kitchen food orders.
- `/api/v1/desk/*` — Desk-scoped `arrivals`, `lookup`, and `bookings/:ref/check-in`.
- `/api/v1/admin/*` — Admin overview, beach-points, orders, ticket validation, and `/api/v1/admin/dining/*`. Full list in [docs/api.md](docs/api.md).

### Identity & Health
- `GET /api/v1/session` — Current actor profile and provider/desk workspace scopes.
- `GET /api/v1/demo/users` — List available seeded demo personas (when `DEMO_AUTH_ENABLED=true`).
- `GET /api/v1/health/live` & `GET /api/v1/health/ready` — Application and database liveness probes.

---

## Project Invariants & Design Principles

As codified in [AGENTS.md](AGENTS.md):
- **Monetary Values**: All money is represented strictly as integer minor units (`BDT 50.00` = `5000` Paisa) paired with ISO currency `BDT`. Floating-point currency math is prohibited.
- **Timezone Invariance**: All database timestamps and API dates are stored strictly in UTC and presented in Bangladesh Standard Time (`Asia/Dhaka`, UTC+6).
- **Concurrency & Double-Booking Protection**: All inventory slot reservations execute inside serializable or locked PostgreSQL transactions. Overlapping booking slots for the same bed are rejected with HTTP `409 Conflict`.
- **Audit Logging**: Privilege transitions (e.g. check-ins, cancellations) write immutable append-only audit log entries.
- **Privacy & Security**: Demo personas use synthetic fixtures. No real credit card credentials, payment tokens, or personally identifiable information (PII) are stored or logged.

---

## Repository Structure

```text
.
├── .vscode/                     # Editor settings (Tailwind v4 lint suppression)
├── apps/
│   ├── web/                     # Next.js 16 Web Application
│   │   ├── public/              # Static assets, map markers, media, worker scripts
│   │   └── src/
│   │       ├── app/             # App Router: (visitor), provider, desk, admin
│   │       ├── components/      # ui, patterns, landing, flows, trips, photographers, workspace, map
│   │       └── lib/             # API client, session, places, checkout, i18n, theme, format helpers
│   └── api/                     # NestJS 11 REST API
│       ├── src/
│       │   ├── common/          # Auth guards, exceptions, idempotency, time helpers, Prisma module
│       │   ├── config/          # Environment configuration & validation
│       │   ├── health/          # Health check controllers
│       │   └── modules/         # audit, bookings, catalogue, checkout, dining, hotels, identity, payments, places, saved, workspaces
│       └── test/                # Test environment & global test setup
├── packages/
│   ├── api-contracts/           # Shared DTOs, interfaces, and API types
│   ├── db/                      # Prisma schema, migrations, and deterministic seed script
│   └── tsconfig/                # Shared base TypeScript configurations
├── infra/
│   └── compose.yaml             # Docker Compose PostgreSQL service
├── docs/                        # Specifications, PRD, and architecture documentation
├── AGENTS.md                    # Core engineering rules and domain invariants
├── package.json                 # Monorepo root scripts & pnpm configuration
└── pnpm-workspace.yaml          # pnpm workspace definition
```

---

## Documentation Index

| Work area | Read |
|---|---|
| Any change | [AGENTS.md](AGENTS.md), then your work package in [docs/implementation-plan.md](docs/implementation-plan.md) |
| Product scope and services | [docs/PRD.md](docs/PRD.md) |
| UI, layout, navigation, pages | [docs/design.md](docs/design.md) |
| Database and migrations | [docs/data-model.md](docs/data-model.md) |
| Endpoints | [docs/api.md](docs/api.md) |
| Booking, photographers, payments, lost and found, complaints | [docs/workflows.md](docs/workflows.md) |
| Photographers & rides marketplaces | [docs/photographers.md](docs/photographers.md), [docs/rides.md](docs/rides.md) |
| Roles, scopes, uploads, privacy | [docs/security.md](docs/security.md) |
| Modules and structure | [docs/architecture.md](docs/architecture.md), [ADR-001](docs/ADR-001-stack.md), [ADR-002](docs/ADR-002-multi-destination-platform.md) |
| Tests | [docs/testing.md](docs/testing.md) |
| Configuration and deployment | [docs/operations.md](docs/operations.md) |
| Milestones | [docs/delivery-plan.md](docs/delivery-plan.md) |

---

## License

All rights reserved.
