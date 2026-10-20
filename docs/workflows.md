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

The race for the last unit yields exactly one success. Availability never goes negative; the losing
request receives `409` with safe availability refresh guidance.

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
