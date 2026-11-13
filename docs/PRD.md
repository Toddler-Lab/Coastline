# Product Requirements Document (PRD)

**Status:** product baseline · **Audience:** product, design, engineering, stakeholder reviewers

## 1. Product summary

Coastline (Smart Cox's Bazar) is a web platform, with an Android app to follow, for discovering and
booking coastal tourism services along the Cox's Bazar shoreline: sunbeds, restaurant tables, food
delivered to a sunbed and hotel stays. Staff use it to check guests in, run a kitchen queue and
manage beach points. Back-office modules for listing review, rates, procurement records and finance
reporting are planned.

Coastline is run by an independent operator. It is not a government service and must not present
itself as one. It is built to be publishable: nothing in the interface marks it as a test or a
presentation build.

Payments run through a payment-provider port. Until a licensed gateway is contracted, the only
adapter is a sandbox adapter that approves and refunds without moving money. The visitor-facing
flow is complete and identical to the live one.

## 2. Goals and non-goals

### Goals

1. A visitor can go from opening the site to holding a sunbed ticket in five screens or fewer, on a
   phone, one-handed.
2. Visitors can reserve a table, order food to a booked sunbed and book a hotel stay through one
   shared checkout.
3. Staff can check in a guest from a scanned ticket in one action.
4. Providers manage listing content; platform staff review it before public display.
5. Rates have version history, a named source and a review status.
6. Every booking, payment record and refund is traceable to source records and audit events.
7. The web interface is responsive from 320 px to desktop and follows
   [design.md](design.md), which is shared with the Android app (Kotlin, Jetpack Compose).

### Non-goals (current release)

A live payment gateway, settlement or payouts; legally valid tariff or permit decisions; government
system or identity integration; binding procurement awards or contracts; live transport dispatch;
dynamic pricing; visitor-written reviews; provider or bid file uploads; in-app notifications.

## 3. People

Visitor; provider owner/manager/staff; beach attendant and desk staff; listing reviewer; rate
reviewer; procurement officer/evaluator; finance analyst/admin; platform administrator. Permissions
are specified in [security.md](security.md).

## 4. Functional requirements

- **FR-01 Catalogue:** browse and filter by service, beach point, price and availability; display
  provider, terms, price source and the date it was last verified. Listing images use seeded or
  remote URLs; there is no upload UI.
- **FR-02 Provider listings:** providers create/edit drafts and submit versions; a reviewer
  approves, requests changes, rejects or suspends; only approved active listings are public.
- **FR-03 Inventory booking:** bookings for slot-capacity or quantity inventory never oversell
  under concurrency. A booking snapshots names, prices and the cancellation policy. Cancellation is
  free until the published cut-off before the start, restores inventory exactly once and records a
  full refund through the payment provider. Cancellation after the cut-off is blocked for visitors.
- **FR-04 Checkout and payment:** one checkout for every service: review, payment method, pay,
  ticket. Payment is taken through the payment-provider port with an idempotency key. The sandbox
  adapter is the only adapter in this release; it must not collect card numbers, CVVs, wallet PINs
  or one-time codes.
- **FR-05 Rates:** immutable versions with amount/unit/currency/effective dates/source/
  verification/review; each version has a `rate_type`, and a booking retains the rate snapshot.
- **FR-06 Procurement records:** tender, RFQ, auction/lease and concession notices; bids,
  evaluation, recommendation and draft contract. The platform records the process; any legally
  binding award happens outside it. Conflict declarations are recorded in the audit trail. Contract
  dues are entered manually.
- **FR-07 Finance:** double-entry ledger of payment-provider records, revenue and dues figures, and
  reconciliation to booking/contract source using versioned fee rules. No calculation engine for
  contract dues in this release.
- **FR-08 Reporting:** filterable summaries and CSV exports with a generated timestamp and the
  payment provider named in a column.
- **FR-09 Audit:** record privileged state transitions with actor, time, reason and safe
  before/after.
- **FR-10 Quality:** responsive, accessible interface in English and Bangla; documented
  REST/OpenAPI; seeded data free of real personal data.
- **FR-11 Tickets:** every confirmed booking has a signed QR ticket that opens without a
  connection once viewed and can be validated by staff.
- **FR-12 Release control:** unreleased services (rides, water sports) are behind feature flags and
  are absent from navigation while off.

## 5. Services and boundaries

Released: sunbeds at the six beach points (Laboni, Sugandha, Kolatoli, Himchari, Inani, Teknaf);
dining (venue and menu browsing, hourly table reservation with an optional deposit, food delivery
to a sunbed the visitor has booked at the same beach point, a reservation desk and kitchen queue
for staff); hotel stays.

Planned behind flags: rides and local transport, water sports and activities. Planned back-office:
provider listings and review, rate governance, procurement records, finance ledger and reporting.

Only services with a product booking mode of `SLOT_CAPACITY` or `QUANTITY` are bookable; directory
entries use `INQUIRY_ONLY`. Prices are set by the operator or provider and are shown with their
source; they are not presented as official tariffs.

## 6. Non-functional requirements

TypeScript; PostgreSQL constraints and transactional consistency; API authorization; auditable
privileged changes; mobile-first layout on Material window size classes; WCAG 2.2 AA; keyboard and
screen-reader operability; no secrets or real personal/payment data in seeds or logs; all
timestamps stored UTC and rendered Asia/Dhaka; Explore usable within 2.5 s on a mid-range phone on
4G.

## 7. Assumptions and open decisions

Beach point coordinates are approximate until authoritative GIS is supplied. The "dbx" provider,
hosting, map-tile licence, payment gateway, messaging vendor and production operator are undecided.
Legal tariff and procurement rules are outside the platform. Session handling for the Android
client is undecided. Do not infer official authority.

## 8. Acceptance summary

See [delivery-plan.md](delivery-plan.md) for testable gates. Critical outcomes: no inventory
oversell; immutable price history on bookings; provider isolation; review workflows; ledger
balancing/reconciliation; no test or presentation wording in any user-facing surface; no payment
credential fields while the sandbox adapter is active; complete audit for privileged transitions;
the design acceptance checklist in [design.md](design.md) section 18 passes.
