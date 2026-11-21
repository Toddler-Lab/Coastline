# Implementation Plan: v2 Redesign

**Audience:** engineers and coding agents · **Baseline:** branch `dev` at `3e9f8a9` · **Working
branch:** `redesign/v2` · **Last revised:** 2026-11-17

This plan turns [design.md](design.md), [data-model.md](data-model.md), [workflows.md](workflows.md)
and [api.md](api.md) into ordered work packages (WPs). Each WP is one reviewable change that leaves
the site building and working. [delivery-plan.md](delivery-plan.md) holds the milestone summary.

How to use it: take the lowest-numbered open WP whose dependencies are done, read its section and the
documents it cites, do exactly that scope, run the checks in section 3, then tick it in section 6.

## 1. Baseline (`dev`, verified 2026-11-17)

| Area | Fact |
|---|---|
| Web | Next.js 16.4 App Router, React 19, Tailwind CSS v4 with a dark-only `@theme` (`abyss`, `sea`, `foam`, ...), MapLibre, SWR. Home is a full-screen map with a beach rail on the left and a booking panel on the right. No web tests |
| Routes | `/`, `/bookings`, `/bookings/[ref]`, `/food`, `/food/[code]`, `/food/orders/[ref]`, `/food/reservations/[ref]`, `/hotels`, `/hotels/[slug]`, `/rides`, `/activities`, `/admin`, `/admin/bookings`, `/admin/points`, `/admin/points/[code]`, `/admin/dining/*` |
| API | Controllers: `beach-points`, `orders`, `admin` (overview, beach-points, orders, tickets), `hotels`, `dining/*`, `admin/dining/*`, `session`, `demo/users`, health. Empty placeholder module folders from the first proposal |
| Data | Four migrations. `BeachPoint` is the root; `HotelZone` enum; `payments.provider = 'MOCK'` written directly by the sunbed, hotel, reservation and food-order services; roles `TOURIST`, `ADMIN` |
| Auth | Seeded-account cookie sent as `x-demo-user-id` when `DEMO_AUTH_ENABLED=true` |
| Gaps | No CI, no idempotency keys, no payment port, admin forms call missing `/admin/beach-points` and `/admin/sunbeds` write routes, no uploads, no notifications |

The first redesign attempt is preserved on the `wp/*` branches (`wp/api-track` holds a
payment-provider port and idempotency keys; `wp/02-tokens`, `wp/03-components`, `wp/04-shell` hold
tokens and components). Those branches target the old design. A WP may cherry-pick code from them
when it fits this plan, with a review, but must not bring back the old structure.

## 2. Ground rules

1. Follow [AGENTS.md](../AGENTS.md). Before writing Next.js code read the matching guide in
   `apps/web/node_modules/next/dist/docs/`; this Next.js version differs from older ones.
2. One WP per pull request into `redesign/v2`. The site builds and tests pass after each one.
3. UI uses role tokens and shared components only (design.md sections 3 and 8). No raw colours.
4. Contract changes land in `packages/api-contracts`, the API, the web app and tests together.
5. Migrations are forward-only with a backfill and a rollback note. Never edit an applied one.
6. Money and inventory changes come with concurrency and ledger tests.
7. Every privileged transition writes an audit event.
8. New dependencies are named in the pull request with the reason.
9. Report checks that were actually run; list gaps separately.

## 3. Checks

```bash
pnpm format:check
pnpm typecheck
pnpm db:validate
pnpm test
pnpm build
```

From WP-01 on, also the web unit tests and Playwright. For UI WPs, check changed pages at 360, 768
and 1280 px, light and dark, by keyboard.

## 4. Order

