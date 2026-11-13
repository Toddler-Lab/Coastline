# Implementation Plan: Redesign and Publishable Release

**Audience:** engineers and coding agents doing the work · **Status:** plan, no code changed yet ·
**Baseline:** branch `dev` at commit `3e9f8a9`, inspected 2026-11-13

This plan turns [design.md](design.md) into ordered work packages. Each work package (WP) is one
reviewable change that leaves the site working. [delivery-plan.md](delivery-plan.md) holds the
milestone summary and release gates; this file holds the detail.

How to use it: take the lowest-numbered WP whose dependencies are done, read its section and the
design sections it cites, do exactly that scope, run the checks in section 4, then tick it in
section 11.

## 1. Baseline: what the code is today

Verified by reading the repository, not assumed.

| Area | Fact |
|---|---|
| Web | Next.js 16.4.2 (App Router, `next build --webpack`), React 19.3, Tailwind CSS 4.3 with an `@theme` block in `apps/web/src/app/globals.css`, `lucide-react`, `maplibre-gl` 6, `swr`, `react-qr-code`. About 84 `.tsx` files, 10,800 lines |
| Web routes | `/` (map and bed picker), `/bookings`, `/bookings/[ref]`, `/food`, `/food/[code]`, `/food/orders/[ref]`, `/food/reservations/[ref]`, `/hotels`, `/hotels/[slug]`, `/rides`, `/activities`, `/admin`, `/admin/bookings`, `/admin/points`, `/admin/points/[code]`, `/admin/dining` and four sub-pages |
| Web session | `apps/web/src/proxy.ts` sets a default seeded-account cookie (`coastline_demo_user`); `lib/api.ts` sends it as the `x-demo-user-id` header |
| API | NestJS 11 under `/api/v1`. Controllers: `beach-points`, `orders`, `admin` (overview, beach-points, orders, tickets), `hotels`, `dining/*`, `admin/dining/*`, `session`, `demo/users`, health |
| Payments | No payment module. Four services write `payments` rows directly with `provider = 'MOCK'` and `externalRef = 'MOCK-…'`: `orders.service.ts`, `hotels.service.ts`, `reservations.service.ts`, `food-orders.service.ts`. `PaymentStatus` has one value, `SUCCEEDED`. Create requests accept `paymentMethod?: 'MOCK'`; the hotel request has no payment field |
| Booking model | No hold step. Creating an order reserves inventory and records the charge in one transaction |
| Database | Prisma schema with four applied migrations (`init`, `hotel_bookings`, `dining_foundation`, `hotel_booking_check_in_time`) |
| Tests | API only: Vitest specs against a PostgreSQL test database. The web app has no test runner |
| Scripts that exist | `pnpm dev`, `build`, `typecheck`, `test`, `format`, `format:check`, `db:up`, `db:down`, `db:setup`, `db:generate`, `db:migrate`, `db:migrate:dev`, `db:seed`, `db:validate`, `db:reset` |

Gaps found while inspecting, each assigned to a work package:

| Gap | Assigned |
|---|---|
| `.github/workflows` is empty: there is no CI, although the docs describe CI gates | WP-01 |
| No web unit tests, no Playwright, no lint script | WP-01 |
| No translation layer; all strings are written in components | WP-05 |
| No `Idempotency-Key` handling anywhere in the API | WP-08 |
| `BeachPointSummary` has no image field; the Explore hero needs a photo per beach point | WP-09 |
| API error messages contain presentation wording that reaches the screen ("Choose a demo user to continue.") | WP-06 |
| The web admin forms call `POST /admin/beach-points`, `PATCH /admin/beach-points/{id}` and `/admin/sunbeds/{id}`; no matching controller route was found on `dev` | WP-20, verify first |
| `APP_ENV` accepts the value `demo` in `env.validation.ts`; the docs now list `local`, `staging`, `production` | WP-10 |
| Root `package.json` description and the first comment of `schema.prisma` call the project a demonstrator | WP-06 |
| The hotel booking sheet shows a fee line that the API does not return ("Coastal Tourism VAT & Service") | WP-17 |

## 2. Decisions to confirm before starting

Status on 2026-11-13: D6, D7 and D9 were answered by the project owner. The others proceed on the
recommended default until someone says otherwise; a different answer changes only the WPs listed.

