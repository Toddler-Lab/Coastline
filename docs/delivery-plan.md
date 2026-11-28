# Delivery Plan

Branch `dev` (v2 redesign merged from `redesign/v2` and `design/drone-landing`). Detail per work package is in
[implementation-plan.md](implementation-plan.md).

## 1. Milestones

| Milestone | Work packages | Status on `dev` | What can be shown |
|---|---|---|---|
| M1 New look | WP-01 to WP-04 | Partial (UI tokens, shells, scopes, web Vitest; missing CI, Playwright, `/dev/components`) | New light and dark design, visitor and workspace shells with Help button |
| M2 Places | WP-05 to WP-09 | Partial (Places API, Explore/Destination/Spot hubs, lists, listing detail, search; missing WP-06 generic listings & WP-07 uploads) | Explore, Cox's Bazar, Sylhet, Rangamati, spot hubs, lists, listing pages, search |
| M3 One checkout | WP-10 to WP-13 | Partial (`SANDBOX` port, idempotency, `/checkout/quote`, `/checkout/[draft]`, `/trips`, restacked sunbed picker; missing ledger, commission, checkout sessions) | Shared checkout flow, Trips timeline, new sunbed picker |
| M4 More services | WP-14, WP-15 | Open | Boats, rides, tours, entry tickets bookable |
| M5 Portals | WP-16 to WP-19 | Partial (Provider Today/bookings/kitchen/dining editor, Desk scan/arrivals, Admin overview/destinations read-only/bookings) | Providers run dining and view bookings; admin overview and destinations |
| M6 Help | WP-20 to WP-23 | Partial (emergency contacts, active spot alerts, Help sheet; missing lost-and-found & complaints backend) | Emergency numbers, alerts banner, Help sheet |
| M7 Engagement | WP-24, WP-25 | Partial (`/saved` API + UI; `/inbox` UI placeholder; missing messaging, notifications, reviews) | Saved items |
| M8 Photographers | WP-26 to WP-28 | UI preview only (`/photographers` static client preview; no API/DB) | Interactive photographer marketplace preview |
| M9 Release quality | WP-29 to WP-31 | Partial (cookie-backed EN/BN switch on Hub/nav; missing full Bangla copy, Playwright/a11y/perf pass, clean-up) | EN/BN switch on Hub pages |
| M10 Sign-in | WP-32 | Open | Phone sign-in replaces the account switcher |

Each milestone ends with a working site, so the project can be presented after any of them.

## 2. Release acceptance

- A destination, spot, provider and listing created through the portals appear on Explore without
  code changes, and disappear when hidden; past bookings stay readable.
- Every booking mode books through one checkout and produces a ticket in Trips.
- No oversell under concurrent requests; snapshots never change.
- Every payment records gross, commission and provider net; ledger entries balance; refunds and
  payouts are traceable.
- Photographer bids are sealed and jobs settle on the actual photo count.
- Lost-and-found claims need verification and a recorded handover; private details never leak.
- Help is one tap from every visitor screen.
- All checks in implementation-plan.md section 3 pass.

## 3. Walkthrough (10 minutes)

1. Explore -> Sylhet -> Ratargul -> book a boat -> pay -> ticket.
2. Cox's Bazar -> Laboni Beach -> book a sunbed -> order food to it.
3. Post a photographer request -> bids -> accept -> deliver -> select 25 photos -> pay balance.
4. Report a lost phone; desk logs a found phone; match; claim; handover.
5. Admin: commission earned today, a payout draft, the audit trail of the steps above.
6. Admin adds Bandarban with a spot; a provider lists a guide there; it appears on Explore.

## 4. Go-live gate

Before real public use: sign-in complete; live payment adapter approved and reviewed; provider
agreements covering commission and payouts; privacy, retention and support processes; hosting,
backups and security assessment. Coastline stays an independent platform with no government
endorsement.