```text
Phase A  Foundation        WP-01 -> WP-02 -> WP-03 -> WP-04
Phase B  Places, listings  WP-05 -> WP-06 -> WP-07 -> WP-08 -> WP-09
Phase C  Booking, money    WP-10 -> WP-11 -> WP-12 -> WP-13
Phase D  New services      WP-14 -> WP-15
Phase E  Portals           WP-16 -> WP-17 -> WP-18 -> WP-19
Phase F  Help              WP-20 -> WP-21 -> WP-22 -> WP-23
Phase G  Engagement        WP-24 -> WP-25
Phase H  Photographers     WP-26 -> WP-27 -> WP-28
Phase I  Release quality   WP-29 -> WP-30 -> WP-31
Phase J  Sign-in           WP-32
```

After Phase B, the API work of one phase can run in parallel with the UI work of the previous one.

## 5. Work packages

### Phase A: Foundation

#### WP-01 Quality harness (M)
- **Scope:** CI workflow running the checks; Vitest + Testing Library in `apps/web`; Playwright with
  a seeded database; remove the empty placeholder module folders in `apps/api/src/modules`.
- **Done when:** CI runs on pull requests; one web unit test and one Playwright smoke test pass.

#### WP-02 Tokens, theme and type (M)
- **Scope:** role tokens for light and dark and the destination accents (design.md 3.2) in
  `globals.css`; Inter and Hind Siliguri via `next/font`; theme switch (system, light, dark) with a
  no-flash script; breakpoints. Old token names stay mapped to new roles until WP-31.
- **Done when:** every existing page renders in light and dark without unreadable text.

#### WP-03 Component library (L)
- **Scope:** foundations and patterns from design.md section 8 under `components/ui` and
  `components/patterns`, on Radix primitives; a `/dev/components` gallery page available only in
  local.
- **Tests:** keyboard and focus tests for sheet, dialog, tabs, chips, steppers.
- **Done when:** gallery shows every component in both themes at 360 and 1280 px.

#### WP-04 Workspace shells and roles (M)
- **Scope:** visitor shell (top bar, bottom bar, Help button and sheet), provider, desk and admin
  shells with sidebars; workspace switcher; roles `TOURIST`, `PROVIDER`, `DESK`, `ADMIN`;
  `provider_members` and `desk_assignments` tables (minimal) so guards can scope; seeded accounts
  for each role; guards `@Roles`, `ProviderScope`, `DeskScope`.
- **Done when:** the switcher moves between workspaces; each shell renders its navigation; a
  tourist gets `403` on provider, desk and admin routes.

### Phase B: Places and listings

#### WP-05 Destinations and spots (M)
- **Scope:** `destinations`, `spots`, `emergency_contacts`, `spot_alerts`; backfill Cox's Bazar and
  one beach spot per beach point; `beach_points.spot_id`; `hotels.destination_id` and `area`
  replacing `HotelZone`; `dining_venues.destination_id`; places module with public endpoints
  (api.md section 3); seeds for Sylhet and Rangamati.
- **Tests:** migration on empty and on seeded `dev` data; endpoints; hidden destination behaviour.

#### WP-06 Providers and listings core (L)
- **Scope:** `providers`, `provider_service_types`, `listings`, `listing_media`,
  `listing_revisions`; backfill a provider and listing for each hotel, venue and beach point; shared
  contracts per listing type; `GET /listings`, `GET /listings/{id}`, `GET /providers/{id}`.
- **Tests:** only active listings of approved providers in active destinations are public; backfill
  counts match.

#### WP-07 Media uploads (M)
- **Scope:** `media` table, storage port with the local adapter, `POST /media`, public and private
  serving, `sharp` processing, limits from security.md section 4.
- **Tests:** type sniffing, size limits, EXIF removal, private media authorisation.

#### WP-08 Explore, destination and spot pages (L)
- **Scope:** `/`, `/d/[destination]`, `/d/[destination]/s/[spot]` per design.md 7.1-7.3, using the
  hub endpoint; alerts banner; emergency contacts; Nearby list with facilities (seeded
  `FACILITY` listings); old `/` map moves behind `/sunbeds/[beachPoint]` (unchanged UI for now).
- **Done when:** journeys from Explore to any spot work at 360 and 1280 px; a destination added in
  the database appears with no code change.

