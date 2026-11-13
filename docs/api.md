# REST API Specification

**Base path:** `/api/v1` · **Format:** JSON · **Contract:** OpenAPI generated from NestJS DTOs

## 1. Conventions

Dates use ISO-8601 UTC. Money uses integer minor units and an ISO currency code. Cursor pagination
defaults to 20 and is capped at 100 with a stable sort. Require `Idempotency-Key` for booking holds
and confirmation. Use explicit workflow commands; no arbitrary status `PATCH`. Validate path, query
and body at the API boundary. Enforce authorization in the service/guard layer. Rate-limit login,
holds and public search. CORS allows only the configured web origin.

Success responses contain resource data and optional `meta`. Error shape:
`{ "error": { "code", "message", "details", "requestId" } }`.

HTTP mapping: `400` validation, `401` unauthenticated, `403` forbidden, `404` absent/out of scope,
`409` conflict, `422` domain rule, `429` rate limit, `5xx` internal. No stack traces or secret
details.

## 2. Endpoint inventory

### 2.1 Implemented today

Read from the controllers on `dev` (2026-11-13). All are under `/api/v1` and return `{ data }`.

- **Catalogue:** `GET /beach-points?date=`, `GET /beach-points/{code}?date=`.
- **Sunbed orders:** `POST /orders`, `GET /orders/me`, `GET /orders`, `GET /orders/{ref}`,
  `POST /orders/{ref}/cancel`.
- **Hotels:** `GET /hotels`, `GET /hotels/{slug}`, `POST /hotels/bookings`.
- **Dining:** listed under "Dining" below.
- **Operations:** `GET /admin/overview`, `GET /admin/beach-points`, `GET /admin/orders`,
  `POST /admin/orders/{ref}/cancel`, `POST /admin/orders/{ref}/check-in`,
  `POST /admin/tickets/validate`, and the `/admin/dining/*` routes below.
- **Identity:** `GET /session`, `GET /demo/users` (seeded accounts, only while
  `DEMO_AUTH_ENABLED=true`). The caller is identified by the `x-demo-user-id` header.
- **Health:** `GET /health/live`, `GET /health/ready`, outside the version prefix.

Creating an order, hotel booking, reservation or food order reserves inventory and records the
charge in one transaction; there is no separate hold step yet. No endpoint reads an
`Idempotency-Key` yet. Both are addressed in [implementation-plan.md](implementation-plan.md)
(WP-07, WP-08).

### 2.2 Target inventory

The lists below are the target API. Items not in 2.1 are planned.

**Public:** `GET /zones`, `GET /categories`, `GET /listings`, `GET /listings/{publicId}`,
`GET /tariffs`, `GET /procurement/notices`, `GET /procurement/notices/{publicId}`.

