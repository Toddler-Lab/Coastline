# Smart Cox’s Bazar (Coastline)

> **Bay of Bengal Coastal Services Platform**  
> *Discover and book sunbeds, dining and hotel stays along the Cox’s Bazar 120 km coastal corridor, with tickets, desk check-in and operations tools.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.2-red.svg)](https://nestjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748.svg)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18.svg)](https://vitest.dev/)

---

> [!IMPORTANT]
> **Developer note: payments and affiliation**  
> Payments run through a payment-provider port whose only adapter today is a sandbox adapter: checkout, receipts and refunds work end to end, and no money moves. The interface does not label this, so do not deploy publicly in this mode without a deliberate decision (see [docs/operations.md](docs/operations.md)). Coastline is an independent platform; nothing in the product may imply government endorsement or official tariffs.
>
> **Interface redesign in progress.** The target design for the website and the planned Android app is [docs/design.md](docs/design.md). Screens and copy described below reflect the current build until the redesign phases in [docs/delivery-plan.md](docs/delivery-plan.md) land.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Live & Fully Operational](#live--fully-operational)
  - [Future Modules (In Development)](#future-modules-in-development)
- [Technology Stack & Monorepo Architecture](#technology-stack--monorepo-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone & Install Dependencies](#1-clone--install-dependencies)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Start PostgreSQL Database](#3-start-postgresql-database)
  - [4. Run Migrations & Seed Data](#4-run-migrations--seed-data)
  - [5. Run the Application](#5-run-the-application)
- [Application URLs & Access Points](#application-urls--access-points)
- [Seeded Accounts](#seeded-accounts)
- [Workspace Commands & Scripts](#workspace-commands--scripts)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [REST API Reference](#rest-api-reference)
- [Project Invariants & Design Principles](#project-invariants--design-principles)
- [Repository Structure](#repository-structure)
- [Documentation Index](#documentation-index)

---

## Overview

**Coastline** addresses critical challenges faced by tourists and municipal authorities in Cox's Bazar, Bangladesh—home to the world's longest unbroken natural sandy sea beach:
- **Price Transparency**: Eliminates arbitrary overcharging with fixed, benchmarked hourly bed rates.
- **Shoreline Sunbed Management**: Live real-time visibility of sunbed rows across 6 certified beach points.
- **Instant Booking & QR Tickets**: Frictionless reserving, one shared checkout, and cryptographically signed QR tickets for beach check-in.
- **Field Desk Validation**: Digital ticket scanner for beach attendants and administrators.
- **Cohesive Tourism Ecosystem**: Architectural blueprints for Hotels, Beach Dining, Transport (Tomtom/Jeep), and Water Sports.

---

## Key Features

### Live & Fully Operational

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
   - **Checkout**: Payment through the payment-provider port (sandbox adapter today), with instant confirmation and a receipt on the ticket.
   - **Double-Booking Protection**: PostgreSQL transactional isolation prevents race conditions and overlapping slot holds.

4. **Digital QR Tickets & My Bookings**:
   - View past and upcoming reservations at `/bookings`.
   - Dynamic QR code ticket generated for each confirmed order containing verified reference code, slot window, beach point, and HMAC signature.
   - One-click order cancellation with automated inventory release before session commencement.

5. **Desk Check-in & Administration**:
   - Attendant check-in console at `/admin/bookings` with camera-based QR scanner or manual reference lookup.
   - Real-time check-in status transitions (`CONFIRMED` $\rightarrow$ `CHECKED_IN`).
   - Beach point configuration and status dashboard at `/admin/points`.
   - Account switcher in the top navigation to move between the seeded visitor and staff accounts (local and presentation use only).

6. **Food & Beach Dining (`/food`)**:
   - Venue discovery with filters (venue type, beach point, "reserve a table", "delivers to your sunbed") and venue pages with menus at `/food/[code]`.
   - Hourly table reservations (1–3 hours, up to 7 days ahead) with an optional deposit, race-safe table-hour locking, a QR ticket and cancellation until 60 minutes before the start.
   - Food delivery to a sunbed the tourist has currently booked at the same beach point, with server-side pricing, order tracking (`Placed → Preparing → Ready → Delivered`) and cancellation while still placed.
   - Reservations and food orders appear on `/bookings`.
   - Operations desk at `/admin/dining`: overview, venue and menu editing, reservation check-in and a kitchen queue.

---

### Future Modules (In Development)

These services are not released. In the target design they sit behind feature flags and stay out of navigation until they are complete:
- 🛺 **Rides & Beach Transport (`/rides`)**: Fixed-fare electric Tomtoms and open-top 4WD Chander Gari Marine Drive jeeps.
- 🏄 **Water Sports & Sea Adventures (`/activities`)**: Jet ski, parasailing and surfing sessions.

Hotel stays (`/hotels`) are implemented: hotel list, hotel pages and room booking through the same order and ticket flow.

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
- **Node.js**: `v22.0.0` or higher (Node 22 LTS recommended)
- **pnpm**: `v9.0.0` or higher (`corepack enable pnpm` or `npm i -g pnpm`)
- **Docker & Docker Compose**: (Recommended for running PostgreSQL locally) or an existing PostgreSQL 16+ instance.

---

## Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Toddler-Lab/Coastline.git
cd Coastline

# Install all workspace dependencies
pnpm install
```

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
`pnpm db:setup` starts it, applies migrations and seeds the starter data in one go.

> **After every `git pull`:** run `pnpm install` and `pnpm db:migrate`. New migrations and
> dependencies are the usual reason a fresh pull does not start. Also compare your `.env` with
> `.env.example`: new settings are added there, and `.env` is not committed.

### 4. Run Migrations & Seed Data

Deploy the Prisma migrations and seed the 6 beach points, sunbeds, and initial bookings:

```bash
# Apply schema migrations
pnpm db:migrate

# Seed beach points, sunbeds, tariffs, and starter orders
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
| **Web Application** | [http://localhost:3000](http://localhost:3000) | Interactive beach map, sunbed reservation, and bookings |
| **My Bookings** | [http://localhost:3000/bookings](http://localhost:3000/bookings) | User QR tickets, active stays, and cancellation drawer |
| **Desk Check-in Console** | [http://localhost:3000/admin/bookings](http://localhost:3000/admin/bookings) | Ticket scanner and attendant check-in portal |
| **Beach Points Admin** | [http://localhost:3000/admin/points](http://localhost:3000/admin/points) | Beach point status and sunbed maintenance controls |
| **Dining** | [http://localhost:3000/food](http://localhost:3000/food) | Venues and menus, table reservations, food delivery to your sunbed |
| **Dining Operations** | [http://localhost:3000/admin/dining](http://localhost:3000/admin/dining) | Overview, venue/menu editing, reservation desk, kitchen queue (staff account) |
| **Future Modules** | [http://localhost:3000/rides](http://localhost:3000/rides) | Rides (`/rides`), Sports (`/activities`) |
| **REST API Base** | [http://localhost:3001/api/v1](http://localhost:3001/api/v1) | Backend REST API endpoints |
| **Swagger / OpenAPI** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Interactive API documentation and test harness |
| **API Health Checks** | [http://localhost:3001/api/v1/health/live](http://localhost:3001/api/v1/health/live) | Kubernetes/Docker liveness & readiness probes |

---

## Seeded Accounts

Seeded accounts for local development and presentations, available from the account switcher in the top header while `DEMO_AUTH_ENABLED=true`. They are synthetic and are disabled in production:

1. **Rahim Ahmed (`TOURIST`)**:
   - Regular domestic tourist visiting Cox's Bazar.
   - Used to make reservations, try slot selections, and view personal QR tickets in `/bookings`.
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
| `pnpm db:seed` | Populates database with beach points, sunbeds, and starter orders |
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
- **`OrdersController` & `AdminOrdersController`**: Tourist and admin HTTP boundaries, seeded-account authentication, DTO validation.
- **`CatalogueService` & `CatalogueController`**: Beach point geodata, availability queries, sunbed state serialization.
- **`IdentityController`**: Seeded-account switching and session persistence.
- **`Guards & Filters`**: Role-based access control, seeded-account auth headers, global exception normalization.

---

## REST API Reference

The API is fully documented with OpenAPI/Swagger at [http://localhost:3001/api/docs](http://localhost:3001/api/docs). Key endpoints:

### Public Catalogue & Availability
- `GET /api/v1/beach-points?date=2026-11-10` — List the 6 beach points with coordinates, price and free-bed counts.
- `GET /api/v1/beach-points/:code?date=2026-11-10` — One beach point with its hourly slots and the status of every sunbed.

### Orders & Sunbed Booking
- `POST /api/v1/orders` — Create a sunbed booking (`items[]` with `sunbedId`, `startsAt`, `hours`).
- `GET /api/v1/orders/me` — List upcoming and past bookings for the current visitor account.
- `GET /api/v1/orders/:orderRef` — Retrieve details, status, and QR ticket for a booking.
- `POST /api/v1/orders/:orderRef/cancel` — Cancel an upcoming reservation and release the inventory slot.

### Desk Check-in & Administration
- `GET /api/v1/admin/orders` — Filter all bookings by date, beach point, status, or search query.
- `POST /api/v1/admin/orders/:orderRef/check-in` — Manual attendant check-in for an arriving tourist.
- `POST /api/v1/admin/tickets/validate` — Validate a scanned QR ticket code and verify cryptographic signature.
- `GET /api/v1/admin/overview` — Operational summary metrics (total bookings, active check-ins, revenue).

### Dining
- `GET /api/v1/dining/venues` and `GET /api/v1/dining/venues/:code` — Venue directory and venue menu.
- `GET /api/v1/dining/venues/:code/availability?date=` — Hourly table availability for a Dhaka date.
- `POST /api/v1/dining/reservations`, `GET /api/v1/dining/reservations/me`, `POST /api/v1/dining/reservations/:ref/cancel` — Table reservations (optional deposit).
- `GET /api/v1/dining/delivery/beds`, `POST /api/v1/dining/food-orders`, `GET /api/v1/dining/food-orders/me`, `POST /api/v1/dining/food-orders/:ref/cancel` — Food delivery to a booked sunbed.
- `/api/v1/admin/dining/*` — Overview, venue/menu edits, reservation check-in/cancel and kitchen status changes. Full list in [docs/api.md](docs/api.md).

### Identity & Health
- `GET /api/v1/session` — The current account.
- `GET /api/v1/demo/users` — List the seeded accounts (only while `DEMO_AUTH_ENABLED=true`). The web app selects one with a cookie and sends it as the `x-demo-user-id` header.
- `GET /api/v1/health/live` & `GET /api/v1/health/ready` — Application and database liveness probes.

---

## Project Invariants & Design Principles

As codified in [AGENTS.md](AGENTS.md):
- **Monetary Values**: All money is represented strictly as integer minor units (`BDT 50.00` = `5000` Paisa) paired with ISO currency `BDT`. Floating-point currency math is prohibited.
- **Timezone Invariance**: All database timestamps and API dates are stored strictly in UTC and presented in Bangladesh Standard Time (`Asia/Dhaka`, UTC+6).
- **Concurrency & Double-Booking Protection**: All inventory slot reservations execute inside serializable or locked PostgreSQL transactions. Overlapping booking slots for the same bed are rejected with HTTP `409 Conflict`.
- **Audit Logging**: Privilege transitions (e.g. check-ins, cancellations) write immutable append-only audit log entries.
- **Privacy & Security**: Seeded accounts use synthetic fixtures. No card credentials, wallet PINs, payment tokens, or personally identifiable information (PII) are stored or logged, and checkout never asks for them while the sandbox payment adapter is active.
- **Publishable Interface**: No user-facing surface uses test or presentation wording, and none implies government endorsement. The rules and the replacement copy are in [docs/design.md](docs/design.md) section 12.
- **One Design for Web and Android**: Role-named design tokens, Material window size classes, and shared route and component names so the Kotlin/Compose app matches the website.

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

Detailed architectural and requirements documentation is maintained under the `docs/` folder:

- [Product Requirements Document (PRD)](docs/PRD.md)
- [System Architecture](docs/architecture.md)
- [Technology Stack Decision (ADR-001)](docs/ADR-001-stack.md)
- [Data Model & Database Schema](docs/data-model.md)
- [REST API Specification](docs/api.md)
- [Design Specification: website and Android](docs/design.md) — visual language, tokens, responsive layout, navigation, flows, page specs, copy rules
- [Security & Authorization Policy](docs/security.md)
- [Domain Workflows & Lifecycle States](docs/workflows.md)
- [Testing Strategy & Quality Gates](docs/testing.md)
- [Operations & Deployment Guide](docs/operations.md)
- [Delivery Roadmap & Milestones](docs/delivery-plan.md)
- [Implementation Plan: redesign work packages](docs/implementation-plan.md) — ordered work packages with files, tests, decisions and progress

---

## License

All rights reserved.