| # | Decision | Recommended default | Status | Affects |
|---|---|---|---|---|
| D1 | Route renames: `/food` → `/dining`, `/bookings` → `/trips`, bed picking on `/sunbeds/[pointCode]`, map on `/map` | Accept, with permanent redirects | Default assumed | WP-11 to WP-16 |
| D2 | Typeface: Anek Latin and Anek Bangla | Accept | Default assumed | WP-02 |
| D3 | Accessible primitives for sheet, dialog, tabs and radio group | Add Radix primitives, as design.md section 9 states. This adds dependencies to `apps/web` | Default assumed | WP-03 |
| D4 | Translation mechanism | A small in-house dictionary (`en.json`, `bn.json`, a typed `t()` helper, a locale cookie). No library until routing by locale is needed | Default assumed | WP-05 |
| D5 | Offline ticket on the web | Cache the last opened tickets in the browser and render them when the network fails. A full installable web app is out of scope | Default assumed | WP-15 |
| D6 | Legal pages (`/terms`, `/privacy`) | Build the pages; the operator supplies the text. No invented legal wording | **Decided: default.** Pages ship with their structure and a short "being finalised" notice until the operator's text arrives | WP-18 |
| D7 | Where the Android code lives | A separate repository that consumes the OpenAPI document and the token table | **Deferred.** Not needed until M6; nothing in M1 to M5 depends on it | Section 8 |
| D8 | Payment methods offered by the sandbox adapter | `BKASH`, `NAGAD`, `CARD`, as text labels without logos | Default assumed | WP-07, WP-14 |
| D9 | Photos for the six beach points | Operator supplies six licensed photo URLs; seeds use them | **Decided: source them online**, under the rules in WP-09 | WP-09 |

## 3. Ground rules for every work package

1. Follow [AGENTS.md](../AGENTS.md). Before writing Next.js code, read the matching guide in
   `apps/web/node_modules/next/dist/docs/`: this Next.js version differs from older ones, including
   redirects, the proxy file and font loading.
2. One WP per pull request. The site builds, type-checks and passes tests after each one.
3. Components use role tokens only. No raw hex values, no old token names, no new utility that
   repeats a retired one.
4. No banned word from design.md section 12.2 enters a user-facing string. After WP-06 the copy
   check enforces this.
5. Migrations are forward-only. Never edit an applied migration; add a new one and note the
   rollback or mitigation in the pull request.
6. Contract changes land in `packages/api-contracts`, the API, the web app and the tests in the
   same pull request.
7. New dependencies are named in the pull request with the reason. This plan lists the ones it
   expects (section 9).
8. Do not report a check as passed unless it was run. State gaps separately from failures.

## 4. Checks

Run from the repository root after every WP:

```bash
pnpm format:check
pnpm typecheck
pnpm db:validate
pnpm test
pnpm build
```

From WP-01 onward, also the web unit tests and the Playwright suite it adds. Manual check for every
WP that touches the interface: the changed pages at 360, 600, 840 and 1200 px wide, in light and
dark themes, by keyboard.

## 5. Order and milestones

```text
WP-00 ─ WP-01 ─┬─ WP-02 ─ WP-03 ─ WP-04 ─┬─ WP-05 ─ WP-06 ──────────────── M1
               │                         │
               ├─ WP-10                  ├─ WP-11 ─ WP-12
               │                         │     └─── WP-13 ─┐
               └─ WP-07 ─ WP-08 ─────────┼─────────────────┴─ WP-14 ─ WP-15 ─ M2
                  WP-09 ─────────────────┘                       ├─ WP-16
                                                                 ├─ WP-17
                                                                 └─ WP-18
                                         WP-04 ─ WP-19 ─ WP-20 ───────────── M3
                                         all of the above ─ WP-21 ─ WP-22 ─ WP-23 ─ M4
                                         security review ─ WP-24 ──────────── M5
```

| Milestone | Contains | Result |
|---|---|---|
| M1 Clean and themed | WP-00 to WP-06, WP-10 | New look, new navigation, no presentation wording, unreleased services hidden. Pages keep their current structure |
| M2 New visitor journey | WP-07 to WP-09, WP-11 to WP-15 | Explore, sunbed booking, shared checkout, tickets and Trips to the new design |
| M3 All services and operations | WP-16 to WP-20 | Dining, hotels, account pages and Operations to the new design |
| M4 Release ready | WP-21 to WP-23 | Bangla, accessibility, responsive and end-to-end suites, clean-up |
| M5 Sign-in | WP-24 | Email and password accounts replace the account switch |
| M6 Android | Section 8 | Kotlin and Compose app |

Three tracks can run in parallel after WP-01: web foundation (WP-02 to WP-06), API (WP-07 to
WP-10), and, once WP-04 is merged, Operations (WP-19, WP-20). Sizes are relative: S is under a
day, M is two to three days, L is about a week for one engineer.

## 6. Work packages

### WP-00 Confirm decisions and freeze the baseline (S)

- **Goal:** record answers to section 2 in this file and create the working branch from `dev`.
- **State:** D6, D7 and D9 are recorded. D1 to D5 and D8 run on their defaults.
- **Done when:** section 2 has a status in every row (it does) and the working branch exists.

### WP-01 Quality harness (M)

- **Goal:** CI and web test runners exist before the rebuild starts.
- **Create:** `.github/workflows/ci.yml` running the commands of section 4 with a PostgreSQL 16
  service; `apps/web/vitest.config.ts` and a `test` script for component and helper tests;
  `apps/web/playwright.config.ts` with two projects, a 360 × 740 phone viewport and a 1280 × 800
  desktop viewport; one smoke journey (open `/`, book a bed, see the ticket) written against the
  current interface so later WPs must keep it passing or update it deliberately.
- **Dependencies added:** `vitest`, `@testing-library/react`, `jsdom`, `@playwright/test` in
  `apps/web`.
