# Data Model and Persistence

**Source of truth:** PostgreSQL 16+ · **ORM:** Prisma, reviewed SQL for locks · **Money:** integer
minor units plus ISO currency · **Time:** `timestamptz` in UTC, presented in Asia/Dhaka

This document describes the v2 model. Section 1 summarises what exists on `dev` today; sections
2-9 describe the full v2 target schema, delivered across the phases of
[implementation-plan.md](implementation-plan.md).

## 1. What exists on `dev`

Nine applied migrations (`init`, `hotel_bookings`, `dining_foundation`, `hotel_booking_check_in_time`,
`payments_provider_and_method`, `idempotency_keys`, `beach_point_image`, `places`,
`workspaces_and_saved`):

- **Identity & Workspaces:** `users` (`TOURIST`, `PROVIDER`, `DESK`, `ADMIN`), `providers` (without
  `public_id`, `service_types` or `listings` yet), `provider_members` (`OWNER`, `STAFF`),
  `desk_assignments`, `saved_items` (`SavedItemType`: `HOTEL`, `VENUE`, `SPOT` with `item_key`).
- **Places:** `destinations`, `spots`, `emergency_contacts`, `spot_alerts` (without `hero_media_id`
  yet).
- **Sunbeds:** `beach_points` (with `spot_id`, `image_url`, `image_alt`, `image_credit`), `sunbeds`,
  `orders`, `order_items`, `booking_slots` (one row per bed and hour; unique active slot prevents
  double booking).
- **Hotels:** `hotels` (with `destination_id`, `spot_id`, `provider_id`, nullable `area`, and legacy
  `HotelZone` enum still required), `room_types`, `hotel_rooms`, `hotel_bookings`,
  `hotel_room_nights` (one row per room and night).
- **Dining:** `dining_venues` (with `destination_id`, `spot_id`, `provider_id`), `menu_categories`,
  `menu_items`, `dining_tables`, `table_reservations`, `table_slots`, `food_orders`,
  `food_order_items`.
- **Money & Platform:** `payments` with `provider = 'SANDBOX'`, `method` (`BKASH`, `NAGAD`, `CARD`
  nullable), `status` (`SUCCEEDED`, `FAILED`), `type` (`CHARGE`, `REFUND`), exactly one parent;
  `idempotency_keys`; `audit_events`.

These engines keep their tables and locking. Remaining v2 WPs attach generic `listings`,
`offerings`, `commission_rules`, `ledger_entries`/`ledger_lines`, help, and quote tables.

## 2. Places

| Table | Key fields | Rules |
|---|---|---|
| `destinations` | `slug` unique, `name`, `name_bn`, `tagline`, `description`, `hero_media_id`, `accent` (`SEA`, `FOREST`, `LAKE`, `HILL`, `HERITAGE`, `NEUTRAL`), `latitude`, `longitude`, `map_zoom`, `content` JSONB (about, best time, how to get there), `sort_order`, `is_active` | Never deleted; hidden with `is_active` |
| `spots` | `destination_id`, `slug` unique per destination, `name`, `name_bn`, `kind` (`BEACH`, `HILL`, `LAKE`, `RIVER`, `WATERFALL`, `FOREST`, `TEA_GARDEN`, `ISLAND`, `HERITAGE`, `PARK`, `MARKET`, `OTHER`), `description`, `hero_media_id`, coordinates, `open_hours` JSONB, `entry_info`, `content` JSONB (rules, safety, tips), `sort_order`, `is_active` | |
| `emergency_contacts` | `destination_id`, `label`, `label_bn`, `phone`, `kind` (`NATIONAL`, `POLICE`, `FIRE`, `HOSPITAL`, `COAST_GUARD`, `DESK`, `OTHER`), `sort_order` | Public numbers entered by the operator |
| `spot_alerts` | `destination_id`, `spot_id` nullable, `kind` (`WEATHER`, `SEA`, `CLOSURE`, `EVENT`, `NOTICE`), `severity` (`INFO`, `CAUTION`, `DANGER`), `title`, `body`, `starts_at`, `ends_at`, `created_by` | Shown while now is inside the window |

Changes to existing tables:

- `beach_points` gains `spot_id` (unique, required) and `listing_id`. A beach point is the sunbed
  configuration of a beach spot.
- `hotels` gains `destination_id`, `spot_id` nullable, `listing_id`, `provider_id`; `zone` is
  replaced by free-text `area`; `nearest_beach_code` and `distance_meters` become nullable.
