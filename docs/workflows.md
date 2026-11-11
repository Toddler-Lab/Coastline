# Domain Workflows

**Applies to:** bookings, tariff governance, procurement and demo finance. All authority and
monetary effects below are simulated.

## 1. Booking and inventory

Modes: `SLOT_CAPACITY` (sunbed/time slot, tour), `QUANTITY` (rental units) and `INQUIRY_ONLY`
(referral, not bookable). MVP creates one product per hold.

Booking states are `HELD`, `CONFIRMED`, `CANCELLED` and `EXPIRED`.

For a hold, the API verifies the active approved listing/product and effective tariff, then in one
database transaction locks the inventory row `FOR UPDATE`, checks quantity, decrements availability
and creates a `HELD` booking with a 10-minute expiry, an idempotency key and immutable
listing/product/price/tariff snapshots. The client never supplies an authoritative price.

Confirmation locks the booking, validates expiry and transitions exactly once. It never charges.
Expiry or cancellation restores inventory in the same transaction exactly once. A retry-safe worker
handles bounded batches.

Cancellation is free before the slot starts; inventory is restored exactly once and no refund is
issued because payment is simulated. Cancellation after the start is rejected. The applicable policy
is snapshotted on the booking.

Hotel stays follow the same rule against the hotel's check-in time on the check-in date (snapshotted
on the booking as Dhaka wall-clock `HH:mm`, default 14:00): a tourist may cancel until 60 minutes
before it; an admin may cancel later. Cancelling releases the room nights exactly once and records
the mock refund. Admin check-in marks hotel stays `CHECKED_IN` the same way as sunbed lines.

The race for the last unit yields exactly one success. Availability never goes negative; the losing
request receives `409` with safe availability refresh guidance.

### Dining (simulated)

Venue opening hours are Asia/Dhaka wall-clock hours `[open_hour, close_hour)`. Inactive venues are
hidden from tourists and cannot take reservations or orders. Kitchen and venue management is
`ADMIN`-only; there is no vendor role in MVP.

**Table reservations** are 1–3 whole hours on the hour, in the future, at most 7 days ahead, inside
opening hours, with `party_size <= seats`. Creation runs in one transaction: it snapshots venue,
table, deposit and currency, inserts one `table_slots` row per hour and, when the venue deposit is
above zero, records a mock `CHARGE`. The partial unique index on active `(table_id, slot_start)`
decides races: the loser receives `409`. States are `CONFIRMED → CHECKED_IN | CANCELLED`. A tourist
may cancel until 60 minutes before the start; an admin may cancel at any time before check-in.
Cancelling deactivates the slots (rows are kept) and records the deposit refund as a mock `REFUND`
reversal. Admin check-in is allowed from 30 minutes before the start until the end.

**Sunbed food delivery** goes only to the tourist's own sunbed booking line that is confirmed or
checked in and whose window contains now, from an open, delivering venue at the same beach point.
Prices and names come from the database and are snapshotted on the order lines; there is no delivery
fee. A mock `CHARGE` is recorded at placement. States follow
`PLACED → PREPARING → READY → DELIVERED`, with `PLACED → CANCELLED` as the only cancellation.
Each status change is a conditional update on the current status, so two racing changes cannot both
succeed; illegal moves return `409`. Cancellation (tourist or admin, from `PLACED` only) records a
mock `REFUND` reversal. Menu price changes never alter placed orders.

Reservation and food-order placement, cancellation, check-in, kitchen status changes and venue/menu
edits append audit events.

## 2. Tariff governance

A tariff version stores amount, currency, `rate_type`, unit, effective window, rationale, source
label/link, verified date, submitter, reviewer and decision/reason.

Flow: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED | CHANGES_REQUESTED`. Submitted and
approved versions are immutable; edits create a successor. Approved effective windows must not
overlap for the same product and `rate_type`.

Only an approved version inside its effective window may be shown or booked; otherwise the product
is unavailable. Existing booking snapshots never change. The badge always says “indicative demo
rate”; internal review is not legal approval.

## 3. Procurement and contract workflow

Types: `OPEN_TENDER`, `RFQ`, `AUCTION_LEASE`, `CONCESSION` and `EVENT_STALL`.

A notice includes scope, lot, indicative value, eligibility, rubric, dates/timezone, contact,
document rights and a clear non-binding demo label.

Flow: `DRAFT → REVIEW → PUBLISHED/OPEN → CLOSED → EVALUATION → RECOMMENDATION →
INTERNAL_DEMO_APPROVAL → AWARDED_DEMO → DRAFT_CONTRACT`.

Preserve bids and evaluations. An evaluator declares a conflict through an audited action
(`EVALUATOR_CONFLICT_DECLARED`); there is no separate conflict workflow in MVP. Seed at least two
synthetic evaluators. There are no real bids, deposits, public e-procurement, signatures, legal
awards or collections.

Contract dues are manually entered demo estimates and are never owed.

## 4. Finance and reconciliation

Every view and export states “SIMULATED — no money collected or owed.” There is no gateway, bank,
payout or tax computation.

Demo accounts: `CASH_CLEARING_SIM`, `PROVIDER_PAYABLE_SIM`, `PLATFORM_FEE_REVENUE_SIM`,
`PROPOSED_PUBLIC_DUES_RECEIVABLE_SIM` and `DEMO_CONTRACT_DUES_RECEIVABLE_SIM`.

The applicable `fee_rules` version supplies the platform fee `F` and proposed public share `R`. For
gross `G`, with `F + R <= G`: debit simulated clearing `G`; credit provider payable `G − F − R`,
fee revenue `F` and proposed public share `R`.

Every posted entry balances per currency and links to its source booking/contract and fee-rule
version. Corrections use reversal, never edit or delete. Reconcile snapshots to postings and display
exceptions. Use “prototype estimate,” not “amount owed.”

Contract dues are manual demo entries linked to a contract; they do not feed a calculation engine.
