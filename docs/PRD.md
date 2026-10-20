# Product Requirements Document (PRD)

**Status:** MVP proposal baseline · **Audience:** product, design, engineering, stakeholder reviewers

## 1. Product summary

Smart Cox’s Bazar is a proposed web platform for discovering and booking coastal tourism services
and demonstrating governance workflows for listings, indicative tariffs, procurement and revenue
transparency. The initial area is the central beach. There is no formal government involvement or
endorsement. The product is a demonstrator, not an authorized public service.

## 2. Goals and non-goals

### Goals

1. Visitors can discover services and make an instant inventory booking.
2. Providers manage listing content; platform staff review it before public display.
3. Indicative rates have version history, provenance and review status.
4. Demonstrate mixed procurement/tender workflows and prototype contract-dues tracking.
5. Trace simulated service transactions and prototype public-revenue estimates to source records.
6. Deliver a responsive web MVP in under 12 weeks with 2–4 developers; Android is later.

### Non-goals

Real payments/refunds/settlement; legally valid tariff/permit decisions; government system or
identity integration; binding procurement/awards/contracts; hotel room reservations; live transport
dispatch; native Android; live map dependency; dynamic pricing; user-generated reviews; provider or
bid file uploads; in-app notifications.

## 3. Personas

Visitor; provider owner/manager/staff; listing reviewer; tariff reviewer; procurement
officer/evaluator; finance analyst/admin; platform administrator. Permissions are specified in
[security.md](security.md).

## 4. Functional requirements

- **FR-01 Catalogue:** browse/filter by category, zone, indicative price and availability; display
  provider, terms, source and verification date. Listing images use seeded or remote URLs; there is
  no upload UI.
- **FR-02 Provider listings:** providers create/edit drafts and submit versions; reviewer approves,
  requests changes, rejects or suspends; only approved active listings are public.
- **FR-03 Inventory booking:** one product per hold; a 10-minute hold; confirmation, expiry and
  cancellation for slot-capacity or quantity inventory; prevent oversell under concurrency. Booking
  states are `HELD`, `CONFIRMED`, `CANCELLED` and `EXPIRED`. Cancellation is free before the slot
  starts and restores inventory exactly once; there is no refund because payment is simulated.
  Cancellation after the start is blocked.
- **FR-04 Demo checkout:** simulate success/failure state only; no gateway, credentials, collection,
  payout or refund.
- **FR-05 Tariffs:** immutable versions with amount/unit/currency/effective dates/source/
  verification/review; each version has a `rate_type`, and booking retains the tariff snapshot.
- **FR-06 Procurement:** demonstrate tender, RFQ, auction/lease and concession notices; bids,
  evaluation, recommendation and draft contract; non-binding. Conflict declarations are recorded
  in the audit trail. Contract dues are manually entered demo estimates.
- **FR-07 Finance:** double-entry simulated ledger, prototype revenue/dues estimates and
  reconciliation to booking/contract source using versioned fee rules. No calculation engine for
  contract dues in MVP.
- **FR-08 Reporting:** filterable summaries and watermarked CSV exports with generated timestamp.
- **FR-09 Audit:** record privileged state transitions with actor, time, reason and safe
  before/after.
- **FR-10 Quality:** responsive accessible English UI, Bangla-ready text structure, documented
  REST/OpenAPI, synthetic demo data.

## 5. Service catalogue and MVP boundaries

Sunbeds/umbrellas, mats/lockers, water activities, bicycle/scooter rentals, guided tours, local
transport fare references, food/vendor directory, public facilities, hotel/guesthouse referral
directory and concession/event-stall opportunities. Hotel stays are not bookable; transport has no
dispatch; fare references are indicative and must state assumptions. Only services with a product
booking mode of `SLOT_CAPACITY` or `QUANTITY` are bookable; directory and referral entries use
`INQUIRY_ONLY`.

## 6. Non-functional requirements

TypeScript; PostgreSQL constraints and transactional consistency; API authorization; auditable
privileged changes; mobile-first layout; keyboard accessibility; no secrets or real
personal/payment data in demo; all timestamps stored UTC and rendered Asia/Dhaka.

## 7. Assumptions and open decisions

Central beach boundary is approximate until authoritative GIS is supplied. “dbx” provider, hosting,
map/messaging vendor, legal tariff/procurement rules and production operator are undecided. BDT is
illustrative only. MVP has no file uploads, notifications or real integrations. Listing imagery is
seeded or remote-URL based. Cancellation is free before start with no refund; contract dues are
manual demo entries. Do not infer official authority.

## 8. MVP acceptance summary

See [delivery-plan.md](delivery-plan.md) for testable gates. Critical outcomes: no inventory oversell;
immutable tariff/booking price history; provider isolation; review workflows; ledger
balancing/reconciliation; visible simulation disclaimers; complete audit for privileged transitions.