- `dining_venues` gains `destination_id`, `spot_id` nullable, `listing_id`, `provider_id`;
  `vendor_user_id` is superseded by provider membership.

Backfill migration: create Cox's Bazar, one `BEACH` spot per beach point, a provider per existing
hotel and venue (synthetic seed businesses), a listing per hotel, venue and beach point; then set
the new columns `NOT NULL` and drop `HotelZone`.

## 3. Providers and listings

| Table | Key fields | Rules |
|---|---|---|
| `providers` | `public_id`, `name`, `name_bn`, `kind_summary`, `destination_id`, `phone`, `email`, `about`, `logo_media_id`, `status` (`APPLIED`, `CHANGES_REQUESTED`, `APPROVED`, `REJECTED`, `SUSPENDED`), `payout_method_label`, `verified_at`, `commission_override_bps` nullable | Only `APPROVED` providers have public listings |
| `provider_service_types` | `provider_id`, `listing_type`, `status` | A provider lists only approved types |
| `provider_members` | `provider_id`, `user_id`, `role` (`OWNER`, `STAFF`) | Unique pair; provider scope comes from here, never from request input |
| `listings` | `public_id`, `slug`, `provider_id`, `destination_id`, `spot_id` nullable, `type` (see PRD section 4), `booking_mode` (`NIGHTS`, `TIME_SLOT`, `DEPARTURE`, `ENTRY`, `ORDER`, `QUOTE`, `INFO`), `status` (`DRAFT`, `PENDING_REVIEW`, `ACTIVE`, `CHANGES_REQUESTED`, `REJECTED`, `SUSPENDED`, `ARCHIVED`), `title`, `title_bn`, `summary`, `description`, coordinates, `attributes` JSONB (validated by the shared contract for the type), `cancellation_policy` JSONB, `from_price_minor`, `currency`, `rating_avg`, `rating_count`, `published_at` | Public reads return only `ACTIVE` listings of approved providers in active destinations |
| `listing_media` | `listing_id`, `media_id`, `sort_order`, `alt`, `alt_bn` | |
| `listing_revisions` | `listing_id`, `payload` JSONB, `status` (`PENDING`, `APPROVED`, `REJECTED`), `submitted_by`, `reviewed_by`, `reason` | Material edits to an active listing wait here; approval applies them |

Cancellation policy shape: `{ freeUntilHours, lateRefundPercent, noShowRefundPercent }`, snapshotted
on every booking.

## 4. Generic booking engine

For `TIME_SLOT`, `DEPARTURE`, `ENTRY` and package bookings of new service types. Stays, tables,
sunbeds and food orders keep their own engines.

| Table | Key fields | Rules |
|---|---|---|
| `offerings` | `listing_id`, `name`, `name_bn`, `price_minor`, `currency`, `price_unit` (`PER_BOOKING`, `PER_PERSON`, `PER_SEAT`, `PER_HOUR`, `PER_PHOTO`, `PER_PACKAGE`, `PER_TICKET`), `included_count` nullable, `extra_unit_price_minor` nullable, `duration_minutes` nullable, `capacity`, `min_qty`, `max_qty`, `is_active` | A listing has one or more offerings (ticket types, boat sizes, packages) |
| `offering_schedules` | `offering_id`, `days_of_week`, `start_times`, `valid_from`, `valid_to` | Generates slots ahead of time |
| `offering_slots` | `offering_id`, `starts_at`, `ends_at`, `capacity`, `booked`, `is_blocked` | `CHECK (0 <= booked AND booked <= capacity)`, unique `(offering_id, starts_at)`; reserved with `SELECT ... FOR UPDATE` |
| `bookings` | `public_ref`, `tourist_id`, `listing_id`, `provider_id`, `destination_id`, `spot_id`, `status` (`PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `NO_SHOW`), `total_minor`, `deposit_minor`, `balance_minor`, `currency`, `commission_bps`, `cancellation_policy` JSONB, `snapshot` JSONB (names, unit prices), `hold_expires_at`, `source` (`DIRECT`, `QUOTE`) | Every snapshot is immutable |
| `booking_lines` | `booking_id`, `offering_id`, `slot_id` nullable, `quantity`, `unit_price_minor`, `line_total_minor`, `name_snapshot` | |

A draft holds inventory for 10 minutes (`PENDING_PAYMENT` with `hold_expires_at`); payment
confirms it; expiry releases inventory exactly once.

## 5. Photographers and quotes

| Table | Key fields | Rules |
|---|---|---|
| `quote_requests` | `public_ref`, `tourist_id`, `listing_type` (`PHOTOGRAPHER`, `GUIDE`, `BOAT`, `RIDE`), `destination_id`, `spot_id`, `starts_at`, `ends_at`, `party_size`, `details` JSONB (photo, video, drone, reel; expected count; notes), `budget_minor` nullable, `budget_unit`, `bids_close_at`, `status` (`OPEN`, `CLOSED`, `ACCEPTED`, `CANCELLED`, `EXPIRED`) | Visible only to approved providers of that type in that destination |
| `bids` | `request_id`, `provider_id`, `listing_id`, `price_unit` (`PER_PHOTO`, `PER_PACKAGE`, `PER_HOUR`), `unit_price_minor`, `included_count`, `extra_unit_price_minor`, `estimated_total_minor`, `delivery_hours`, `message`, `status` (`ACTIVE`, `COUNTERED`, `WITHDRAWN`, `ACCEPTED`, `DECLINED`, `CLOSED`), `revision` | One active bid per provider per request (partial unique index); sealed |
| `bid_counters` | `bid_id`, `proposed_unit_price_minor`, `proposed_total_minor`, `message`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`) | One counter per bid |
| `jobs` | `booking_id` unique, `request_id` nullable, `provider_id`, `price_unit`, `unit_price_minor`, `included_count`, `extra_unit_price_minor`, `delivered_count`, `selected_count`, `final_total_minor`, `delivery_link`, `status` (`SCHEDULED`, `IN_PROGRESS`, `DELIVERED`, `SETTLED`, `DISPUTED`, `CANCELLED`) | Accepted bid or direct package booking becomes a job linked to a booking |
| `job_previews` | `job_id`, `media_id`, `selected` | Watermarked previews for per-photo selection |

