# Delivery Plan and Release Acceptance

## 1. Where the product stands

Implemented: sunbed booking with QR tickets and desk check-in, dining (venues, table reservations,
food to a sunbed, reservation desk, kitchen queue), hotel stays, beach point administration,
seeded accounts and the sandbox payment records.

Not yet implemented: the redesigned interface in [design.md](design.md), stable sign-in, the
payment-provider port as a named interface, idempotency keys, feature flags, a CI workflow, web
tests, a translation layer, provider listings and review, rate governance, procurement records,
the finance ledger and reporting, and the Android app.

## 2. Redesign workstream

The work is split into 25 work packages (WP-00 to WP-24) in
[implementation-plan.md](implementation-plan.md), each one reviewable change that leaves the site
working. That file has the scope, files, tests and completion test of every package, the decisions
to confirm first, and the progress table. The milestones:

| Milestone | Work packages | Outcome |
|---|---|---|
| M1 Clean and themed | WP-00 to WP-06, WP-10 | CI and web test runners; design tokens, light and dark themes, new fonts and breakpoints; component library; new navigation shell; translation layer; copy pass with an automated copy check; rides and activities behind feature flags. Nothing marks the product as unfinished |
| M2 New visitor journey | WP-07 to WP-09, WP-11 to WP-15 | Payment-provider port with the sandbox adapter and `GET /payments/methods`; idempotency keys; beach point photos; Explore with the shoreline strip; map page; sunbed booking with the bed strip; shared checkout; Trips and tickets with redirects from the old routes |
| M3 All services and operations | WP-16 to WP-20 | Dining and hotels on the new components and checkout; account, search and information pages; Operations shell, Today, Scan, bookings, beach points and kitchen |
| M4 Release ready | WP-21 to WP-23 | Bangla, accessibility pass, responsive, end-to-end and performance suites, clean-up of retired code |
| M5 Sign-in | WP-24 | Email and password accounts replace the account switch; gated by security review |
| M6 Android | Steps A1 to A5 | Kotlin and Compose app |

M1 can ship on its own. After WP-01, three tracks run in parallel: web foundation (WP-02 to
WP-06), API (WP-07 to WP-10) and, once the shell is merged, Operations (WP-19, WP-20).

Assign one owner for schema/migrations and one for web/design integration; review shared contracts
before parallel edits. The payment contract change keeps a compatibility branch for the old
request value from WP-07 until WP-23, so the web app and the API never break each other between
merges.

## 3. Android workstream

Starts once M2 has settled the tokens, routes and contracts. Detail is in
[implementation-plan.md](implementation-plan.md) section 8.

1. Session mechanism for a native client decided and reviewed ([security.md](security.md)).
2. `designsystem` module: `CoastlineTheme`, tokens and the components of design.md section 9.
3. API client generated from the OpenAPI document.
4. Visitor journeys in the same order as the web: Explore, sunbed booking, checkout, tickets,
   dining, hotels.
5. Staff scanning, as a mode in the same app or a separate app (open decision).

## 4. Back-office backlog

Provider membership and listing editor with a review queue; products, inventory and rate
proposal/review; procurement notices, lots, bids, evaluation and recommendation; draft contracts
and manually entered dues; double-entry ledger, reconciliation and reports; audit search. These
follow [workflows.md](workflows.md) and are scheduled after the redesign.

## 5. Release acceptance

Only approved listings and effective approved rates are public; provider isolation is enforced;
the last-unit race has one winner; expiry and cancellation restore inventory once and record the
refund once; price snapshots are immutable; a declined payment leaves no confirmed booking;
procurement records are traceable and worded as recommendations; posted journals balance and
reverse; audit has actor/time/reason; migrations, seeds and OpenAPI are reproducible.

Interface acceptance is the checklist in [design.md](design.md) section 18: responsive at every
size class, light and dark, English and Bangla, no test or presentation wording, no authority
claims, no payment credential fields, accessible by keyboard and screen reader.

No upload, notification, live payment gateway or government integration is required for this
release.

## 6. Presentation script

Open Explore on a phone-sized window and pick Kolatoli on the shoreline strip; book two beds for
two hours; pay; show the ticket. From the ticket, order food to the bed and follow it on the
tracking page. Reserve a table. Switch to a staff account: scan the ticket and check the guest in;
move the food order through the kitchen board; open Today for arrivals and revenue. Resize the
window from phone to desktop to show the same pages across size classes, then switch theme and
language.

## 7. Go-live gate

A public launch needs, at minimum: a decision on payments, either a contracted, licensed gateway
adapter with its security review or a deliberate, recorded choice to run with the sandbox adapter
for a closed pilot ([operations.md](operations.md)); stable sign-in with seeded accounts disabled;
published terms and privacy pages carrying the operator's final text (not the "being finalised"
notice) with retention and deletion handling; a recorded source and licence for every photo; a confirmed map-tile
licence; hosting with TLS, backups and a tested restore; a security assessment; support and safety
operations; and written agreements for any provider, authority or government relationship the
product mentions. Passing release acceptance is not a legal approval.