- **Done when:** CI is green on an untouched branch and fails when a test is broken on purpose.

### WP-02 Tokens, themes and type (M)

- **Design:** sections 3, 4 and 5.1.
- **Modify:** `apps/web/src/app/globals.css`: replace the `@theme` block with the role tokens for
  light and dark, type roles, radii, elevation and spacing; set breakpoints `medium` 600 px,
  `expanded` 840 px, `large` 1200 px and remove the Tailwind defaults; remove the utilities
  `label`, `panel`, `hairline`, `grid-paper`, `corner-ticks`; remove `--banner-height`; restyle the
  MapLibre control overrides and the `.point-marker`, `.bed-marker`, `.state-dot` rules to role
  tokens. `apps/web/src/app/layout.tsx`: load Anek Latin and Anek Bangla, drop Bricolage
  Grotesque, Manrope and IBM Plex Mono, set `themeColor` per scheme, add the `data-theme`
  attribute with a no-flash inline script.
- **Class rename across all components** (mechanical, in this order so the old and new `surface`
  never collide):

  | Old | New | Note |
  |---|---|---|
  | `surface` | `surface-container-lowest` | Do this first |
  | `abyss` | `surface` | As a background. `text-abyss` on a filled control becomes `text-on-primary` or `text-on-tertiary`: review each |
  | `deep` | `surface-container` | |
  | `raised` | `surface-container-high` | |
  | `foam` | `on-surface` | |
  | `mist` | `on-surface-variant` | |
  | `sea`, `sea-deep` | `primary` | |
  | `sand` | `tertiary` | Only where it marks "yours"; otherwise `on-surface-variant` |
  | `coral`, `danger` | `error` | |
  | `warn` | `warning` | |
  | `line` | `outline-variant` | |
  | `line-strong` | `outline` | |
  | `font-mono` | removed | Add `tabular-nums` where the text is a number or code |
  | `sm:` `md:` `lg:` `xl:` | `medium:` `expanded:` `large:` | Review each; the widths differ |

- **Also:** raise every font size under 12 px to at least `label-medium`; remove `uppercase` and
  letter-spacing classes; remove `backdrop-blur`.
- **Tests:** a unit test that parses `globals.css` and asserts every role in design.md section 3.2
  exists for both themes.
- **Done when:** no old token name, default breakpoint prefix or sub-12 px size remains in
  `apps/web/src` (checked by search); every page renders in both themes with readable contrast.
  Layouts may still look like the old structure.

### WP-03 Component library (L)

- **Design:** sections 9 and 11.
- **Create or rebuild in `apps/web/src/components/ui/`:** `button`, `icon-button`, `chip`,
  `stepper`, `text-field` (from `field`), `radio-list`, `tabs`, `sheet`, `dialog`, `snackbar` (from
  `toast`), `banner`, `status-badge` (from `badge`), `card`, `summary-bar`, `skeleton`,
  `empty-state`, `error-state` (from `states`), `money`, `data-table`. Remove `panel` once nothing
  imports it.
- **Rules:** 48 px targets, focus ring, both themes, keyboard operable, no hover-only behaviour.
  `sheet` becomes a centred dialog at `expanded` width.
- **Dependencies added (D3):** Radix primitives for dialog, tabs and radio group.
- **Tests:** unit tests for keyboard behaviour and accessible names of each interactive component;
  `money` formatting cases from design.md section 12.3.
- **Done when:** existing pages compile against the new components; a temporary route
  `/admin/components` (staff only, removed in WP-23) shows every component in both themes.

### WP-04 Application shell (M)

- **Design:** sections 5.2, 6.1 and 7.8.
- **Create:** `components/site/top-bar.tsx`, `navigation-bar.tsx`, `navigation-rail.tsx`,
  `account-menu.tsx`; rebuild `site-footer.tsx` with the independence line and links to About,
  Help, Terms and Privacy.
- **Delete:** `components/brand/demo-banner.tsx`; the "Demo" pill and "Dev" badges in
  `site-header.tsx`; `site-header.tsx` itself once replaced.
- **Modify:** `components/brand/persona-switch.tsx` becomes the "Switch account" list inside
  `account-menu`, shown only when the API returns seeded accounts; `app/layout.tsx` uses the new
  shell; four destinations only. Until WP-11 to WP-15 land, the destinations point at the current
  routes: Explore → `/`, Map → `/`, Trips → `/bookings`, Account → the account menu. Dining and
  Hotels stay reachable from a temporary service row on the home page.
- **Tests:** Playwright: bottom bar at 360 px, rail at 700 px, top bar at 1280 px; four items; no
  horizontal scroll.
- **Done when:** the banner, pill and badges are gone and navigation matches design.md section 5.2
  at each size class.

### WP-05 Translation layer and formatters (M)

- **Design:** sections 12.3 and 12.4.
- **Create:** `apps/web/src/lib/i18n/` with `en.json`, `bn.json`, a typed `t(key, params)` helper
  for server and client components, and a locale cookie read in `layout.tsx` to set `lang`.