## 6. Payments, commission, ledger, payouts

| Table | Key fields | Rules |
|---|---|---|
| `payments` (extended) | parents: `order_id`, `reservation_id`, `food_order_id`, `hotel_booking_id`, `booking_id` (exactly one); `type` (`CHARGE`, `REFUND`); `purpose` (`FULL`, `DEPOSIT`, `BALANCE`); `provider` (`SANDBOX`, later a live gateway), `method` (`BKASH`, `NAGAD`, `CARD`, `PAY_AT_VENUE`), `status` (`PENDING`, `SUCCEEDED`, `FAILED`); `amount_minor`, `commission_minor`, `provider_net_minor`, `currency`, `external_ref` unique, `idempotency_key` | Existing `MOCK` rows are relabelled `SANDBOX` by migration. `amount = commission + provider_net` |
| `commission_rules` | `listing_type`, `provider_id` nullable, `rate_bps`, `effective_from`, `effective_to` | The applicable rule is snapshotted on the booking as `commission_bps` |
| `ledger_entries` | `source_type`, `source_id`, `memo`, `posted_at`, `reverses_entry_id` nullable | Append-only |
| `ledger_lines` | `entry_id`, `account` (`GATEWAY_CLEARING`, `PROVIDER_PAYABLE`, `COMMISSION_REVENUE`, `PAYOUTS_CLEARING`), `provider_id` nullable, `debit_minor`, `credit_minor`, `currency` | Each entry balances per currency (checked on posting and by a deferred trigger) |
| `payouts` | `public_ref`, `provider_id`, `period_start`, `period_end`, `amount_minor`, `status` (`DRAFT`, `APPROVED`, `PAID`), `method_label`, `paid_at`, `reference` | Recorded by the operator; no money moves |
| `payout_items` | `payout_id`, `payment_id` | A payment is in at most one payout |

Posting rules are in [workflows.md](workflows.md) section 6.

## 7. Help: lost and found, complaints

