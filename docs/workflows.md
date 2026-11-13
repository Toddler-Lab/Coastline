# Domain Workflows

**Applies to:** bookings, payments, dining, rate governance, procurement records and finance.

## 1. Booking and inventory

Modes: `SLOT_CAPACITY` (sunbed/time slot, tour), `QUANTITY` (rental units) and `INQUIRY_ONLY`
(referral, not bookable).

Booking states are `HELD`, `CONFIRMED`, `CANCELLED` and `EXPIRED`.

The hold model below is the target for provider-listed inventory. The services implemented today
(sunbeds, hotel stays, table reservations, food orders) have no hold step: one request reserves
the inventory and records the charge in a single transaction, and the shared checkout page
([design.md](design.md) section 7.5) holds the selection in the browser until the visitor pays.

For a hold, the API verifies the active approved listing/product and effective rate, then in one
database transaction locks the inventory row `FOR UPDATE`, checks quantity, decrements availability
and creates a `HELD` booking with a 10-minute expiry, an idempotency key and immutable
listing/product/price/rate snapshots. The client never supplies an authoritative price.

Confirmation locks the booking, validates expiry, takes payment through the payment provider
(section 2) and transitions exactly once. Expiry or cancellation restores inventory in the same
transaction exactly once. A retry-safe worker handles bounded batches.

Cancellation is free until the cut-off before the slot starts; inventory is restored exactly once
and a full refund is recorded through the payment provider. Cancellation after the cut-off is
rejected for visitors. The applicable policy is snapshotted on the booking.

Hotel stays follow the same rule against the hotel's check-in time on the check-in date (snapshotted
on the booking as Dhaka wall-clock `HH:mm`, default 14:00): a visitor may cancel until 60 minutes
before it; an admin may cancel later. Cancelling releases the room nights exactly once and records
the refund. Admin check-in marks hotel stays `CHECKED_IN` the same way as sunbed lines.

The race for the last unit yields exactly one success. Availability never goes negative; the losing
request receives `409` with safe availability refresh guidance. The interface keeps the rest of the
visitor's selection and names the unit that was lost ([design.md](design.md) section 7.1).

### Dining

Venue opening hours are Asia/Dhaka wall-clock hours `[open_hour, close_hour)`. Inactive venues are
hidden from visitors and cannot take reservations or orders. Kitchen and venue management is
`ADMIN`-only; there is no vendor role yet.

**Table reservations** are 1–3 whole hours on the hour, in the future, at most 7 days ahead, inside
opening hours, with `party_size <= seats`. Creation runs in one transaction: it snapshots venue,
table, deposit and currency, inserts one `table_slots` row per hour and, when the venue deposit is
above zero, records a `CHARGE` through the payment provider. The partial unique index on active
`(table_id, slot_start)` decides races: the loser receives `409`. States are
`CONFIRMED → CHECKED_IN | CANCELLED`. A visitor may cancel until 60 minutes before the start; an
admin may cancel at any time before check-in. Cancelling deactivates the slots (rows are kept) and
records the deposit refund as a `REFUND` reversal. Admin check-in is allowed from 30 minutes before
the start until the end.

**Sunbed food delivery** goes only to the visitor's own sunbed booking line that is confirmed or
checked in and whose window contains now, from an open, delivering venue at the same beach point.
Prices and names come from the database and are snapshotted on the order lines; there is no delivery
fee. A `CHARGE` is recorded at placement. States follow
`PLACED → PREPARING → READY → DELIVERED`, with `PLACED → CANCELLED` as the only cancellation.
Each status change is a conditional update on the current status, so two racing changes cannot both
succeed; illegal moves return `409`. Cancellation (visitor or admin, from `PLACED` only) records a
`REFUND` reversal. Menu price changes never alter placed orders.

Reservation and food-order placement, cancellation, check-in, kitchen status changes and venue/menu
edits append audit events.

## 2. Payments

All charges and refunds go through one payment-provider port with two operations: charge and
refund. Each payment record stores the provider, method, amount in minor units, currency, status
and the provider's reference.

- **Sandbox adapter (the only adapter today).** It approves charges and refunds immediately and
  moves no money. It behaves like a live provider in every other respect: same statuses, same
  records, same receipts, same idempotency. The interface does not label it.
- **No credentials.** While the sandbox adapter is active, checkout offers a method list and a pay
  button only. The platform never renders, accepts, stores or logs card numbers, CVVs, wallet PINs
  or one-time codes. Those belong to a licensed gateway's hosted page.
- **Idempotency.** Charge and refund requests carry an idempotency key; a retry returns the first
  result.
- **Failure.** A declined or failed charge leaves the booking unconfirmed and the inventory
  released or still held under its expiry; the visitor is told they were not charged.
- **Going live.** A live gateway adapter is a separate change that needs a contracted provider,
  security review and the go-live gate in [delivery-plan.md](delivery-plan.md). Startup refuses the
  sandbox adapter in production unless it is explicitly allowed
  ([operations.md](operations.md)).

Current code records the provider as `MOCK` and accepts `paymentMethod: 'MOCK'`; the rename to
`SANDBOX` with real method values is WP-07 of [implementation-plan.md](implementation-plan.md).

## 3. Rate governance

A rate version stores amount, currency, `rate_type`, unit, effective window, rationale, source
label/link, verified date, submitter, reviewer and decision/reason.

Flow: `DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED | CHANGES_REQUESTED`. Submitted and
approved versions are immutable; edits create a successor. Approved effective windows must not
overlap for the same product and `rate_type`.

Only an approved version inside its effective window may be shown or booked; otherwise the product
is unavailable. Existing booking snapshots never change. A rate is shown with its source and
verified date. Platform review is an internal check, not a legal approval, and is never worded as
an official tariff.

## 4. Procurement and contract records

Types: `OPEN_TENDER`, `RFQ`, `AUCTION_LEASE`, `CONCESSION` and `EVENT_STALL`.

A notice includes scope, lot, estimated value, eligibility, rubric, dates/timezone, contact and
document rights.

Flow: `DRAFT → REVIEW → PUBLISHED/OPEN → CLOSED → EVALUATION → RECOMMENDATION →
INTERNAL_APPROVAL → RECOMMENDED_AWARD → DRAFT_CONTRACT`.

The platform records the process and its outcome as a recommendation. It does not issue legal
awards, take deposits, collect signatures or replace a public e-procurement system; any binding
step happens outside the platform, and the interface says so on the notice.

Preserve bids and evaluations. An evaluator declares a conflict through an audited action
(`EVALUATOR_CONFLICT_DECLARED`); there is no separate conflict workflow yet.

Contract dues are entered manually and linked to a contract; they do not feed a calculation engine.

## 5. Finance and reconciliation

There is no bank, payout or tax computation. Finance views and exports show each record's payment
provider as a data field, so records from the sandbox adapter are never read as collected money.

Accounts: `CASH_CLEARING`, `PROVIDER_PAYABLE`, `PLATFORM_FEE_REVENUE`,
`PUBLIC_DUES_RECEIVABLE` and `CONTRACT_DUES_RECEIVABLE`.

The applicable `fee_rules` version supplies the platform fee `F` and public share `R`. For gross
`G`, with `F + R <= G`: debit clearing `G`; credit provider payable `G − F − R`, fee revenue `F` and
public share `R`.

Every posted entry balances per currency and links to its source booking/contract and fee-rule
version. Corrections use reversal, never edit or delete. Reconcile snapshots to postings and display
exceptions.