**Identity:** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`.

**Visitor:** `POST /holds`, `POST /bookings` (confirm), `GET /bookings`,
`GET /bookings/{publicRef}`, `POST /bookings/{publicRef}/cancel`,
`GET /payments/methods`, `POST /payments/{publicRef}/pay`.

**Provider:** `POST/GET/PATCH /provider/listings`, `GET /provider/listings/{id}`,
`POST /provider/listings/{id}/submit`, `POST/GET/PATCH /provider/listings/{id}/products`,
`GET /provider/products/{id}`, `GET/PATCH /provider/products/{id}/inventory`,
`GET /provider/availability`, `GET /provider/bookings`,
`POST/GET /provider/products/{id}/tariff-proposals`.

**Admin moderation:** `GET /admin/review/listings`, `GET /admin/review/tariffs`,
`POST /admin/listings/{id}/approve`, `POST /admin/listings/{id}/request-changes`,
`POST /admin/listings/{id}/reject`, `POST /admin/listings/{id}/suspend`,
`POST /admin/tariffs/{id}/approve`, `POST /admin/tariffs/{id}/request-changes`,
`POST /admin/tariffs/{id}/reject`.

**Procurement:** `POST /admin/procurement/notices`,
`POST /admin/procurement/notices/{id}/publish`, `POST /admin/procurement/notices/{id}/close`,
`POST /procurement/bids`, `POST /admin/procurement/bids/{id}/evaluations`,
`POST /admin/procurement/notices/{id}/recommendation`,
`POST /admin/procurement/recommendations/{id}/approve`.

**Contracts:** `GET /admin/contracts`, `GET /admin/contracts/{id}`,
`POST /admin/contracts/{id}/dues`.

**Finance:** `GET /admin/finance/summary`, `GET /admin/finance/entries`,
`POST /admin/finance/entries/{id}/reverse`, `GET /admin/finance/contract-dues`.

**Reporting and audit:** `GET /admin/reports/summary`, `GET /admin/reports/export.csv`,
`GET /admin/audit-events`.

**Administration:** `GET /admin/users`, `PATCH /admin/users/{id}/roles`, `GET /admin/providers`,
`POST /admin/providers/{id}/memberships`, `GET/PATCH /admin/pilot-config`.

**Operations:** `GET /health/live`, `GET /health/ready`.

**Dining (implemented, under `/api/v1`, all `{ data }`):**

- Public: `GET /dining/venues?kind=&beachPointCode=&reservable=&delivers=`,
  `GET /dining/venues/{code}` (venue + menu), `GET /dining/venues/{code}/availability?date=`.
- Tourist: `POST /dining/reservations`, `GET /dining/reservations/me`,
  `GET /dining/reservations/{ref}`, `POST /dining/reservations/{ref}/cancel`,
  `GET /dining/delivery/beds`, `POST /dining/food-orders`, `GET /dining/food-orders/me`,
  `GET /dining/food-orders/{ref}`, `POST /dining/food-orders/{ref}/cancel`. An owner or admin may
  read a reservation or food order; another tourist receives `404`.
- Admin: `GET /admin/dining/overview?date=`, `GET /admin/dining/venues`,
  `PATCH /admin/dining/venues/{code}`, `PATCH /admin/dining/menu-items/{id}`,
  `GET /admin/dining/reservations?date=&venueCode=&status=`,
  `POST /admin/dining/reservations/{ref}/check-in`, `POST /admin/dining/reservations/{ref}/cancel`,
  `GET /admin/dining/food-orders?venueCode=&status=&date=`,
  `POST /admin/dining/food-orders/{ref}/status`.

Malformed bodies or unknown fields return `400`; business-rule violations (time windows, limits,
venue state, impossible dates) return `422`; state conflicts (slot taken, illegal food-order
transition, already cancelled/checked in) return `409`. Reservation QR tickets are signed with the
shared ticket service, but `POST /admin/tickets/validate` only resolves sunbed orders; dining
check-in uses the reservation check-in endpoint.

There are no upload endpoints, notification endpoints, payment-gateway callbacks or government
endpoints.

**Payments.** Charges and refunds go through the payment-provider port described in
[workflows.md](workflows.md) section 2. `GET /payments/methods` returns the methods checkout may
offer (`BKASH`, `NAGAD`, `CARD`) so the web and Android clients never hard-code them. Requests name
a method; the provider is chosen and recorded by the server and is never accepted from the client.
No endpoint accepts card numbers, CVVs, wallet PINs or one-time codes. Implemented order,
reservation and food-order endpoints currently accept `paymentMethod: 'MOCK'`; replacing it with
the method values above is a breaking contract change tracked in
[implementation-plan.md](implementation-plan.md) (WP-07, switched in the web app by WP-14).

**Clients.** The same `/api/v1` serves the website and the planned Android app. Android models are
generated from the OpenAPI document, so DTO names and enums are part of the mobile contract.

## 3. Domain behavior

The server derives all prices, availability and permitted state transitions. Provider ID comes from
authorized membership, not trusted request input. Public catalogue returns only approved active
listing versions and internally approved effective rates. Booking and payment commands are
idempotent. A conflict such as sold-out inventory returns `409` with safe availability refresh
guidance and identifies the unit that was lost, so the client can keep the rest of the selection.

Booking commands follow `HELD → CONFIRMED | CANCELLED | EXPIRED`. Cancellation before the cut-off
restores inventory once, is free and records a full refund; later cancellation is rejected for
visitors. Confirmation charges through the payment provider exactly once.

## 4. Security and versioning

Never expose internal stack traces, password/session data, private provider records or unfiltered
finance data. Validate maximum sizes, date ranges, enums and identifiers. Version breaking API
changes and document deprecation. OpenAPI is generated from NestJS DTOs and must match implemented
routes. Health endpoints are specified in [operations.md](operations.md).

## 5. Representative response types

Listing exposes public reference, approved content, provider display info, zone/category, products,
rate source and verification date, image URLs, terms and `last_verified_at`.

Booking exposes public reference, lifecycle state, item price snapshots, hold expiry, cancellation
policy and cut-off time, payment method and status, and rate source.

Finance responses and CSV exports include `generated_at` and each record's payment provider.