| Table | Key fields | Rules |
|---|---|---|
| `lost_found_items` | `public_ref`, `kind` (`LOST`, `FOUND`), `destination_id`, `spot_id`, `category` (`PHONE`, `WALLET`, `BAG`, `DOCUMENT`, `KEYS`, `JEWELLERY`, `ELECTRONICS`, `CLOTHING`, `CHILD_ITEM`, `OTHER`), `title`, `public_description`, `private_details`, `occurred_from`, `occurred_to`, `reported_by`, `contact_phone`, `storage_location` (found), `status` (`OPEN`, `MATCHED`, `CLAIM_PENDING`, `RETURNED`, `EXPIRED`, `DISPOSED`, `CLOSED`), `expires_at` | `private_details` and private photos are never in public responses |
| `lost_found_media` | `item_id`, `media_id`, `is_private` | |
| `verification_questions` | `item_id`, `question`, `answer_hash` | Answers are normalised and hashed |
| `lost_found_matches` | `lost_item_id`, `found_item_id`, `score`, `status` (`SUGGESTED`, `CONFIRMED`, `DISMISSED`) | Unique pair |
| `claims` | `public_ref`, `found_item_id`, `claimant_id`, `answers_passed`, `pickup_at`, `status` (`SUBMITTED`, `VERIFIED`, `REJECTED`, `HANDED_OVER`, `CANCELLED`), `handed_over_by`, `handover_note` | One open claim per claimant per item |
| `complaints` | `public_ref`, `tourist_id`, `destination_id`, `spot_id`, `booking_ref` nullable, `provider_id` nullable, `category` (`OVERCHARGING`, `SAFETY`, `CLEANLINESS`, `LISTING_WRONG`, `PROVIDER_CONDUCT`, `PAYMENT`, `OTHER`), `description`, `status` (`OPEN`, `ACKNOWLEDGED`, `IN_PROGRESS`, `ESCALATED`, `RESOLVED`, `CLOSED`), `assigned_to` | |
| `complaint_events` | `complaint_id`, `actor_id`, `action`, `note`, `visible_to_tourist` | Append-only history |
| `desk_assignments` | `user_id`, `destination_id` | Desk staff act only inside their destinations |

## 8. Communication and engagement

| Table | Key fields | Rules |
|---|---|---|
| `conversations` | `subject_type` (`BOOKING`, `REQUEST`, `COMPLAINT`, `CLAIM`), `subject_id`, `tourist_id`, `provider_id` nullable | One conversation per subject and pair |
| `messages` | `conversation_id`, `sender_id`, `body` (max 2,000 characters), `created_at`, `read_at` | Text only |
| `notifications` | `user_id`, `kind`, `title`, `body`, `link`, `read_at` | In-app inbox items |
| `reviews` | `booking_ref` unique, `listing_id`, `provider_id`, `tourist_id`, `rating` 1-5, `body`, `reply`, `replied_at`, `status` (`PUBLISHED`, `HIDDEN`) | Only for completed bookings |
| `saved_items` | `user_id`, `item_type` (`HOTEL`, `VENUE`, `SPOT` today; target `LISTING`, `SPOT`, `PROVIDER` in WP-06/25), `item_key` (target `item_id`) | Unique triple |

## 9. Platform

| Table | Key fields | Rules |
|---|---|---|
| `users` (extended) | `phone` unique nullable, `email`, `name`, `locale`, `role` (`TOURIST`, `PROVIDER`, `DESK`, `ADMIN`) | Sign-in tables (`sessions`, `otp_codes`) arrive in the last phase |
| `media` | `owner_user_id`, `storage_key`, `mime`, `bytes`, `width`, `height`, `purpose` (`LISTING`, `DESTINATION`, `SPOT`, `PORTFOLIO`, `LOST_FOUND`, `COMPLAINT`, `JOB_PREVIEW`, `PROVIDER_DOC`), `visibility` (`PUBLIC`, `PRIVATE`), `credit`, `created_at` | Images only; private media served through an authorised endpoint |
| `settings` | `key`, `value` JSONB, `updated_by` | Commission default, deposit percent, hold minutes, lost-and-found holding days |
| `idempotency_keys` | `scope`, `key`, `request_hash`, `response`, `expires_at` | Required on every payment and booking-creating call |
| `audit_events` | unchanged | Append-only |

## 10. Indexing and search

Index every foreign key; `(destination_id, type, status)` and `(spot_id, type, status)` on
listings; `(offering_id, starts_at)` on slots; `(status, bids_close_at)` on quote requests;
`(destination_id, kind, status, category)` on lost-and-found items. Search uses PostgreSQL full
text (`tsvector` over title, title_bn, summary, spot and destination names) with trigram similarity
for typos. Distance for Nearby uses latitude and longitude with a bounding box, then a haversine
sort; PostGIS is optional.

## 11. Migration and data rules

- Prisma schema and migrations live in `packages/db/prisma`. Never edit an applied migration;
  add a new one with a backfill and a rollback note.
- Places, providers and listings are hidden, never deleted, because bookings reference them.
- Audit, ledger and payment rows are append-only; corrections are reversals.
- Seeds are synthetic and deterministic: Cox's Bazar (existing data), Sylhet and Rangamati with
  spots, providers of every type, facilities, alerts, emergency numbers and found items.
- No secrets, credentials or real personal data in seeds or fixtures.