- **Modify:** `lib/format.ts` and `components/dining/dining-format.ts`: one money formatter
  (`৳1,250`), 12-hour Dhaka times, "Today / Tomorrow / Sat 14 Nov" dates, Bangla digits for the
  `bn` locale.
- **Scope:** infrastructure and the shell strings only. Page strings move in WP-06.
- **Tests:** formatter unit tests for both locales; a test that `en.json` and `bn.json` have the
  same keys.
- **Done when:** the language switch changes the shell between English and Bangla.

### WP-06 Copy pass and copy check (L)

- **Design:** section 12.
- **Modify:** every page and component with user-facing text (about 150 strings were found): move
  strings to translation keys and apply the replacement table. Includes page `metadata`, toasts,
  empty and error states, `components/booking/api-offline.tsx`, the hotel copy that claims
  authority, `lib/booking.ts` payment labels, and all Operations pages.
- **API:** reword messages that reach the screen, starting with
  `common/auth/demo-auth.guard.ts` ("Sign in to continue."). Update the specs that assert the old
  text.
- **Elsewhere:** root `package.json` description; the opening comment of `schema.prisma` (a
  comment change, not a migration).
- **Create:** the copy check: a Playwright test that visits every route in both roles and fails
  when rendered text, the title or the description contains a banned word; a unit test that scans
  `en.json` and `bn.json` values for the same list.
- **Done when:** the copy check passes and is part of CI. Internal identifiers
  (`DEMO_AUTH_ENABLED`, `x-demo-user-id`, `/demo/users`) may remain until WP-24; they are not shown
  to users.

### WP-07 Payment-provider port and sandbox adapter (L)

