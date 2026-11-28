# REST API Specification

**Base path:** `/api/v1` · **Format:** JSON · **Contract:** OpenAPI generated from NestJS DTOs,
shared types in `packages/api-contracts`

## 1. Conventions

- Success: `{ "data": ..., "meta"?: { "nextCursor", ... } }`. Error:
  `{ "error": { "code", "message", "details", "requestId" } }`.
- Status codes: `400` validation, `401` no identity, `403` not allowed, `404` absent or out of
  scope (also for other people's records), `409` state conflict (slot taken, illegal transition),
  `422` business rule (time window, limits), `429` rate limit.
- Dates are ISO-8601 UTC; date-only parameters are Asia/Dhaka calendar dates (`2026-11-23`).
- Money is integer minor units plus ISO currency (`{ "amountMinor": 12000, "currency": "BDT" }`).
- Cursor pagination: default 20, maximum 100, stable sort.
- `Idempotency-Key` header is supported (optional on create calls today; required once WP-10 checkout
  sessions land) on calls that create a booking, payment, refund, bid acceptance or payout.
- State changes are explicit commands (`POST .../cancel`), never a free status `PATCH`.
- The server derives every price, total, commission, provider scope and role. Unknown body fields
  are rejected.
- Identity: until sign-in exists, the web app sends the seeded account as `x-demo-user-id`
  (enabled only when `DEMO_AUTH_ENABLED=true`). The sign-in phase replaces this with session
  cookies; endpoints do not change.

## 2. Implemented endpoints (on `dev`)

| Area | Endpoints |
|---|---|
| Identity | `GET /session`, `GET /demo/users` |
| Places | `GET /destinations`, `GET /destinations/{destination}`, `GET /destinations/{destination}/spots/{spot}` |
| Sunbeds | `GET /beach-points?date=&destination=`, `GET /beach-points/{code}?date=` |
| Sunbed orders | `POST /orders`, `GET /orders`, `GET /orders/me`, `GET /orders/{ref}`, `POST /orders/{ref}/cancel` |
| Hotels | `GET /hotels?destination=&spot=`, `GET /hotels/{slug}`, `POST /hotels/bookings` |
| Dining | `GET /dining/venues?destination=&spot=&kind=&beachPointCode=&reservable=&delivers=`, `GET /dining/venues/{code}`, `GET /dining/venues/{code}/availability?date=`, `POST /dining/reservations`, `GET /dining/reservations/me`, `GET /dining/reservations/{ref}`, `POST /dining/reservations/{ref}/cancel`, `GET /dining/delivery/beds`, `POST /dining/food-orders`, `GET /dining/food-orders/me`, `GET /dining/food-orders/{ref}`, `POST /dining/food-orders/{ref}/cancel` |
| Checkout & Payments | `POST /checkout/quote`, `GET /payments/methods` |
| Saved | `GET /saved`, `POST /saved`, `DELETE /saved` |
| Provider (scoped) | `GET /provider/today`, `GET /provider/venues`, `PATCH /provider/venues/{code}`, `PATCH /provider/menu-items/{id}`, `GET /provider/reservations`, `POST /provider/reservations/{ref}/check-in`, `POST /provider/reservations/{ref}/cancel`, `GET /provider/food-orders`, `POST /provider/food-orders/{ref}/status` |
| Desk (scoped) | `GET /desk/arrivals`, `POST /desk/lookup`, `POST /desk/bookings/{ref}/check-in` |
| Admin (current) | `GET /admin/overview`, `GET /admin/beach-points`, `GET /admin/orders`, `POST /admin/orders/{ref}/cancel`, `POST /admin/orders/{ref}/check-in`, `POST /admin/tickets/validate`, `/admin/dining/*` |
| Health | `GET /health/live`, `GET /health/ready` |

Planned transition (WP-10): create endpoints will stop accepting `paymentMethod` directly and
return a booking in `PENDING_PAYMENT` paid through `POST /checkout` + `POST /checkout/{id}/pay`.
Old `/admin/dining/*` routes stay until the web app no longer uses them.

## 3. Public

| Endpoint | Purpose |
|---|---|
| `GET /destinations` | Active destinations with accent, hero, service-type counts, active alert summary |
| `GET /destinations/{slug}` | Destination with content, spots, service tiles, emergency contacts |
| `GET /destinations/{slug}/spots/{spot}` | Spot hub in one call: spot, alerts, bookable types with top listings, nearby facilities, know content, help contacts |
| `GET /listings?destination=&spot=&type=&q=&priceMin=&priceMax=&rating=&sort=&cursor=` | Listing cards |
| `GET /listings/{publicId}` | Listing detail with media, offerings, policy, rating, provider card |
| `GET /listings/{publicId}/availability?date=&offering=` | Slots or departures with remaining capacity |
| `GET /listings/{publicId}/reviews?cursor=` | Reviews |
| `GET /providers/{publicId}` | Public provider profile (photographer portfolio and packages) |
| `GET /search?q=&destination=&type=` | Grouped results: destinations, spots, listings, providers |
| `GET /nearby?lat=&lng=&type=&radius=` | Facilities and listings by distance |
| `GET /lost-found?destination=&category=&spot=&cursor=` | Public board of found items (public fields only) |
| `GET /media/{id}` | Public media; private media needs authorisation |

## 4. Tourist

| Endpoint | Purpose |
|---|---|
| `POST /bookings` | Draft a generic booking (listing, offering, slot, quantity); holds inventory |
| `GET /trips?tab=upcoming\|past\|requests\|reports` | One timeline across all engines |
| `GET /trips/{ref}` | Ticket or order detail for any engine |
| `POST /bookings/{ref}/cancel` | Cancel with the snapshotted policy |
| `POST /checkout` | Create a checkout for a pending booking of any engine (`{ kind, ref }`); returns totals, fee lines and allowed methods |
| `POST /checkout/{id}/pay` | `{ method }` with `Idempotency-Key`; returns the gateway step |
| `POST /payments/sandbox/{externalRef}/approve` and `/decline` | Sandbox gateway result (sandbox adapter only) |
| `GET /payments/{id}/receipt` | Receipt |
| `POST /quote-requests` | Post a photographer, guide or charter request |
| `GET /quote-requests/me`, `GET /quote-requests/{ref}` | Requests and their bids (sealed per provider) |
| `POST /quote-requests/{ref}/cancel` | Cancel an open request |
| `POST /bids/{id}/counter` | One counter-offer |
| `POST /bids/{id}/accept` | Accept; creates booking and job |
| `POST /jobs/{id}/selection` | Select kept photos or confirm count |
| `POST /jobs/{id}/dispute` | Open a dispute |
| `GET /inbox`, `GET /inbox/{conversationId}`, `POST /inbox/{conversationId}/messages`, `POST /conversations` | Messages and notifications |
| `POST /notifications/read` | Mark read |
| `POST /reviews` | Review a completed booking |
| `GET/POST/DELETE /saved` | Saved items |
| `POST /lost-found` | Report a lost item or a found item |
| `GET /lost-found/me`, `GET /lost-found/{ref}` | Own reports and matches |
| `POST /lost-found/{ref}/claims` | Claim with verification answers and pickup time |
| `POST /complaints`, `GET /complaints/me`, `GET /complaints/{ref}`, `POST /complaints/{ref}/reopen` | Complaints |
| `POST /media` | Upload an image (multipart, purpose required) |

## 5. Provider (`/provider`, scoped by membership)

| Endpoint | Purpose |
|---|---|
| `POST /provider/applications`, `GET /provider/applications/me` | Onboarding |
| `GET /provider/me`, `PATCH /provider/me` | Business profile |
| `GET /provider/today` | Arrivals, pending orders, open requests, earnings |
| `GET/POST /provider/listings`, `GET/PATCH /provider/listings/{id}`, `POST /provider/listings/{id}/submit`, `POST /provider/listings/{id}/archive` | Listings and revisions |
| `GET/POST/PATCH /provider/listings/{id}/offerings`, `/schedules`, `POST /provider/slots/{id}/block` | Inventory |
| Engine-specific: `/provider/hotels/{id}/rooms`, `/provider/venues/{code}/menu`, `/provider/venues/{code}/tables`, `/provider/beach-points/{code}/sunbeds` | Existing engines' setup |
| `GET /provider/bookings?status=&date=`, `GET /provider/bookings/{ref}`, `POST /provider/bookings/{ref}/check-in`, `POST /provider/bookings/{ref}/cancel`, `POST /provider/bookings/{ref}/no-show` | Bookings |
| `POST /provider/tickets/validate` | Scan |
| `GET /provider/food-orders`, `POST /provider/food-orders/{ref}/status`, `GET /provider/reservations`, `POST /provider/reservations/{ref}/check-in` | Kitchen and tables |
| `GET /provider/requests`, `POST /provider/requests/{ref}/bids`, `PATCH /provider/bids/{id}`, `POST /provider/bids/{id}/withdraw`, `POST /provider/counters/{id}/accept\|decline` | Bidding |
| `GET /provider/jobs`, `POST /provider/jobs/{id}/deliver` | Photographer jobs |
| `GET /provider/earnings?from=&to=`, `GET /provider/payouts` | Money |
| `POST /provider/reviews/{id}/reply` | Reply |
| `POST /provider/lost-found` | Log a found item at the business |

## 6. Desk (`/desk`, scoped by destination assignment)

`GET /desk/arrivals`, `POST /desk/lookup`, `POST /desk/bookings/{ref}/check-in` *(implemented)*;
planned: `GET/POST /desk/lost-found`, `GET /desk/lost-found/{ref}`, `POST /desk/lost-found/{ref}/receive`,
`POST /desk/matches/{id}/confirm|dismiss`, `GET /desk/claims`, `POST /desk/claims/{ref}/verify|reject`,
`POST /desk/claims/{ref}/handover`, `POST /desk/lost-found/{ref}/dispose`,
`GET /desk/complaints`, `POST /desk/complaints/{ref}/acknowledge|note|escalate|resolve`,
`GET/POST /desk/alerts`, `POST /desk/alerts/{id}/end`.

## 7. Admin (`/admin`)

| Area | Endpoints |
|---|---|
| Overview | `GET /admin/overview?destination=&from=&to=` |
| Places | `GET/POST /admin/destinations`, `PATCH /admin/destinations/{id}`, `POST /admin/destinations/{id}/spots`, `PATCH /admin/spots/{id}`, `POST /admin/destinations/{id}/reorder`, `GET/POST/PATCH /admin/emergency-contacts`, `GET/POST/PATCH /admin/alerts` |
| Providers | `GET /admin/providers?status=`, `POST /admin/providers/{id}/approve\|request-changes\|reject\|suspend\|reinstate`, `POST /admin/providers/{id}/service-types`, `POST /admin/providers/{id}/members` |
| Listings | `GET /admin/listings?status=`, `GET /admin/revisions?status=`, `POST /admin/listings/{id}/approve\|request-changes\|reject\|suspend`, `POST /admin/revisions/{id}/approve\|reject` |
| Bookings | `GET /admin/bookings?engine=&destination=&status=&q=`, `POST /admin/bookings/{ref}/cancel`, `POST /admin/jobs/{id}/resolve-dispute` |
| Money | `GET /admin/payments`, `POST /admin/payments/{id}/refund`, `GET /admin/ledger`, `GET /admin/finance/summary`, `GET/POST /admin/commission-rules`, `GET/POST /admin/payouts`, `POST /admin/payouts/{id}/approve\|mark-paid`, `GET /admin/reports/export.csv` |
| Help | `GET /admin/lost-found`, `GET /admin/complaints`, `POST /admin/complaints/{ref}/assign\|resolve`, `GET/POST /admin/desk-assignments` |
| Platform | `GET /admin/users`, `PATCH /admin/users/{id}/role`, `GET/PATCH /admin/settings`, `GET /admin/audit-events`, `POST /admin/reviews/{id}/hide` |

## 8. Sign-in (last phase)

`POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/logout`, `GET /auth/me`. The
`/demo/users` endpoint and the `x-demo-user-id` header are then disabled outside local
development.

## 9. Representative responses

- **Listing card:** `publicId`, `type`, `title`, `titleBn`, `photo`, `destination`, `spot`,
  `distanceMeters?`, `rating`, `ratingCount`, `fromPrice { amountMinor, currency, unit }`,
  `keyFact`, `saved`.
- **Trip item:** `ref`, `engine` (`SUNBED`, `STAY`, `TABLE`, `FOOD`, `BOOKING`, `JOB`), `title`,
  `spot`, `startsAt`, `endsAt`, `status`, `total`, `paid`, `canCancelUntil`, `ticket?`.
- **Bid (to the requesting tourist):** `id`, `provider { publicId, name, rating, jobsDone,
  portfolio[] }`, `priceUnit`, `unitPrice`, `includedCount`, `extraUnitPrice`, `estimatedTotal`,
  `deliveryHours`, `message`, `status`, `counter?`.
- **Payment:** `id`, `type`, `purpose`, `provider`, `method`, `status`, `amount`, `commission`,
  `providerNet`, `externalRef`, `createdAt`. Tourist responses omit `commission` and `providerNet`.
- **Found item (public):** `ref`, `category`, `title`, `publicDescription`, `spot`, `foundOn`,
  `desk`. Never private details, private photos or questions' answers.
