# Data Model and Persistence

**Source of truth:** PostgreSQL · **ORM:** Prisma · **Money:** integer minor units + ISO currency

## 1. Core entities

- **Identity:** `users`, `roles`, `user_roles`, `sessions`.
- **Providers:** `providers`, `provider_memberships`.
- **Catalogue:** `zones`, `service_categories`, `listings`, `listing_versions`, `products`.
- **Governance:** `tariff_schedules`, `tariff_versions`.
- **Inventory/bookings:** `inventory_slots`, `bookings`, `booking_items`, `payments`.
- **Procurement:** `procurement_notices`, `procurement_lots`, `suppliers`, `bids`, `evaluations`,
  `contracts`, `contract_dues`.
- **Finance:** `fee_rules`, `journal_entries`, `journal_lines`.
- **Platform:** `audit_events`, `idempotency_keys`.

There are no media, document-upload or notification tables in MVP.

**Dining (implemented, migration `20261111100000_dining_foundation`):** `dining_venues` (optional
beach point, Dhaka opening hours, reservation/delivery toggles, deposit in minor units),
`menu_categories`, `menu_items` (composite FK keeps an item's category in the same venue),
`dining_tables`, `table_reservations` (snapshots venue/table names, deposit and currency),
`table_slots` (one row per reserved table-hour; a partial unique index on active
`(table_id, slot_start)` prevents double booking), `food_orders` (linked to the sunbed
`order_items` row it is delivered to; snapshots venue, bed and beach point) and `food_order_items`
(snapshots item name and unit price). A `payments` row belongs to exactly one of a sunbed order,
table reservation or food order (`CHECK num_nonnulls(...) = 1`) and records its provider, method,
amount, status and external reference. The `provider` column currently defaults to `MOCK` and
seeded external references start with `MOCK-`; a new migration renames the value to `SANDBOX` and
adds the method values (`BKASH`, `NAGAD`, `CARD`). Applied migrations are not rewritten. No payment
credential is ever stored. Known gap: the payment foreign keys
to reservations and food orders are `ON DELETE CASCADE`; application code never deletes those
parents, and a follow-up migration should change them to `RESTRICT`.

## 2. Relationships

A provider has memberships and listings. A listing belongs to a provider, zone and category and has
versions. A listing has products; a product has a tariff schedule and inventory slots. A booking
belongs to a visitor and provider and has one item snapshot referencing a product, slot and tariff
version. A procurement notice has lots; a lot has bids; a bid has evaluations; an award
recommendation can create a draft contract; a contract has manually entered dues. Journal
entries link to a source type/id and contain journal lines. Audit events link an actor and entity.

## 3. Key fields and constraints

- All entities use UUID PKs; created/updated times are `timestamptz`.
- User email is normalized and unique. Public listing, booking and notice refs are unique and
  non-secret.
- `sessions` stores `user_id`, a hashed opaque token, hashed CSRF token, created/rotated/revoked
  times, idle expiry and absolute expiry. Session tokens are never stored in plaintext.
- `idempotency_keys` has a unique `(scope, key)`, request hash, response status/body and expiry.
  Booking holds and confirmation require a key.
- Version numbers are unique per listing/tariff parent. Submitted versions are immutable.
- `products.booking_mode` is `SLOT_CAPACITY`, `QUANTITY` or `INQUIRY_ONLY`.
- Inventory slot capacity and available are integers; `CHECK (0 <= available <= capacity)`;
  unique product + interval.
- `bookings.state` is `HELD`, `CONFIRMED`, `CANCELLED` or `EXPIRED`. A booking stores currency,
  `total_minor`, `hold_expires_at`, a cancellation-policy snapshot and the applicable
  `fee_rule_id`. MVP writes exactly one `booking_item`.
- `booking_items` snapshot listing/product names, quantity, unit/line amount and tariff version.
- `tariff_versions` stores amount, currency, `rate_type`, unit, effective window, source/provenance,
  status, submitter, reviewer and reason. Approved windows must not overlap for the same product and
  `rate_type`.
- `fee_rules` are immutable versions with `platform_fee_bps`, `public_share_bps`, effective window
  and status. `platform_fee_bps + public_share_bps <= 10000`; bookings and contracts snapshot the
  applicable rule.
- `journal_lines` have account, debit_minor, credit_minor and currency. Posting rejects any entry
  that does not balance per currency; a deferred constraint or trigger may be added as defense.
- `contract_dues` are manually entered amounts linked to a contract; they are never calculated by
  the application.
- `audit_events` store actor, action, entity, entity_id, time, reason, request_id and safe
  before/after JSON. Procurement conflict declarations use
  `action = EVALUATOR_CONFLICT_DECLARED`.
- Audit and posted journal rows are append-only. Correct with reversal rather than mutation or
  deletion.
- Listing versions may store an array of image URLs as text; there is no upload asset table.

## 4. Indexing and GIS

Index foreign keys, queue state + created_at, effective tariff windows, booking lookup refs and
zone/category search. Use PostGIS geometry/geography and GIST if available; otherwise store validated
WGS84 lat/lon and use bounding-box search. Record location source, precision and `verified_at`;
public locations can be generalized.

## 5. Migration policy

Prisma schema and migrations are checked in under `packages/db/prisma`. Review migrations; never
alter an applied migration. Shared environments are forward-only with rollback/mitigation notes.
Seed data is independent and repeatable. Use a SQL transaction and row lock for inventory
reservation. Never rely only on application-level validation for invariants.

## 6. Data lifecycle

Seeded data is synthetic and resettable only in explicitly guarded local/staging environments. Before
production, define retention, archival, deletion/access workflows and backup policy. Do not put
secrets, credentials or real payment data in the schema.