#### WP-09 Lists, listing detail and search (L)
- **Scope:** `/d/[destination]/[service]`, `/d/[destination]/s/[spot]/[service]`, `/l/[listing]`,
  `/search` with full-text and trigram search, `/nearby`; filter bar and sheet; list and map
  toggle; existing hotel and venue detail content moved into the listing detail shape; redirects
  from `/hotels*` and `/food*`.
- **Tests:** search ranking basics, filters, redirects.

### Phase C: Booking and money

#### WP-10 Payment port, checkout, commission and ledger (L)
- **Scope:** payments port and `SANDBOX` adapter; `commission_rules`, `ledger_entries`,
  `ledger_lines`, `settings`; extend `payments` (parents, purpose, method, status, commission,
  provider net; relabel `MOCK` to `SANDBOX`); `/checkout` endpoints and sandbox gateway; refactor the
  sunbed, hotel, reservation and food-order services to create pending bookings paid through
  checkout; `Idempotency-Key` on all creating calls (may cherry-pick from `wp/api-track`).
- **Tests:** commission rounding, ledger balance per currency, refund reversal, idempotent retries,
  declined payment leaves inventory held until expiry.

#### WP-11 Checkout UI and tickets (M)
- **Scope:** `/checkout/[draft]` flow (design.md 7.8) with the gateway screen; receipt; ticket
  component; offline cache of tickets.
- **Done when:** sunbed, stay, table and food order all pay through the new checkout.

#### WP-12 Trips (M)
- **Scope:** `GET /trips`, `GET /trips/{ref}` aggregating all engines; `/trips` and `/trips/[ref]`
  pages; redirects from `/bookings*` and `/food/orders|reservations/*`.
- **Done when:** every existing booking type appears in one timeline with its ticket.

#### WP-13 Existing engines in the new UI (L)
- **Scope:** sunbed picker restacked (beach chips and time controls on top, full-width map,
  accessible bed list, summary bar) at `/sunbeds/[beachPoint]`; stay booking flow; table
  reservation and food-to-sunbed flows in the listing detail and flow shapes. Map camera driven by
  destination coordinates instead of fixed Cox's Bazar bounds.
- **Done when:** the old three-column map layout and its components are no longer used.

### Phase D: New services

#### WP-14 Generic offering engine (L)
- **Scope:** `offerings`, `offering_schedules`, `offering_slots`, `bookings`, `booking_lines`;
  slot generation job; hold expiry job; `POST /bookings`, availability, cancel, check-in, no-show;
  engine registered with checkout and trips.
- **Tests:** last-seat race, expiry releases once, cancellation refunds per policy.

#### WP-15 Rides, boats, tours, activities, tickets UI (M)
- **Scope:** booking inputs for `TIME_SLOT`, `DEPARTURE` and `ENTRY` in listing detail and flow;
  seeds for each type in all three destinations; redirects from `/rides` and `/activities`.
- **Done when:** a Kaptai Lake boat departure and an eco-park ticket book end to end.

### Phase E: Portals

#### WP-16 Provider onboarding and approvals (M)
- **Scope:** application flow, document upload (private media), admin approval queue with
  request-changes and reject; service-type approval; members.
- **Done when:** a new applicant becomes an approved provider of chosen types.

#### WP-17 Provider workspace (L)
- **Scope:** Today, listing editor adapting to booking mode, revisions, calendar and blocking,
  bookings with check-in and cancel, scan, kitchen and table desk moved from admin to the venue's
  members, engine-specific setup (rooms, menu, tables, sunbeds).
