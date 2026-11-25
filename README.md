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
> **Redesign in progress (branch `redesign/v2`).** Coastline is being rebuilt from a Cox's Bazar
> beach product into a multi-destination service platform. The target is described in
> [docs/design.md](docs/design.md) and built in the order of
> [docs/implementation-plan.md](docs/implementation-plan.md). Sections marked *current build*
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

What runs on `dev` today, before the redesign:

1. **Interactive 2D Shoreline Map**:
   - Built on [MapLibre GL](https://maplibre.org/) with multi-layer high-resolution satellite imagery and customized nautical bathymetry styling.
   - Smooth camera bounding box clamped to the Cox’s Bazar district coastal corridor (`91.85°E` to `92.40°E`, `20.80°N` to `21.55°N`).
   - Accurately geolocated beach points anchored on the real sandy shoreline:
     - **Laboni Beach (`LAB`)**: `21.4312° N, 91.9702° E`
     - **Sugandha Beach (`SUG`)**: `21.4231° N, 91.9734° E`
     - **Kolatoli Beach (`KOL`)**: `21.4149° N, 91.9781° E`
     - **Himchari Beach (`HIM`)**: `21.3538° N, 92.0195° E`
     - **Inani Coral Beach (`INA`)**: `21.2291° N, 92.0531° E`
     - **Teknaf Beach (`TEK`)**: `20.8712° N, 92.2984° E`
   - Single-click beach rail selector that smoothly pans the map and focuses directly on the sunbed row for that beach point.

2. **Single-Line Sunbed Shoreline Layout**:
   - Sunbeds are arranged along the natural coastal shoreline bearing ($\approx 138^\circ - 165^\circ$) facing the sea rather than a disconnected inland grid.
   - Distinct umbrella pairings with numbered identification markers (e.g. `KOL-001`, `KOL-002`).

3. **Complete Sunbed Booking Engine**:
   - **Real-Time Slot Engine**: Color-coded sunbed states:
     - 🟢 **Available / Free**: Open for reservation.
     - 🟡 **Selected / Pending**: Added to current reservation basket.
     - 🔴 **Booked / Occupied**: Double-booking prevented via database row locks and slot constraints.
     - ⚪ **Past / Inactive**: Out-of-window slots.
   - **Flexible Duration**: 1 to 4 hour booking blocks with instant minor-unit price computation (e.g. `BDT 50.00 / hr`).
   - **Simulated Checkout**: Choice of demo mobile wallets (bKash, Nagad) or cards. Instant transaction confirmation without real money processing.
   - **Double-Booking Protection**: PostgreSQL transactional isolation prevents race conditions and overlapping slot holds.

4. **Digital QR Tickets & My Bookings**:
   - View past and upcoming reservations at `/bookings`.
   - Dynamic QR code ticket generated for each confirmed order containing verified reference code, slot window, beach point, and HMAC signature.
   - One-click order cancellation with automated inventory release before session commencement.

5. **Desk Check-in & Administration**:
   - Attendant check-in console at `/admin/bookings` with camera-based QR scanner or manual reference lookup.
   - Real-time check-in status transitions (`CONFIRMED` $\rightarrow$ `CHECKED_IN`).
   - Beach point configuration and status dashboard at `/admin/points`.
   - Seamless Persona Switcher in the top navigation to instantly toggle between Tourist and Admin roles.

6. **Food & Beach Dining (`/food`)** — demo, all money simulated:
   - Venue discovery with filters (venue type, beach point, "reserve a table", "delivers to your sunbed") and venue pages with menus at `/food/[code]`.
   - Hourly table reservations (1–3 hours, up to 7 days ahead) with a demo deposit, race-safe table-hour locking, a QR ticket and cancellation until 60 minutes before the start.
   - Food delivery to a sunbed the tourist has currently booked at the same beach point, with server-side pricing, order tracking (`Placed → Preparing → Ready → Delivered`) and cancellation while still placed.
   - Reservations and food orders appear on `/bookings`.
   - Operations desk at `/admin/dining`: overview, venue and menu editing, reservation check-in and a kitchen queue.

7. **Hotels (`/hotels`)**: hotel list, hotel pages and room booking. Rides (`/rides`) and water
   sports (`/activities`) are placeholder pages; in v2 they become bookable services.

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
| **Mapping Engine** | MapLibre GL 5.x | High-performance WebGL 2D satellite and shoreline mapping |
| **Backend API** | NestJS 11.2, Node.js 22, Express | Business logic, authentication guards, orders API, OpenAPI docs |
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
| **Explore** | [http://localhost:3000](http://localhost:3000) | Search, destination, service tiles, spots, stays and food |
| **Destination and spots** | [/d/coxs-bazar](http://localhost:3000/d/coxs-bazar) | Destination hub; spot hubs at `/d/coxs-bazar/s/<spot>` |
| **Sunbed picker** | [/sunbeds/kol](http://localhost:3000/sunbeds/kol) | Beach chips, time controls, map, accessible bed list |
| **Listing and booking** | `/l/<listing>`, `/l/<listing>/book` | Stays, tables and food to your sunbed, then `/checkout/<draft>` |
| **Trips** | [/trips](http://localhost:3000/trips) | Every booking with its QR ticket, receipt and cancellation |
| **Provider portal** | [/provider](http://localhost:3000/provider) | Today, table bookings, kitchen, listing and menu editor (operator account for now) |
| **Desk** | [/desk](http://localhost:3000/desk) | Scan or type a reference, check in; arrivals by day |
| **Admin console** | [/admin](http://localhost:3000/admin) | Overview, destinations and spots, all bookings |

Old routes (`/hotels`, `/food`, `/bookings`, `/admin/dining`, `/admin/points`, ...) redirect permanently to
their v2 equivalents.
| **REST API Base** | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) | Backend REST API endpoints |
| **Swagger / OpenAPI** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Interactive API documentation and test harness |
| **API Health Checks** | [http://localhost:3001/api/v1/health/live](http://localhost:3001/api/v1/health/live) | Kubernetes/Docker liveness & readiness probes |

---

## Demo Personas

Seeded accounts are picked from the switcher in the top header while `DEMO_AUTH_ENABLED=true`
(local only; real sign-in is the last phase of the redesign, and v2 adds seeded provider and desk
accounts). Current build:

1. **Rahim Ahmed (`TOURIST`)**:
   - Regular domestic tourist visiting Cox's Bazar.
   - Used to make demo reservations, test slot selections, and view personal QR tickets in `/bookings`.
2. **Fatima Begum (`TOURIST`)**:
   - Secondary tourist profile for testing concurrency, multi-user bookings, and distinct ticket archives.
3. **Admin User (`ADMIN`)**:
   - Coastline operations officer.
   - Access to `/admin` dashboard, desk check-in ticket validation (`/admin/bookings`), and beach point management (`/admin/points`).

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
| `pnpm db:migrate` | Runs database migrations |
| `pnpm db:seed` | Populates database with beach points, sunbeds, and demo orders |
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

### Public Catalogue & Availability
- `GET /api/v1/catalogue/points` — List all 6 verified shoreline beach points with coordinates and capacity.
- `GET /api/v1/catalogue/points/:code` — Get details and sunbeds for a specific beach point.
- `GET /api/v1/catalogue/availability?beachPointCode=KOL&date=2026-11-10` — Hourly slot matrix and live status for all sunbeds at a point.

### Orders & Sunbed Booking
- `POST /api/v1/orders` — Create a new sunbed booking (requires `sunbedId`, `date`, `startHour`, `durationHours`, `paymentMethod`).
- `GET /api/v1/orders/me` — List upcoming and past bookings for the current tourist persona.
- `GET /api/v1/orders/:orderRef` — Retrieve details, status, and QR ticket for a booking.
- `POST /api/v1/orders/:orderRef/cancel` — Cancel an upcoming reservation and release the inventory slot.

### Desk Check-in & Administration
- `GET /api/v1/admin/orders` — Filter all bookings by date, beach point, status, or search query.
- `POST /api/v1/admin/orders/:orderRef/check-in` — Manual attendant check-in for an arriving tourist.
- `POST /api/v1/admin/tickets/validate` — Validate a scanned QR ticket code and verify cryptographic signature.
- `GET /api/v1/admin/overview` — Operational summary metrics (total bookings, active check-ins, simulated revenue).

### Dining
- `GET /api/v1/dining/venues` and `GET /api/v1/dining/venues/:code` — Venue directory and venue menu.
- `GET /api/v1/dining/venues/:code/availability?date=` — Hourly table availability for a Dhaka date.
- `POST /api/v1/dining/reservations`, `GET /api/v1/dining/reservations/me`, `POST /api/v1/dining/reservations/:ref/cancel` — Table reservations (demo deposit).
- `GET /api/v1/dining/delivery/beds`, `POST /api/v1/dining/food-orders`, `GET /api/v1/dining/food-orders/me`, `POST /api/v1/dining/food-orders/:ref/cancel` — Food delivery to a booked sunbed (demo charge).
- `/api/v1/admin/dining/*` — Overview, venue/menu edits, reservation check-in/cancel and kitchen status changes. Full list in [docs/api.md](docs/api.md).

### Identity & Health
- `GET /api/v1/identity/personas` — List available demo user profiles.
- `POST /api/v1/identity/switch` — Switch active persona cookie.
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
│   │   ├── public/              # Static assets, map markers, worker scripts
│   │   └── src/
│   │       ├── app/             # App Router pages (/hotels, /food, /rides, /bookings, /admin)
│   │       ├── components/      # React components (map, booking modal, tickets, site shell)
│   │       └── lib/             # API client, session utilities, geometry & map layout helpers
│   └── api/                     # NestJS 11 REST API
│       ├── src/
│       │   ├── common/          # Auth guards, exceptions, time helpers, Prisma module
│       │   ├── config/          # Environment configuration & validation
│       │   ├── health/          # Health check controllers
│       │   └── modules/         # Bookings, Catalogue, Identity, Audit modules
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
| Roles, scopes, uploads, privacy | [docs/security.md](docs/security.md) |
| Modules and structure | [docs/architecture.md](docs/architecture.md), [ADR-001](docs/ADR-001-stack.md), [ADR-002](docs/ADR-002-multi-destination-platform.md) |
| Tests | [docs/testing.md](docs/testing.md) |
| Configuration and deployment | [docs/operations.md](docs/operations.md) |
| Milestones | [docs/delivery-plan.md](docs/delivery-plan.md) |

---

## License

All rights reserved.