- **Design:** [workflows.md](workflows.md) section 2, [api.md](api.md), design.md section 7.5.
- **Create:** `apps/api/src/modules/payments/`: `payment-provider.ts` (interface with `charge` and
  `refund`, each taking amount, currency, method, reference and idempotency key),
  `sandbox-payment.provider.ts`, `payments.service.ts` (writes the `payments` row inside the
  caller's transaction), `payments.controller.ts` with `GET /payments/methods`, `payments.module.ts`.
- **Modify:** `orders.service.ts`, `hotels.service.ts`, `reservations.service.ts`,
  `food-orders.service.ts` call `PaymentsService` instead of creating rows; `env.validation.ts`
  adds `PAYMENT_PROVIDER` (default `sandbox`) and `ALLOW_SANDBOX_PAYMENTS` and refuses to start in
  production with the sandbox adapter unless it is allowed.
- **Contracts:** add `PAYMENT_METHODS = ['BKASH', 'NAGAD', 'CARD']`; `paymentMethod` on the four
  create requests (new on `CreateHotelOrderRequest`); `PaymentDto` gains `method` and
  `status: 'SUCCEEDED' | 'FAILED'`. For this WP the API still accepts the old value `'MOCK'` and
  an absent method, so the current web app keeps working; WP-14 switches the web app and WP-23
  removes the old value.
- **Migration `payments_provider_and_method`:** add nullable `method`; change the `provider`
  default to `SANDBOX`; update existing rows from `MOCK` to `SANDBOX`; add `FAILED` to
  `PaymentStatus`; rewrite stored references from `MOCK-` to `SBX-`. Update `seed.ts`,
  `seed-dining.ts`, `hotels-seed.ts`.
- **Tests:** adapter approves and refunds; a declining test double leaves no confirmed booking and
  releases inventory in all four services; `GET /payments/methods`; production start-up guard;
  serializers never expose a credential field.
- **Done when:** no service writes `payments` directly and no `MOCK` string remains outside the
  compatibility branch.

### WP-08 Idempotency keys (M)

- **Design:** [api.md](api.md) section 1.
- **Create:** migration `idempotency_keys` (unique `(scope, key)`, request hash, response status
  and body, expiry); an interceptor applied to `POST /orders`, `POST /hotels/bookings`,
  `POST /dining/reservations`, `POST /dining/food-orders`. The header is optional until WP-14
  sends it, then required.
- **Tests:** same key and body returns the first response without a second booking; same key and a
  different body returns `409`.
- **Done when:** a double-submitted payment creates one booking and one charge.

### WP-09 Catalogue additions for Explore (S)

- **Create:** migration `beach_point_image` adding nullable `image_url`, `image_alt` and
  `image_credit` to beach points; seed values; `imageUrl`, `imageAlt` and `imageCredit` on
  `BeachPointSummary`; the image host added to `images.remotePatterns` in `next.config.ts`
  (`images.unsplash.com` is already allowed).
- **Photo sourcing (D9, decided: from online sources).** One photo per beach point: Laboni,
  Sugandha, Kolatoli, Himchari, Inani, Teknaf.
  1. Use only sources whose licence allows commercial use without a fee: Unsplash, Pexels, or
     Wikimedia Commons files under CC0, CC BY or CC BY-SA. A photo found through an image search,
     a news site, a travel blog or social media is not usable, whatever it shows.
  2. The photo must show that beach point, confirmed from the source's caption or location, not
     guessed. If no usable photo of a point exists, use a clearly Cox's Bazar shoreline photo and
     write alt text that does not name the point. Never a generic tropical beach (design.md
     section 3.7).
  3. Landscape, at least 1600 px wide, no recognisable faces in the foreground, no watermark.
  4. Record each choice in a table added to this section: beach point, page URL, image URL,
     author, licence, date retrieved. Where the licence requires attribution (CC BY, CC BY-SA),
     store it in `image_credit` and show it on the hero and on `/about`.
  5. Write alt text that describes what is in the picture.
  The same rules apply to venue and hotel photos already in the seeds; check their sources while
  doing this and replace any that fail rule 1.
- **Verify:** the `409` returned when a bed is taken names the lost bed in `details`; if it does
  not, add `details.sunbedIds`.
- **Tests:** catalogue spec covers the new fields; conflict spec asserts the details.
- **Done when:** `GET /beach-points` returns a photo for each point, the sourcing table above is
  filled in for all six, and conflicts identify the bed.

### WP-10 Feature flags and release guards (S)

- **Design:** section 6.1; [operations.md](operations.md) section 1.
- **Modify:** `/rides` and `/activities` return not-found unless `FEATURE_RIDES` or
  `FEATURE_ACTIVITIES` is true; navigation omits them. Decide the `APP_ENV` value `demo`: keep it
  accepted as an alias of `staging` or remove it, and make `.env.example` and operations.md agree.
- **Delete:** `components/ui/under-development-module.tsx` and its sample figures once the pages
  no longer use it.
- **Tests:** flagged-off routes answer 404; flagged-on routes render.
- **Done when:** a default build shows no trace of the two services.

### WP-11 Explore and the shoreline strip (L)

- **Design:** sections 8.1 and 10.1.
- **Create:** `components/explore/shoreline-strip.tsx`, `beach-hero.tsx`, `active-booking-card.tsx`,
  `service-row.tsx`, `venue-row.tsx`, `hotel-row.tsx`; `lib/selected-point.ts` (the chosen beach
  point in a cookie and the `?point=` parameter, so server components can read it).
- **Modify:** `app/page.tsx` becomes Explore. Data: `GET /beach-points`, `GET /dining/venues`
  filtered by point, `GET /hotels` filtered by `nearestBeachCode`, and `GET /orders/me` for the
  active booking.
- **Not in scope:** the map (WP-12) and bed picking (WP-13). The hero button links to the current
  picker until WP-13 lands.
- **Tests:** strip keyboard behaviour as a radio group; Explore at phone and desktop widths; no
  map script requested on first load at phone width.
- **Done when:** Explore matches the wireframe in both layouts and meets the first-load budget of
  design.md section 15.

### WP-12 Map page (M)

- **Design:** section 8.8.
- **Create:** `app/map/page.tsx` with the list sheet (phone) and list pane (desktop).
- **Modify:** `components/map/coast-map.tsx` and `map-canvas.tsx`: load on demand, pins for beach
  points with filter chips for venues and hotels, token-styled controls, a list equivalent for
  every pin.
- **Done when:** everything reachable on the map is reachable from the list by keyboard.

### WP-13 Sunbed booking (L)

- **Design:** sections 7.1, 8.2 and 10.2.
- **Create:** `app/sunbeds/page.tsx` (beach point list), `app/sunbeds/[pointCode]/page.tsx`;
  `components/sunbeds/bed-strip.tsx`, `bed-cell.tsx`, `bed-legend.tsx`, `start-hour-chips.tsx`,
  `booking-summary.tsx`; `components/ui/date-strip.tsx` (moved from `booking/date-strip.tsx`).
- **Reuse:** selection and pricing logic in `lib/booking.ts`; availability from
  `GET /beach-points/{code}?date=`.
- **Retire (delete in WP-23):** `components/booking/beach-map-experience.tsx`, `booking-panel.tsx`,
  `bed-picker.tsx`, `time-picker.tsx`, `point-rail.tsx`, `booking-summary.tsx`, `bed-legend.tsx`,
  `lib/map-layout.ts` if the map page no longer needs it.
- **Tests:** bed cell states and accessible names; selection survives a date or time change when
  the bed is still free; a `409` keeps the rest of the selection and names the lost bed; maximum
  of `MAX_BEDS_PER_ORDER` beds and `MAX_HOURS_PER_ITEM` hours.
- **Done when:** a visitor can go from Explore to "Continue" one-handed at 360 px.

### WP-14 Shared checkout (L)

- **Design:** sections 7.5 and 8.3.
- **Create:** `app/checkout/page.tsx`; `lib/checkout/draft.ts`: a `CheckoutDraft` union
  (`sunbed`, `table`, `food`, `stay`) saved in session storage by the service pages and read by
  checkout; `lib/checkout/submit.ts`, which calls the matching create endpoint with the chosen
  method and an `Idempotency-Key`; `components/checkout/order-review.tsx`,
  `payment-method-list.tsx`, `pay-button.tsx`.
- **Modify:** the sunbed page, `reservation-panel.tsx`, `food-order-panel.tsx` and
  `hotel-booking-sheet.tsx` stop calling create endpoints and hand a draft to checkout instead. A
  table with no deposit confirms from the venue page without checkout.
- **Rules:** the total shown comes from the draft; if the created order's total differs, show the
  new total and ask again before the ticket. No credential field of any kind.
- **Tests:** each draft type pays and lands on its ticket; double press creates one order;
  declined payment keeps the draft; the automated check that checkout has no card, PIN or code
  input.
- **Done when:** all four services pay through `/checkout` and no component sends
  `paymentMethod: 'MOCK'`.

### WP-15 Trips and tickets (L)

- **Design:** sections 7.6, 7.7, 8.4 and 8.5.
- **Create:** `app/trips/page.tsx`, `app/trips/sunbeds/[ref]/page.tsx`,
  `app/trips/tables/[ref]/page.tsx`, `app/trips/food/[ref]/page.tsx`,
  `app/trips/stays/[ref]/page.tsx`; `components/trips/ticket.tsx`, `ticket-qr.tsx` (moved),
  `trip-row.tsx`, `receipt.tsx`, `cancel-sheet.tsx`, `order-timeline.tsx` (moved);
  `lib/trips.ts`, which merges `GET /orders/me`, `GET /dining/reservations/me` and
  `GET /dining/food-orders/me` into one dated list; the browser ticket cache (D5).
- **Redirects (permanent):** `/bookings` → `/trips`, `/bookings/[ref]` → `/trips/sunbeds/[ref]`,
  `/food/orders/[ref]` → `/trips/food/[ref]`, `/food/reservations/[ref]` →
  `/trips/tables/[ref]`.
- **Retire:** `app/bookings/*`, `app/food/orders/*`, `app/food/reservations/*`,
  `components/booking/booking-card.tsx`, `cancel-order.tsx`, `components/dining/my-food-orders.tsx`,
  `my-reservations.tsx`, `food-order-card.tsx`, `food-order-cancel.tsx`, `reservation-cancel.tsx`.
- **Tests:** list grouping and order; redirects; ticket opens with the network disabled after one
  visit; cancel states the refund amount and respects the cut-off; "Order food to this bed" shows
  only while the booking is active.
- **Done when:** every booking type has a ticket page and the old routes redirect.

### WP-16 Dining (M)

- **Design:** sections 7.2, 7.3 and 8.6.
- **Create:** `app/dining/page.tsx`, `app/dining/[venueCode]/page.tsx`; redirect `/food` →
  `/dining` and `/food/[code]` → `/dining/[code]`.
- **Modify:** `venue-discovery.tsx`, `venue-card.tsx`, `venue-detail-view.tsx`, `menu-list.tsx`,
  `food-cart.tsx`, `reservation-panel.tsx`, `food-order-panel.tsx` to the new components and the
  Menu / Reserve tabs; the beach point filter reads the shoreline selection.
- **Done when:** both dining journeys run from Explore and from a sunbed ticket to a ticket or
  tracking page.

### WP-17 Hotels (M)

- **Design:** sections 7.4 and 8.7.
- **Modify:** `hotel-discovery.tsx`, `hotel-card.tsx`, `hotel-detail-view.tsx`,
  `hotel-booking-sheet.tsx`: new components, date and room choice, hand-off to checkout. Remove
  the fee line the API does not return; itemise only amounts from `HotelBookingDto`.
- **Done when:** a stay is booked through checkout and appears in Trips.

### WP-18 Account, search and information pages (M)

- **Design:** sections 6.1 and 7.8.
- **Create:** `app/account/page.tsx` (profile summary, language, theme, Operations entry for
  staff, links), `app/search/page.tsx` (filters the beach point, venue and hotel lists already
  available; no new endpoint), `app/about/page.tsx`, `app/help/page.tsx`, `app/terms/page.tsx`,
  `app/privacy/page.tsx`. Terms and Privacy (D6, decided): build the page structure, headings and
  navigation; the body is the operator's text. Until it arrives each page shows one line, "These
  terms are being finalised. Contact us with any question.", with the contact from `/help`. Do
  not write legal wording to fill the gap, and keep the missing text on the go-live gate.
- **Not in scope:** real sign-in (WP-24). The sign-in entry opens the account list while seeded
  accounts are enabled.
- **Done when:** every link in the footer and account page resolves.

### WP-19 Operations shell, Today and Scan (L)

- **Design:** sections 5.2, 6.2, 7.9 and 8.9.
- **Create:** `app/admin/scan/page.tsx`; `components/admin/ops-shell.tsx` (drawer, rail, bottom
  bar); `scan-panel.tsx` and `scan-result.tsx`, extracted from the 856-line `bookings-manager.tsx`.
- **Modify:** `app/admin/layout.tsx`, `app/admin/page.tsx`, `admin-nav.tsx`, `metric-card.tsx`,
  `admin-page-header.tsx`.
- **Tests:** scan result states (valid, cancelled, early, expired, unknown); staff-only access; a
  visitor account gets not-found.
- **Done when:** an attendant can scan and check in on a 360 px screen in one action.

### WP-20 Operations: bookings, beach points, dining (L)

- **Design:** sections 5.3 and 7.10.
- **Verify first:** whether the beach point and sunbed write endpoints the forms call exist. If
  they are missing, add them with DTOs, role guard, audit events and tests before restyling.
- **Modify:** `bookings-manager.tsx` (split into list, detail and cancel parts), `points-manager.tsx`,
  `beach-point-form.tsx`, `sunbeds-manager.tsx`, the five `dining-*` admin components and their
  pages: `data-table` with card fallback, kitchen board as three columns at `expanded` and tabs
  below it.
- **Done when:** every Operations page works at 360 px and 1280 px and no component exceeds about
  300 lines.

### WP-21 Bangla and accessibility (M)

- **Modify:** complete `bn.json`; fix layouts that break with Bangla text or 200% text size.
- **Tests:** automated accessibility checks on every route in both themes; manual keyboard and
  screen-reader pass over booking, cancellation and check-in, recorded in the pull request.
- **Done when:** design.md section 13 holds on every route.

### WP-22 Responsive, end-to-end and performance suites (M)

- **Create:** Playwright journeys from [testing.md](testing.md) in phone and desktop projects; a
  horizontal-overflow check at 320, 360, 600, 840 and 1200 px for every route; a performance check
  for Explore against design.md section 15.
- **Modify:** images to sized, lazy loading with reserved space; confirm the map bundle is absent
  from Explore.
- **Done when:** the suites run in CI and pass.

### WP-23 Clean-up (S)

- **Delete:** every component marked "retire" above; the temporary `/admin/components` route; the
  `'MOCK'` compatibility branch in the API and contracts; unused CSS.
- **Modify:** `README.md` and `RUN.md` to the final routes and screens; remove the "redesign in
  progress" note; tick section 11.
- **Done when:** a search of the repository finds no retired token, component or banned word, and
  the design acceptance checklist (design.md section 18) passes in full.

### WP-24 Sign-in (L, gated)

- **Gate:** security review per [security.md](security.md).
- **Scope:** email and password accounts with database sessions and CSRF protection; sign-in and
  create-account screens; sign-in required at checkout and Trips; `proxy.ts` no longer assigns a
  default account; `DEMO_AUTH_ENABLED`, `x-demo-user-id` and `/demo/users` renamed or removed.
- **Done when:** a build with seeded accounts disabled supports the full visitor journey.

## 7. What happens to each current web file

| Path | Action | In |
|---|---|---|
| `app/globals.css`, `app/layout.tsx` | Rewrite | WP-02, WP-04 |
| `app/page.tsx` | Rewrite as Explore | WP-11 |
| `app/error.tsx`, `app/not-found.tsx` | Restyle, new copy | WP-06 |
| `app/bookings/**` | Replace by `app/trips/**`, redirect | WP-15 |
| `app/food/**` | Replace by `app/dining/**` and `app/trips/**`, redirect | WP-15, WP-16 |
| `app/hotels/**` | Restyle | WP-17 |
| `app/rides/page.tsx`, `app/activities/page.tsx` | Behind feature flags | WP-10 |
| `app/admin/**` | Restyle; add `scan` | WP-19, WP-20 |
| `components/brand/demo-banner.tsx` | Delete | WP-04 |
| `components/brand/persona-switch.tsx` | Becomes part of `account-menu` | WP-04 |
| `components/brand/logo.tsx` | Restyle to tokens | WP-02 |
| `components/site/site-header.tsx` | Replace by top bar, navigation bar, rail | WP-04 |
| `components/site/site-footer.tsx` | Rewrite | WP-04 |
| `components/ui/*` | Rebuild | WP-03 |
| `components/ui/under-development-module.tsx` | Delete | WP-10 |
| `components/map/*` | Move to the map page, load on demand | WP-12 |
| `components/booking/beach-map-experience.tsx`, `booking-panel.tsx`, `bed-picker.tsx`, `time-picker.tsx`, `point-rail.tsx`, `bed-legend.tsx`, `booking-summary.tsx` | Replace by `components/sunbeds/*` | WP-13 |
| `components/booking/date-strip.tsx`, `ticket-qr.tsx` | Move and restyle | WP-13, WP-15 |
| `components/booking/booking-card.tsx`, `cancel-order.tsx`, `api-offline.tsx` | Replace by trips components and `error-state` | WP-15, WP-06 |
| `components/dining/venue-*.tsx`, `menu-list.tsx`, `food-cart.tsx`, `reservation-panel.tsx`, `food-order-panel.tsx` | Restyle, hand off to checkout | WP-14, WP-16 |
| `components/dining/my-*.tsx`, `food-order-card.tsx`, `*-cancel.tsx`, `food-order-timeline.tsx`, `food-order-auto-refresh.tsx` | Replace by or move to trips components | WP-15 |
| `components/hotels/*` | Restyle, hand off to checkout | WP-17 |
| `components/admin/*` | Restyle and split | WP-19, WP-20 |
| `lib/api.ts`, `lib/session.ts`, `proxy.ts` | Keep until WP-24; rename user-visible error text only | WP-06, WP-24 |
| `lib/format.ts`, `components/dining/dining-format.ts` | Merge into one formatter | WP-05 |
| `lib/booking.ts`, `lib/dining/*` | Keep logic, remove payment labels | WP-06, WP-14 |
| `lib/map-layout.ts` | Keep if the map page uses it, else delete | WP-12, WP-23 |

## 8. Android workstream

Starts when M2 is merged, so tokens, routes and contracts are stable. It never blocks the web
work. Where the code lives (D7) is deferred and is decided when A2 begins; the steps below hold
either way.

| Step | Scope | Needs |
|---|---|---|
| A1 | Decide and review the native session mechanism | [security.md](security.md) |
| A2 | Project set-up: Kotlin, Compose, Material 3, minimum API 26; `designsystem` module with `CoastlineTheme`, tokens and the components of design.md section 9 | Token table |
| A3 | API client generated from the OpenAPI document served at `/api/docs` | WP-07, WP-08 |
| A4 | Visitor journeys in web order: Explore, sunbeds, checkout, tickets, dining, hotels, with adaptive layouts and App Links for the routes of design.md section 6 | A2, A3 |
| A5 | Staff scanning, in the same app or its own | A4 |

Preparation the web work does for Android: role-named tokens (WP-02), route names (WP-11 to
WP-16), `GET /payments/methods` so methods are not hard-coded (WP-07), idempotent create calls
(WP-08), and an OpenAPI document that matches the routes.

## 9. Changes outside the web app

| Kind | Change | In |
|---|---|---|
| Migration | `payments_provider_and_method` | WP-07 |
| Migration | `idempotency_keys` | WP-08 |
| Migration | `beach_point_image` | WP-09 |
| Contract | `PAYMENT_METHODS`, `paymentMethod` on four create requests, `PaymentDto.method`, `FAILED` status | WP-07 |
| Contract | `BeachPointSummary.imageUrl`, `imageAlt` | WP-09 |
| Endpoint | `GET /payments/methods` | WP-07 |
| Header | `Idempotency-Key` on four create endpoints | WP-08 |
| Environment | `PAYMENT_PROVIDER`, `ALLOW_SANDBOX_PAYMENTS`, `FEATURE_RIDES`, `FEATURE_ACTIVITIES` | WP-07, WP-10 |
| Dependencies | `vitest`, `@testing-library/react`, `jsdom`, `@playwright/test`, Radix primitives, an accessibility test helper for Playwright | WP-01, WP-03, WP-21 |
| CI | `.github/workflows/ci.yml` | WP-01 |

## 10. Risks

| Risk | Mitigation |
|---|---|
| The class rename in WP-02 touches nearly every file and conflicts with parallel branches | Merge WP-02 before other web work starts; do it as one mechanical change with no layout edits |
| Next.js 16 behaviour differs from older guidance (redirects, proxy, fonts) | Read the bundled docs before each such change; cover redirects with tests |
| The payment refactor touches four booking services and their transactions | Compatibility branch for the old request value; declining-provider tests for every service before the web app changes |
| A public deployment with sandbox payments gives bookings away | Start-up guard in WP-07; go-live gate in [delivery-plan.md](delivery-plan.md) |
| Bangla text overflows layouts designed in English | Translation layer early (WP-05); Bangla checked in WP-21 with no fixed-width text containers |
| A photo taken from the web without a usable licence, or showing the wrong beach | Sourcing rules and the recorded source table in WP-09; attribution stored and shown |
| Terms and privacy pages go live without the operator's text | Pages carry a "being finalised" line; the missing text stays on the go-live gate in [delivery-plan.md](delivery-plan.md) |
| Old routes are bookmarked or printed on tickets | Permanent redirects in WP-15 and WP-16, kept indefinitely |
| The seeded-account cookie makes every visitor look signed in | Accepted until WP-24; the account menu shows whose account is active |

## 11. Progress

Tick a row when its pull request is merged and its "Done when" holds.

| WP | Title | Done |
|---|---|---|
| 00 | Decisions and baseline | ☐ |
| 01 | Quality harness | ☐ |
| 02 | Tokens, themes and type | ☐ |
| 03 | Component library | ☐ |
| 04 | Application shell | ☐ |
| 05 | Translation layer and formatters | ☐ |
| 06 | Copy pass and copy check | ☐ |
| 07 | Payment-provider port | ☐ |
| 08 | Idempotency keys | ☐ |
| 09 | Catalogue additions | ☐ |
| 10 | Feature flags and release guards | ☐ |
| 11 | Explore and shoreline strip | ☐ |
| 12 | Map page | ☐ |
| 13 | Sunbed booking | ☐ |
| 14 | Shared checkout | ☐ |
| 15 | Trips and tickets | ☐ |
| 16 | Dining | ☐ |
| 17 | Hotels | ☐ |
| 18 | Account, search, information pages | ☐ |
| 19 | Operations shell, Today, Scan | ☐ |
| 20 | Operations bookings, points, dining | ☐ |
| 21 | Bangla and accessibility | ☐ |
| 22 | Responsive, end-to-end, performance | ☐ |
| 23 | Clean-up | ☐ |
| 24 | Sign-in | ☐ |