- **Tests:** provider isolation (another provider's IDs return `404`), staff limits.

#### WP-18 Admin console (L)
- **Scope:** overview; destinations and spots editor (photos, accent, content, ordering, help
  contacts); listing and revision approvals with a diff; bookings; users and roles; settings; audit
  search. Retire `/admin/points` and `/admin/dining/*` pages in favour of the provider workspace.
- **Done when:** the acceptance walkthrough step "admin creates a destination" passes.

#### WP-19 Earnings, payouts and finance (M)
- **Scope:** provider earnings page; admin payments, refunds, commission rules, ledger view,
  payouts (draft, approve, mark paid), CSV export with the payment provider column.
- **Tests:** payout netting with pay-at-venue commission; a payment in at most one payout.

### Phase F: Help

#### WP-20 Alerts, emergency and Know content (S)
- **Scope:** desk and admin alert management; emergency page; Know sections on spots.

#### WP-21 Lost and found (L)
- **Scope:** tables from data-model.md section 7; report lost and found, public board, matching
  job, claims with hashed answers and lockout, handover, expiry and disposal; tourist pages and
  Trips Reports tab.
- **Tests:** private fields never public; claim brute-force lockout; handover closes other claims.

#### WP-22 Complaints (M)
- **Scope:** report form, statuses, notes with visibility, escalation, reopen, link to booking and
  refund.

#### WP-23 Desk workspace (M)
- **Scope:** scan and check-in, lost-and-found desk screens, complaints queue, alerts; scope by
  `desk_assignments`.

### Phase G: Engagement

#### WP-24 Inbox, messages and notifications (M)
- **Scope:** conversations, messages, notifications; inbox pages for visitor and provider;
  notifications emitted by bookings, payments, matches, complaints and alerts; unread badge.

#### WP-25 Reviews and saved (S)
- **Scope:** reviews after completion with provider reply and admin hide; rating recalculation;
  saved items and `/saved`.

### Phase H: Photographers

#### WP-26 Photographer profiles and packages (M)
- **Scope:** `PHOTOGRAPHER` listings with per-photo, per-package and per-hour offerings, portfolio,
  `/photographers/[provider]`, direct package booking creating a job.

#### WP-27 Requests, bids and counters (L)
- **Scope:** `quote_requests`, `bids`, `bid_counters`; request flow and page; provider requests
  board and bid form; sealed visibility; counter; acceptance transaction with deposit booking;
  closing job; notifications.
- **Tests:** sealed bids, one active bid per provider, concurrent acceptance, expiry.

#### WP-28 Jobs, delivery and settlement (M)
- **Scope:** `jobs`, `job_previews`; deliver with watermarked previews or a link; tourist
  selection; balance payment or refund; auto-settle job; disputes resolved by admin; guide and
  charter requests reuse the flow.
- **Tests:** settlement arithmetic for each unit, auto-settlement, dispute outcome in the ledger.

### Phase I: Release quality

#### WP-29 Bangla and English (M)
- **Scope:** message catalogue, language switch, Bangla numerals and money format, `name_bn`
  fields shown when Bangla is selected; layout check with Bangla text.

#### WP-30 Accessibility, responsive, end to end, performance (M)
- **Scope:** the Playwright journeys in testing.md section 2; accessibility automation; performance
  budget from design.md section 12.

#### WP-31 Clean-up (S)
- **Scope:** remove old tokens, components and routes not covered by redirects; update README and
  docs to the final state.

### Phase J: Sign-in

#### WP-32 Sign-in (L)
- **Scope:** phone and one-time code (email optional), sessions, CSRF, rate limits, account page;
  disable the seeded-account switcher outside local; migrate seeded accounts.
- **Done when:** every journey passes with real sign-in and the switcher is off in staging.

## 6. Progress

**Immersive Hub pass (2026-11-21).** ADR-003 was accepted and its amendments applied to
`docs/design.md`. The Explore, destination and spot-hub pages on branch `design/drone-landing` now use
the full-viewport drone stage, nested spot backgrounds, fly-through navigation and the documented
section order. Language selection moved from per-component state to a cookie-backed shared provider.
A minimal Vitest + Testing Library harness was added to `apps/web` (the rest of WP-01, including
Playwright journeys, is still open). No API, contract or schema change was made. See
`docs/design-drone-landing.md` section 7 for the detailed implementation status.

**UI pass (2026-11-17).** The whole web app was rebuilt on the v2 design against the existing API,
with no API, contract or schema change. What it covers and what each WP still owes:

| Area | Delivered in the UI pass | Still open |
|---|---|---|
| WP-02 tokens | Role tokens light/dark, destination accents, Inter + Hind Siliguri, theme cookie (no flash) | Old token names were removed, not mapped |
| WP-03 components | `components/ui` and `components/patterns`; sheets use the native modal `<dialog>` instead of Radix | `/dev/components` gallery; keyboard/focus tests (no web test runner yet, WP-01) |
| WP-04 shells | Visitor top/bottom bar, Help button and sheet, provider/desk/admin shells, workspace switcher | Roles `PROVIDER`/`DESK`, scopes and guards; staff workspaces open to `ADMIN` only |
| WP-08/09 places | Explore, destination, spot hub, service lists, listing detail, search, redirects | Places come from `lib/places.ts` (Cox's Bazar descriptor + beach points as spots) until WP-05/06; no facility data, no list/map toggle |
| WP-11/12/13 booking | Shared checkout with sandbox gateway screen, stay/table/food flows, restacked sunbed picker, Trips and ticket | Booking is created on Approve (no pending draft or payment port, WP-10); no offline ticket cache |
| WP-17/18/23 portals | Provider Today, bookings, kitchen, listing/menu editor; desk scan and arrivals; admin overview, destinations (read-only), bookings | Every "Soon" item in the sidebars |

| WP | Title | Done |
|---|---|---|
| 01 | Quality harness | ☐ |
| 02 | Tokens, theme and type | ☐ |
| 03 | Component library | ☐ |
| 04 | Workspace shells and roles | ☐ |
| 05 | Destinations and spots | ☐ |
| 06 | Providers and listings core | ☐ |
| 07 | Media uploads | ☐ |
| 08 | Explore, destination and spot pages | ☐ |
| 09 | Lists, listing detail and search | ☐ |
| 10 | Payment port, checkout, commission, ledger | ☐ |
| 11 | Checkout UI and tickets | ☐ |
| 12 | Trips | ☐ |
| 13 | Existing engines in the new UI | ☐ |
| 14 | Generic offering engine | ☐ |
| 15 | Rides, boats, tours, tickets UI | ☐ |
| 16 | Provider onboarding and approvals | ☐ |
| 17 | Provider workspace | ☐ |
| 18 | Admin console | ☐ |
| 19 | Earnings, payouts and finance | ☐ |
| 20 | Alerts, emergency, Know content | ☐ |
| 21 | Lost and found | ☐ |
| 22 | Complaints | ☐ |
| 23 | Desk workspace | ☐ |
| 24 | Inbox, messages, notifications | ☐ |
| 25 | Reviews and saved | ☐ |
| 26 | Photographer profiles and packages | ☐ |
| 27 | Requests, bids and counters | ☐ |
| 28 | Jobs, delivery and settlement | ☐ |
| 29 | Bangla and English | ☐ |
| 30 | Accessibility, responsive, e2e, performance | ☐ |
| 31 | Clean-up | ☐ |
| 32 | Sign-in | ☐ |

## 7. Risks

| Risk | Mitigation |
|---|---|
| Backfill migrations break existing bookings | Run each on a copy of seeded `dev` data in tests; keep engines' tables intact |
| Payment refactor touches four services' transactions | One engine at a time behind the `BookableEngine` interface, with tests before switching the UI |
| Scope is large for the team | Phases are independently demonstrable; stop after any phase with a working product |
| Uploaded images leak private data | EXIF stripping, private media endpoint, watermarking, tests |
| Sealed bids leak through list endpoints | Dedicated tests on every bid-returning endpoint |
| No sign-in until the end | Guards and scopes are real from WP-04; the switcher is refused in production |
| Recorded sandbox payments read as real money | Payment provider field on every receipt, export and finance view |
