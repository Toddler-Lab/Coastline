# Coastline Design Specification

**Audience:** product design, web engineering, Android engineering · **Status:** target design,
supersedes the MVP baseline · **Last revised:** 2026-11-13

This document is the single design reference for the Coastline website and the planned Android app
(Kotlin, Jetpack Compose). It replaces the dark "survey map" interface. Where the current code
differs, this document is the target; section 17 lists the migration.

## 1. Who we design for

Coastline lets a visitor to Cox's Bazar find and book what a beach day needs: a sunbed, a table,
food brought to the bed, a hotel room. Staff use the same product to check guests in and run the
kitchen queue.

| Person | Situation | What that demands |
|---|---|---|
| Visitor | Standing on the sand in full sun, phone in one hand, often a mid-range Android on mobile data | Light theme by default, large touch targets, short flows, pages that work on a slow connection |
| Visitor planning ahead | On a laptop or phone the night before | Browsable photos, clear prices, comparison across beach points |
| Beach attendant | Walking the bed row with a phone, scanning tickets | One-thumb scan and check-in, readable at arm's length, works at dusk |
| Kitchen and desk staff | Tablet or laptop at a counter | Dense queues, fast status changes, no decoration |
| Administrator | Desktop | Tables, filters, audit trail |

Most visitors read Bangla first and English second. Every layout must hold Bangla text without
truncating it.

## 2. Principles

1. **The shoreline is the spine.** Cox's Bazar is one long line of sand. The six beach points run
   north to south, and everything a visitor can book hangs off one of them. The interface is
   organised along that line, not around a list of modules.
2. **One job per screen.** Pick a place, pick a time, pick a bed, pay, show the ticket. Each step
   has one primary action, always in the same place: the bottom of the screen.
3. **Say the price early and never change it silently.** The total is visible before the visitor
   commits. If the server total differs from what was shown, the visitor sees the new total and
   confirms again.
4. **A ticket is the product.** After paying, the visitor holds a ticket. It must open fast, work
   with no connection, and scan first time.
5. **Same product on web and Android.** Tokens, component names, navigation model and copy are
   shared. Nothing in this document depends on hover, a mouse or a wide screen.
6. **No claims we cannot back.** Coastline is an independent platform. The interface never implies
   government endorsement, official tariffs or police verification.
7. **It reads as a finished product.** No screen carries the words demo, mock, simulated, prototype
   or similar (section 12). Unreleased services are hidden, not badged.

## 3. Visual language

### 3.1 Concept

Sunlit and plain. The look comes from the place itself: pale wet sand, the grey-green Bay of Bengal,
and the rows of marigold and teal umbrellas over the kitkot chairs. Surfaces are a cool sea-haze
white, text is deep bay ink, actions are bay teal, and marigold marks the one thing that belongs to
the visitor (their bed, their ticket, their rating).

Boldness is spent in one place: the **shoreline strip** (section 10.1), a drawn line of the coast
with the six beach points on it. Everything around it stays quiet.

What the design deliberately avoids: turquoise-and-palm tropical stock imagery (it is the wrong
coast), glass blur panels, gradient washes, identical rounded cards for every kind of content, and
tiny uppercase technical labels.

### 3.2 Colour

Colours are named by role, following the Material 3 role names so the same table drives the web
theme and the Compose `ColorScheme`. Light is the default theme. Dark follows the system setting
and can be chosen in Account.

| Role | Light | Dark | Use |
|---|---|---|---|
| `primary` | `#0B6E78` | `#63D6CB` | Primary buttons, active navigation, links, selected bed |
| `on-primary` | `#FFFFFF` | `#04282C` | Text and icons on `primary` |
| `primary-container` | `#D3EEEC` | `#0F4A50` | Selected chips, tonal buttons, active nav pill |
| `on-primary-container` | `#06343A` | `#C9F1EC` | Text on `primary-container` |
| `tertiary` | `#F5A300` | `#FFC247` | "Yours" marker, rating star, ticket stripe |
| `on-tertiary` | `#2B1D00` | `#2B1D00` | Text on `tertiary` |
| `tertiary-container` | `#FFE7B3` | `#4A3500` | Active-booking card, highlight background |
| `on-tertiary-container` | `#3D2A00` | `#FFE7B3` | Text on `tertiary-container` |
| `surface` | `#F3F8F8` | `#071A1F` | Page background |
| `surface-container-lowest` | `#FFFFFF` | `#0B2429` | Cards, sheets, inputs |
| `surface-container` | `#E9F1F1` | `#0E2A31` | Grouped areas, navigation bar |
| `surface-container-high` | `#DFEAEA` | `#103038` | Pressed and hovered surfaces |
| `on-surface` | `#0E2A33` | `#E6F2F1` | Body text, headings |
| `on-surface-variant` | `#4A6269` | `#A3BABC` | Secondary text, icons |
| `outline` | `#6F878D` | `#6E8A8E` | Input borders, taken beds, dividers that carry meaning |
| `outline-variant` | `#C9D7D9` | `#24424A` | Hairline dividers, card borders |
| `error` | `#B3261E` | `#FFB4AB` | Errors, destructive actions |
| `on-error` | `#FFFFFF` | `#5C100B` | Text on `error` |
| `error-container` | `#FBDAD7` | `#5C100B` | Error banners |
| `on-error-container` | `#5C100B` | `#FBDAD7` | Text on `error-container` |
| `success` | `#1B6B3A` | `#7FDCA0` | Free bed, confirmed, checked in |
| `success-container` | `#D4F2DE` | `#0B3D20` | Confirmation banners |
| `on-success-container` | `#0B3D20` | `#D4F2DE` | Text on `success-container` |
| `warning` | `#8A5A00` | `#FFC247` | Closing soon, cancellation cut-off near |
| `scrim` | `#0E2A33` at 48% | `#000000` at 60% | Behind sheets and dialogs |

Measured contrast (WCAG 2.2): body text on `surface` 14.0:1; secondary text 6.0:1; white on
`primary` 6.0:1; `primary` on `surface` 5.6:1; `outline` on `surface` 3.6:1; every dark pair above
4.5:1. `tertiary` is 2.1:1 against white, so in the light theme it is a fill that always carries
`on-tertiary` text or an icon, never text or a thin line on its own.

Rules:

- State is never shown by colour alone. Every status has a word, an icon or a pattern as well.
- `tertiary` means "yours". Do not use it for promotions or generic emphasis.
- The dark surfaces reuse the values the current interface already ships, so the present look
  becomes the dark theme rather than being thrown away.
- No gradients as decoration. The only gradient allowed is the scrim under text on a photo.

### 3.3 Typography

One type system, two scripts: **Anek Latin** and **Anek Bangla** (Ek Type, SIL Open Font Licence).
They are drawn as one family, so English and Bangla sit together at the same weight and rhythm,
and both are variable fonts with weight and width axes. Headings use a narrower width; body text
uses the normal width. There is no monospace face and no third family.

Fallback stack: `'Anek Latin', 'Anek Bangla', 'Noto Sans Bengali', system-ui, sans-serif`. Fonts
are self-hosted on the web and bundled as variable `.ttf` files in the Android app.

| Role | Size / line (sp or px) | Weight | Width | Use |
|---|---|---|---|---|
| `display` | 40 / 44, 56 / 60 from 840 | 700 | 85 | Beach point name in the Explore hero |
| `headline` | 28 / 34 | 700 | 90 | Page titles |
| `title-large` | 22 / 28 | 600 | 95 | Section titles, sheet titles |
| `title-medium` | 18 / 24 | 600 | 100 | Card titles |
| `body-large` | 16 / 24 | 400 | 100 | Default reading text, inputs |
| `body-medium` | 14 / 20 | 400 | 100 | Secondary text, staff tables |
| `label-large` | 14 / 20 | 600 | 100 | Buttons, tabs, chips |
| `label-medium` | 12 / 16 | 600 | 100 | Navigation labels, badges |
| `label-small` | 11 / 16 | 500 | 100 | Captions that are not needed to complete a task |

Rules:

- Nothing a visitor must read or tap is smaller than 12. The current 7.5–10 px text is retired.
- Sentence case everywhere. No all-caps labels and no letter-spaced captions.
- Prices, times, bed codes and booking references use tabular figures
  (`font-variant-numeric: tabular-nums`, Compose `fontFeatureSettings = "tnum"`) so columns align.
  Confirm the feature renders in both scripts during implementation.
- Bangla text gets 12% more line height than the table above. Reading text keeps to 70 characters
  per line.
- Text scales with the user's setting: `rem` on the web, `sp` on Android. Layouts must hold at 200%.

### 3.4 Shape

Corner radius follows the size and role of the element, not one value for everything.

| Token | Radius | Use |
|---|---|---|
| `shape-xs` | 4 | Bed cells, badges |
| `shape-sm` | 8 | Chips, inputs, small thumbnails |
| `shape-md` | 12 | Cards, list rows with a container |
| `shape-lg` | 16 | Photos, the ticket, map inset |
| `shape-xl` | 28 | Top corners of bottom sheets, dialogs |
| `shape-full` | 999 | Buttons, navigation pill, avatar |

### 3.5 Depth

Hierarchy comes from surface tone first (`surface` → `surface-container-lowest` → `-container` →
`-container-high`) and a 1 px `outline-variant` border. Shadows are reserved for things that float
above the page:

| Token | Shadow | Use |
|---|---|---|
| `elevation-1` | `0 1px 2px rgb(14 42 51 / 0.10), 0 2px 8px rgb(14 42 51 / 0.06)` | Sticky summary bar, map controls |
| `elevation-2` | `0 4px 12px rgb(14 42 51 / 0.12), 0 12px 32px rgb(14 42 51 / 0.10)` | Bottom sheets, dialogs, menus |

No backdrop blur. Cards in a list do not carry shadows.

### 3.6 Spacing

A 4-unit base. Tokens: `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-6` 24,
`space-8` 32, `space-12` 48, `space-16` 64. Units are `dp` on Android and `px` (as `rem`) on the
web. Page gutters and grid are in section 5.

### 3.7 Icons and imagery

- Icons: Lucide on the web (already installed), Material Symbols Rounded on Android, matched by
  meaning from one shared icon list. 24 units, 2 px stroke, always with a text label in navigation
  and on primary actions. No emoji in the interface.
- Photos show the real place: the actual beach point, venue or room. Cards use 4:3, heroes 16:9 on
  wide screens and 4:5 on phones. Every photo has alt text that names what is shown.
- Text on a photo sits on a bottom scrim (`on-surface` from 0% to 72%) and uses white. If the photo
  fails to load, the card shows the name on `surface-container` with the service icon.
- The ticket stripe is the only ornament: a band of `primary`, `tertiary` and white diagonal
  stripes, 8 units tall, taken from the beach umbrellas. It appears on tickets and the app icon
  only.

### 3.8 Motion

Motion answers an action. Durations: 100 ms (press), 200 ms (chips, toggles, tabs), 300 ms (sheets,
page transitions), 450 ms (the ticket moment). Easing: `cubic-bezier(0.2, 0, 0, 1)` for entering,
`cubic-bezier(0.3, 0, 1, 1)` for leaving; in Compose use `tween` with the same curves.

There is one orchestrated moment in the product: after payment, the ticket rises from the pay
button and its stripe draws across. Nothing else animates on its own; there are no entrance
animations on scroll and no hover lifts on cards. With reduced motion (`prefers-reduced-motion`,
Android "Remove animations") every transition becomes a 100 ms cross-fade.

## 4. Design tokens

Tokens are the contract between web and Android. A token has one name on both platforms.

| Layer | Web | Android |
|---|---|---|
| Source | `apps/web/src/app/globals.css` `@theme` block until a shared `packages/design-tokens` package exists | Generated or copied from the same table |
| Colour | `--color-primary` etc., giving Tailwind utilities such as `bg-primary`, `text-on-surface` | `CoastlineTheme` wrapping `MaterialTheme(colorScheme = …)`; `success` and `warning` roles in a `CoastlineColors` `CompositionLocal` |
| Type | `--text-headline` etc. with line height and weight | `Typography(headlineMedium = …)` mapped role by role |
| Shape | `--radius-md` etc. | `Shapes(medium = RoundedCornerShape(12.dp))` |
| Spacing | `--spacing` base of 4 px | `Dp` constants in `CoastlineSpacing` |
| Theme switch | `data-theme="light"` or `"dark"` on `<html>`; without it, `prefers-color-scheme` decides | `isSystemInDarkTheme()` plus a saved preference |

Rules:

- Components use role tokens only. A raw hex value in a component is a defect.
- Dynamic colour (Material You wallpaper colours) is off on Android so the brand stays consistent.
- The old token names (`abyss`, `deep`, `foam`, `mist`, `sea`, `sand`, `coral`) are removed during
  migration, not aliased.

## 5. Layout and responsiveness

### 5.1 Window size classes

Breakpoints are the Material 3 window size classes, so one layout decision serves the browser and
the Android app.

| Class | Width | Typical device | Columns | Gutter | Margin |
|---|---|---|---|---|---|
| Compact | under 600 | Phone portrait | 4 | 16 | 16 |
| Medium | 600–839 | Phone landscape, small tablet, foldable | 8 | 16 | 24 |
| Expanded | 840–1199 | Tablet landscape, small laptop | 12 | 24 | 24 |
| Large | 1200 and up | Laptop, desktop | 12 | 24 | 32, content capped at 1200 |

On the web these become Tailwind breakpoints `medium` (600 px), `expanded` (840 px) and `large`
(1200 px), replacing the default `sm/md/lg/xl`. The design is authored at 360 wide first and must
not scroll sideways at 320.

### 5.2 Navigation by size class

| Class | Visitor | Staff |
|---|---|---|
| Compact | Bottom navigation bar, 4 destinations, labels always visible | Bottom navigation bar: Scan, Arrivals, Kitchen, More |
| Medium | Navigation rail on the left, 80 wide | Navigation rail |
| Expanded and large (web) | Top bar: brand, 4 destinations, search field, account | Left navigation drawer, 240 wide, with a top bar for date and beach point |
| Expanded and large (Android) | Navigation rail | Navigation rail or drawer |

The bottom bar never scrolls sideways and never holds more than five items. It respects
`env(safe-area-inset-bottom)` on the web and `WindowInsets.navigationBars` on Android.

### 5.3 Pane patterns

| Pattern | Compact | Medium | Expanded and large |
|---|---|---|---|
| List and detail (venues, hotels, trips) | List, then detail as a new screen | Same as compact | List pane 360–400 wide beside the detail pane |
| Supporting pane (booking pages) | Sticky summary bar at the bottom | Same as compact | Summary as a sticky right pane, 360 wide |
| Filters | Full-height bottom sheet opened by a "Filters" button | Bottom sheet | Inline filter row above the results |
| Dialogs and pickers | Bottom sheet | Bottom sheet, 640 max width, centred | Centred dialog, 560 max width |
| Data tables (staff) | One card per row | Cards, two columns | Table with a sticky header |
| Map | Full screen with a draggable results sheet | Same as compact | Map pane beside a 400-wide list |

### 5.4 Touch, pointer and keyboard

- Every interactive target is at least 48 × 48. Adjacent targets are at least 8 apart.
- No action depends on hover. Hover may add a tone change on pointer devices only.
- Sticky bars leave the content scrollable: page content gets bottom padding equal to the bar
  height plus the safe-area inset.
- The page never scrolls horizontally. Rows that scroll sideways (shoreline strip, date strip, bed
  strip, photo rows) show a partial next item so the scroll is discoverable, and are reachable by
  keyboard arrows.
- The layout survives the on-screen keyboard: the primary button stays visible above it.

## 6. Information architecture

### 6.1 Visitor

Four destinations. Services are entered from Explore, not from the navigation bar.

| Destination | Route | Purpose |
|---|---|---|
| Explore | `/` | Pick a beach point, see what is free now, start any booking |
| Map | `/map` | The coast on a map with beach points, venues and hotels |
| Trips | `/trips` | Everything the visitor has booked, tickets first |
| Account | `/account` | Sign in, language, theme, help, legal |

Services and their pages:

| Service | Routes | Notes |
|---|---|---|
| Sunbeds | `/sunbeds`, `/sunbeds/[pointCode]` | Bed booking for one beach point |
| Dining | `/dining`, `/dining/[venueCode]` | Venues, menus, table reservation, food to a sunbed |
| Hotels | `/hotels`, `/hotels/[slug]` | Hotel list, rooms, stay booking |
| Checkout | `/checkout` | One shared review-and-pay step for every service |
| Trip detail | `/trips/sunbeds/[ref]`, `/trips/tables/[ref]`, `/trips/food/[ref]`, `/trips/stays/[ref]` | Ticket or order tracking |
| Search | `/search?q=` | One search across beach points, venues and hotels |
| Legal and help | `/about`, `/help`, `/terms`, `/privacy` | Linked from Account and the footer |

Rides and water sports are not released. They do not appear in navigation or on Explore, and their
routes are off behind feature flags (`rides`, `activities`). When a flag is off the route answers
with the standard not-found page. There is no "coming soon" page with sample numbers.

### 6.2 Staff

Staff pages live under `/admin` and are shown under the name **Operations**.

| Destination | Route | Purpose |
|---|---|---|
| Today | `/admin` | Arrivals, occupancy and revenue for the selected day and beach point |
| Scan | `/admin/scan` | Camera scanner and reference lookup; the default screen on a phone |
| Sunbed bookings | `/admin/bookings` | Arrivals list, check-in, cancel with a reason |
| Beach points | `/admin/points`, `/admin/points/[code]` | Beds, prices, open or closed |
| Dining | `/admin/dining`, `/admin/dining/reservations`, `/admin/dining/kitchen`, `/admin/dining/venues`, `/admin/dining/venues/[code]` | Reservation desk, kitchen queue, venue and menu editing |

A signed-in staff member reaches Operations from the account menu. Visitors never see the entry.

### 6.3 Route changes from the current site

| Current | Target | Action |
|---|---|---|
| `/` (beach map and bed picker) | `/` Explore; bed picking moves to `/sunbeds/[pointCode]`; the map moves to `/map` | Rebuild |
| `/food`, `/food/[code]` | `/dining`, `/dining/[venueCode]` | Rename, permanent redirect |
| `/food/orders/[ref]` | `/trips/food/[ref]` | Rename, permanent redirect |
| `/food/reservations/[ref]` | `/trips/tables/[ref]` | Rename, permanent redirect |
| `/bookings` | `/trips` | Rename, permanent redirect |
| `/bookings/[ref]` | `/trips/sunbeds/[ref]` | Rename, permanent redirect |
| `/hotels`, `/hotels/[slug]` | unchanged | Restyle |
| `/rides`, `/activities` | flagged off | Remove from navigation |
| `/admin/*` | unchanged, plus `/admin/scan` | Restyle |

Every public route is also an Android deep link. The path and parameters above are the contract;
the Android navigation graph uses the same names.

## 7. Core flows

### 7.1 Booking a sunbed

```text
Explore ──▶ Beach point ──▶ Date, time, beds ──▶ Checkout ──▶ Ticket
  pick a      /sunbeds/KOL     one screen          review,      QR code,
  point                                            pay          saved to Trips
```

1. **Pick a beach point** on the shoreline strip. The hero shows beds free now and the hourly
   price. Primary action: "Book a sunbed".
2. **Choose when.** Date strip (today and the next 7 days), start hour chips, and a duration stepper
   (1 to 4 hours). Hours that have passed are not shown. Defaults: today, the next full hour, 2
   hours.
3. **Choose beds** on the bed strip (section 10.2). Tapping a free bed selects it; tapping again
   removes it. The summary bar updates the count and the total at once.
4. **Continue** opens checkout with the selection. A visitor who is not signed in is asked to sign
   in here, and returns to checkout with the selection intact.
5. **Pay** (section 7.5). On success the ticket opens.

If a chosen bed is taken while the visitor decides (the API answers `409`), the strip refreshes,
the lost bed is marked taken, the rest of the selection is kept, and a message under the strip
says "Bed KOL-014 was just taken. Choose another bed." The visitor is never sent back to the start.

### 7.2 Reserving a table

Dining list → venue page → "Reserve a table" tab: date strip, party size stepper, start hour chips
showing only hours with a free table, duration (1 to 3 hours) → checkout (the deposit, if the venue
takes one) → table ticket. A venue with no deposit skips the payment step and confirms directly.

### 7.3 Ordering food to a sunbed

Food delivery only exists for a visitor who is on a booked bed now. So the main entry is the
sunbed ticket: while the booking is active it shows "Order food to this bed". That opens the list
of venues that deliver to this beach point; the bed is already filled in.

Venue menu → add items (a cart bar replaces the summary bar) → checkout → order tracking page with
four steps: Placed, Preparing, Ready, Delivered. Tracking refreshes by itself. "Cancel order" is
offered only while the order is still Placed.

A visitor who opens a delivering venue without an active bed sees the menu with prices and one
line: "Food delivery is for guests on a booked sunbed. Book a sunbed at Kolatoli to order."

### 7.4 Booking a hotel stay

Hotel list (filter by beach point, price, dates) → hotel page (photos, rooms, rules) → choose
dates and a room → checkout → stay confirmation in Trips. The room price, taxes and total are
itemised before payment using the amounts the API returns; the page invents no fees.

### 7.5 Checkout and payment

Checkout is one page for every service so it is learned once.

1. **Review**: what, where, when, each line with its price, the total, and the cancellation rule in
   one sentence ("Free cancellation until 1:00 pm today").
2. **Payment method**: a radio list from the API (bKash, Nagad, card). The last method used is
   preselected.
3. **Pay** button with the amount: "Pay ৳200". While the request runs the button shows a spinner
   and "Paying" and cannot be pressed twice. The request carries an idempotency key.
4. **Result**: success opens the ticket. A declined payment stays on checkout with "Payment was not
   completed. You have not been charged. Try again or choose another method." and the selection
   kept.

Presentation rules while the payment provider is the sandbox adapter (see
[workflows.md](workflows.md)):

- The flow, wording and receipts are identical to a live provider. No label marks it as a test.
- The page shows the method list and the pay button only. It never renders fields for a card
  number, expiry, CVV, wallet PIN or one-time code. Those fields belong to a licensed gateway's own
  hosted page and arrive with the live adapter.
- Wallet and card names are written as text. Provider logos are added only when a merchant
  agreement allows them.

### 7.6 Trips and tickets

Trips lists bookings in two tabs, Upcoming and Past. Upcoming is grouped by day ("Today", "Sat 14
Nov") in time order, mixing sunbeds, tables, food orders and stays. A booking that is active right
now is pinned first and is also shown as a card on Explore.

A ticket page shows, in this order: the QR code, the booking reference in large tabular figures,
what and where, the time window, status, then actions (Order food to this bed, Get directions,
Cancel booking), then the receipt. The QR sits on a white panel in both themes with a 16-unit quiet
zone. The page works offline once it has been opened; the Android app raises screen brightness
while it is in front.

### 7.7 Cancelling

"Cancel booking" opens a confirmation sheet that states the consequence in numbers: "Cancel bed
KOL-014 for today, 2:00–4:00 pm? ৳200 will be refunded to your bKash." Buttons: "Keep booking" and
"Cancel booking" (the destructive one, in `error`). After the cut-off the action is replaced by one
line that says when cancellation closed and how to reach the beach desk.

### 7.8 Sign in

Email and password, as specified in [security.md](security.md). Screens: Sign in, Create account,
and a return to the page the visitor came from. Browsing, prices and availability need no account;
sign-in is asked for at checkout and on Trips.

While seeded accounts are enabled for local and presentation use, the account menu offers "Switch
account" with the seeded names. It is an ordinary account list: it does not use the words persona,
role or demo, and it is absent in production.

### 7.9 Staff: check-in

Scan opens the camera at once. A valid ticket shows a full-width green result with the guest name,
beds and time window, and one button: "Check in". An invalid, cancelled, early or expired ticket
shows the reason in words and no check-in button. Manual lookup by reference sits under the camera.
Each result returns to scanning after the action so an attendant can work down a row.

### 7.10 Staff: kitchen

A board with three columns at expanded width (Placed, Preparing, Ready) and one tabbed list at
compact width. Each order card shows the bed code large, the items, and the minutes since it was
placed. One button moves it to the next stage. Cancel is available on Placed only.

## 8. Page specifications

Wireframes show structure and order, not final styling.

### 8.1 Explore

```text
Compact                              Expanded and large
┌──────────────────────────────┐     ┌────────────────────────────────────────────────────────┐
│ Coastline        বাংলা   (A) │     │ Coastline   Explore  Map  Trips   [ Search ]  বাংলা (A)│
├──────────────────────────────┤     ├───────────────────────────────┬────────────────────────┤
│ [ Search beaches, food… ]    │     │ ●──●──●────────●─────●────● │                        │
│ ●───●───●──────●────●───●    │     │ Laboni Sugandha Kolatoli …    │   Coast map with the   │
│ Laboni Sugandha Kolatoli …   │     │ ┌───────────────────────────┐ │   six beach points;    │
│ ┌──────────────────────────┐ │     │ │ photo                     │ │   the selected point   │
│ │ photo of Kolatoli        │ │     │ │ Kolatoli Beach            │ │   is highlighted       │
│ │ Kolatoli Beach           │ │     │ │ 38 beds free now, ৳50/hr  │ │                        │
│ │ 38 beds free now         │ │     │ │ [ Book a sunbed ]         │ │                        │
│ │ ৳50 an hour              │ │     │ └───────────────────────────┘ │                        │
│ │ [ Book a sunbed ]        │ │     ├───────────────────────────────┴────────────────────────┤
│ └──────────────────────────┘ │     │ Your bed KOL-014, until 3:00 pm        [ Show ticket ] │
│ Your bed KOL-014             │     │ Sunbeds      Dining       Hotels                       │
│ until 3:00 pm  [Show ticket] │     │ Eat near Kolatoli                                      │
│ Sunbeds   Dining   Hotels    │     │ ▢ venue  ▢ venue  ▢ venue  ▢ venue                     │
│ Eat near Kolatoli            │     │ Stay near Kolatoli                                     │
│ ▢ venue  ▢ venue  ▢ …        │     │ ▢ hotel  ▢ hotel  ▢ hotel  ▢ hotel                     │
│ Stay near Kolatoli           │     └────────────────────────────────────────────────────────┘
│ ▢ hotel  ▢ hotel  ▢ …        │
├──────────────────────────────┤
│ Explore   Map  Trips  Account│
└──────────────────────────────┘
```

- The hero is the selected beach point: its photo, its name in `display`, and live facts. Changing
  the point on the strip changes the hero and every row below it.
- The active-booking card appears only when the visitor has a booking that is active or starts
  today. It uses `tertiary-container`.
- The first visit selects the beach point nearest the visitor if location is allowed, otherwise
  Kolatoli. Location is asked for only when the visitor taps "Near me", never on load.
- Rows below the hero show at most 8 items and end with a "See all" link.

### 8.2 Sunbed booking (`/sunbeds/[pointCode]`)

```text
Compact                              Expanded and large
┌──────────────────────────────┐     ┌──────────────────────────────────────┬─────────────────┐
│ ←  Kolatoli Beach        Map │     │ ← Kolatoli Beach                     │ Your booking    │
├──────────────────────────────┤     │ Today  Sat 14  Sun 15  Mon 16  …     │ Kolatoli Beach  │
│ Today  Sat 14  Sun 15  Mon … │     │ From  10 am  11 am  12 pm  1 pm  …   │ Today           │
│ From  10 am  11 am  12 pm  … │     │ For   [−]  2 hours  [+]              │ 2:00–4:00 pm    │
│ For   [−]  2 hours  [+]      │     │                                      │ KOL-014  ৳100   │
│                              │     │ ≈≈≈≈≈≈≈≈≈≈≈≈  Sea  ≈≈≈≈≈≈≈≈≈≈≈≈≈     │ KOL-015  ৳100   │
│ ≈≈≈≈≈≈≈≈  Sea  ≈≈≈≈≈≈≈≈≈     │     │ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐     │ ─────────────── │
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌─       │     │ │01││02││03││04││05││06││07││08│ …   │ Total     ৳200  │
│ │13││14││15││16││17││1        │     │ └──┘└──┘└──┘└──┘└──┘└──┘└──┘└──┘     │ Free cancel     │
│ └──┘└──┘└──┘└──┘└──┘└─       │     │ Free 38   Taken 10   Yours 0         │ until 1:00 pm   │
│ Free 38  Taken 10  Yours 0   │     │                                      │ [ Continue ]    │
├──────────────────────────────┤     │ Map of the bed row (inset)           │                 │
│ 2 beds, 2 hours        ৳200  │     └──────────────────────────────────────┴─────────────────┘
│ [        Continue          ] │
└──────────────────────────────┘
```

- The summary bar is hidden until one bed is selected, then stays pinned.
- Changing the date, start hour or duration reloads availability and keeps any selected bed that is
  still free; beds that are no longer free are dropped with a message.
- "Map" opens the beach point on `/map` for orientation. Beds are chosen on the strip, not on the
  map: map markers are too small to tap reliably on a phone.

### 8.3 Checkout (`/checkout`)

```text
Compact                              Expanded and large
┌──────────────────────────────┐     ┌──────────────────────────────┬─────────────────────────┐
│ ←  Review and pay            │     │ ← Review and pay             │ Kolatoli Beach          │
├──────────────────────────────┤     │                              │ Today, 2:00–4:00 pm     │
│ Kolatoli Beach               │     │ Pay with                     │ KOL-014          ৳100   │
│ Today, 2:00–4:00 pm          │     │ ( ) bKash                    │ KOL-015          ৳100   │
│ KOL-014               ৳100   │     │ ( ) Nagad                    │ ─────────────────────── │
│ KOL-015               ৳100   │     │ ( ) Card                     │ Total            ৳200   │
│ ──────────────────────────── │     │                              │ Free cancellation until │
│ Total                 ৳200   │     │ [        Pay ৳200         ]  │ 1:00 pm today           │
│ Free cancellation until      │     │ By paying you agree to the   │                         │
│ 1:00 pm today                │     │ terms.                       │                         │
│ Pay with                     │     └──────────────────────────────┴─────────────────────────┘
│ (•) bKash                    │
│ ( ) Nagad                    │
│ ( ) Card                     │
├──────────────────────────────┤
│ [        Pay ৳200          ] │
└──────────────────────────────┘
```

Checkout has no navigation bar and no footer: the only exits are back and pay.

### 8.4 Ticket (`/trips/sunbeds/[ref]`)

```text
┌──────────────────────────────┐
│ ←  Sunbed ticket             │
├──────────────────────────────┤
│ ╱╱╱╱╱╱╱╱ ticket stripe ╱╱╱╱╱ │
│        ┌────────────┐        │
│        │  QR code   │        │
│        └────────────┘        │
│          CL-7F3K-92          │
│ Confirmed                    │
│ Kolatoli Beach               │
│ Beds KOL-014, KOL-015        │
│ Today, 2:00–4:00 pm          │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ [ Order food to this bed ]   │
│ Get directions               │
│ Cancel booking               │
│ Receipt                      │
│ Paid with bKash       ৳200   │
└──────────────────────────────┘
```

At expanded width the ticket is a 480-wide card on the left with the receipt and actions in a pane
on the right. Table and stay confirmations use the same layout with their own details.

### 8.5 Trips (`/trips`)

Tabs: Upcoming, Past. Each row: service icon, title ("2 beds at Kolatoli"), time window, status
badge, and a chevron. Empty state for Upcoming: "No trips yet. Book a sunbed and your ticket will
be here." with the button "Find a sunbed". At expanded width the list is the left pane and the
selected ticket is the right pane.

### 8.6 Dining list and venue

List: filter chips (Restaurants, Beach stalls, Reserve a table, Delivers to sunbed) and the beach
point from the shoreline strip; venue cards with photo, name, kind, opening hours today ("Open
until 11:00 pm" or "Closed, opens 10:00 am") and the two capability badges.

Venue page: photo header, name, hours, then tabs **Menu** and **Reserve a table**. Menu items are
rows (name, one-line description, price, add button), grouped by category with a sticky category
bar. Unavailable items stay listed, dimmed, with the word "Unavailable".

### 8.7 Hotels

List: cards with photo, name, beach point, price per night from the API, and rating if the API
provides one. Detail: photo gallery, rooms as rows with price and "Choose", rules and check-in time,
then a sticky "Choose dates" bar that opens the date picker.

### 8.8 Map (`/map`)

Full-bleed map with pins for beach points and, by filter chip, venues and hotels. A draggable sheet
(compact) or a left list (expanded) shows the same items as a list, so nothing is reachable only
through the map. Selecting a pin opens a short card with one action ("Book a sunbed", "View menu",
"View hotel"). Map controls and attribution use `surface-container-lowest` with `elevation-1`.

### 8.9 Operations: Today (`/admin`)

```text
Expanded and large
┌───────────┬────────────────────────────────────────────────────────────────┐
│ Operations│ Today, Fri 13 Nov      Beach point: [ All ▾ ]     [ Scan ]     │
│           ├────────────────────────────────────────────────────────────────┤
│ Today     │ Arrivals left   Checked in   Beds in use   Revenue today       │
│ Scan      │ 24              61           58 of 96      ৳12,400             │
│ Sunbeds   ├────────────────────────────────────────────────────────────────┤
│ Points    │ Next arrivals                                                  │
│ Dining    │ Time     Guest          Beds              Status     Action    │
│           │ 2:00 pm  Rahim Ahmed    KOL-014, KOL-015  Confirmed  Check in  │
│           │ 2:00 pm  Fatima Begum   KOL-020           Confirmed  Check in  │
└───────────┴────────────────────────────────────────────────────────────────┘
```

On a phone Operations opens on Scan; Today becomes a single column of the four figures followed by
the arrivals as cards. Figures are plain numbers with a label under them; no charts on this page.
Revenue is labelled "Revenue", with the date range it covers.

## 9. Component library

Each component has one name on both platforms. Web components live in `apps/web/src/components/ui`
on accessible Radix primitives styled with Tailwind; Compose components wrap Material 3.

| Component | Purpose | Compose base |
|---|---|---|
| `Button` (filled, tonal, outlined, text, destructive) | Actions. Height 48, `shape-full`, `label-large`. One filled button per screen | `Button`, `FilledTonalButton`, `OutlinedButton`, `TextButton` |
| `IconButton` | Icon-only action with an accessible name, 48 target | `IconButton` |
| `Chip` (filter, choice) | Filters, start hours | `FilterChip` |
| `Stepper` | Duration, party size: minus, value, plus | Custom `Row` of `IconButton`s |
| `TextField` | Inputs with label above, helper and error below | `OutlinedTextField` |
| `RadioList` | Payment method | `RadioButton` rows |
| `Tabs` | Menu / Reserve, Upcoming / Past | `PrimaryTabRow` |
| `TopBar` | Title, back, up to two actions | `TopAppBar` |
| `NavigationBar`, `NavigationRail` | Section 5.2 | `NavigationSuiteScaffold` |
| `Sheet` | Filters, pickers, confirmations | `ModalBottomSheet` |
| `Dialog` | Destructive confirmation at expanded width | `AlertDialog` |
| `SummaryBar` | Sticky total and primary action | `Surface` in `bottomBar` |
| `Card` (photo, row) | Venues, hotels, trips | `Card`, `ListItem` |
| `StatusBadge` | Booking and order status: icon and word | Custom `Surface` |
| `Money` | Formats minor units (section 12.3) | Shared formatter |
| `DateStrip` | Day picker, today plus 7 | `LazyRow` |
| `ShorelineStrip` | Section 10.1 | Custom `Canvas` and `LazyRow` |
| `BedStrip`, `BedCell` | Section 10.2 | `LazyHorizontalGrid` |
| `Ticket`, `TicketQr` | Section 8.4 | Custom |
| `OrderTimeline` | Placed, Preparing, Ready, Delivered | Custom |
| `Snackbar` | Brief confirmation of an action, one at a time | `Snackbar` |
| `Banner` | Page-level error, success or offline notice | Custom `Surface` |
| `Skeleton`, `EmptyState`, `ErrorState` | Section 11 | Custom |
| `DataTable` | Staff tables with card fallback | `LazyColumn` |

Button rules: a label says what happens ("Pay ৳200", "Check in", "Cancel booking"), keeps the same
verb through the flow, and has no arrow or icon appended for decoration. Disabled buttons explain
why in a line of text next to them.

Status vocabulary (one word per state, one icon, one colour role):

| State | Word | Role |
|---|---|---|
| Sunbed, table or stay booked | Confirmed | `success` |
| Guest arrived | Checked in | `primary` |
| Cancelled | Cancelled | `on-surface-variant` |
| Food order | Placed, Preparing, Ready, Delivered | `primary`, with Delivered in `success` |
| Payment | Paid, Refunded, Not completed | `success`, `on-surface-variant`, `error` |

## 10. Signature components

### 10.1 Shoreline strip

A horizontal line with the six beach points as stops in true north-to-south order: Laboni,
Sugandha, Kolatoli, Himchari, Inani, Teknaf. Spacing between stops is compressed but keeps the
order and the long gaps readable (Kolatoli to Himchari is visibly longer than Laboni to Sugandha).
Each stop is a 48-high target with the name under it; the selected stop is a filled `primary`
circle with a `primary-container` pill behind its name.

- It is the global "where" control. The choice persists across Explore, Sunbeds, Dining, Hotels
  and Map for the session and is restored on the next visit.
- It scrolls sideways on compact widths with the selected stop centred, and fits without scrolling
  from expanded width.
- Keyboard: one tab stop, arrow keys move between points, exposed as a radio group. On Android it
  uses `Modifier.selectableGroup()` with a `Role.RadioButton` on each stop.
- A closed beach point stays on the line, dimmed, with "Closed" under its name.

### 10.2 Bed strip

A seat-map of one beach point's bed row. Beds are cells in shore order; a "Sea" label and wave line
run along the top so the visitor knows which way the row faces. Long rows wrap into shore-parallel
bands rather than shrinking the cells.

| Bed state | Fill | Non-colour cue | Tappable |
|---|---|---|---|
| Free | `success-container`, `success` border | Bed number only | Yes |
| Selected | `primary` | Check mark, 2-unit ring | Yes, to remove |
| Taken | `surface-container`, `outline` border | Diagonal hatch, number struck through | No |
| Yours | `tertiary` | Ticket icon | Opens the ticket |
| Unavailable | None, dashed `outline-variant` border | Dash in place of the number | No |

Each cell is 48 wide and 56 high, with the last three digits of the bed code in `label-large`. The
legend under the strip shows each state with its count. The accessible name of a cell is the full
code and state: "Bed KOL-014, free, ৳50 an hour".

## 11. Loading, empty, error and offline states

- **Loading**: skeletons in the shape of the content that is coming, shown after 200 ms. Never a
  full-page spinner. Buttons that started a request show their own progress.
- **Empty**: one sentence that says what will appear here and one button that starts it.
- **Error**: says what failed and what to do, in the interface's voice, with a "Try again" button.
  No apology, no error codes, no mention of servers, APIs, ports or databases. A support reference
  (the request ID) may be shown in `label-small`.
- **Conflict**: the specific thing that changed ("Bed KOL-014 was just taken"), with the selection
  otherwise kept.
- **Offline**: a banner "You are offline. Showing saved tickets." Tickets already opened stay
  readable; booking actions are disabled with the reason next to them.
- **Not found and closed**: a beach point or venue that is closed is shown as closed, with its
  opening time if known, rather than hidden mid-session.

## 12. Content and copy

### 12.1 Voice

Plain, short, specific. Sentence case. Verbs over nouns. Address the visitor as "you". Say numbers:
amounts, times, bed codes. One idea per sentence.

### 12.2 Words that never appear in the interface

The product reads as a finished service. These words are banned in every user-facing surface
(pages, toasts, emails, exports, page titles, meta descriptions, alt text):

> demo, mock, fake, simulated, sandbox, prototype, proposal, demonstrator, persona, indicative,
> dev, test, seed, sample

Also banned: implementation words (API, database, server, port, cookie) and authority claims the
platform cannot back (government-approved, government-benchmarked, official tariff, verified by
tourist police, licensed, certified) unless a signed agreement exists and legal review has approved
the exact wording.

| Current copy | Replacement |
|---|---|
| "Pay ৳200 · demo" | "Pay ৳200" |
| "Indicative total" | "Total" |
| "Total paid · simulated" | "Total paid" |
| "Demo ticket — not a real payment" | "Show this code at your bed" |
| "A simulated refund was issued" | "Booking cancelled. ৳200 refunded to your bKash." |
| "Charge (simulated)", "Succeeded · mock" | "Paid" |
| "Mock revenue", "Prototype revenue" | "Revenue" |
| "Choose a demo persona in the header" | "Sign in to book" |
| "Switch demo role" | "Switch account" |
| "The booking API is offline… Start the API on port 3001" | "We can't reach Coastline right now. Check your connection and try again." |
| "Proposal Demonstrator only" (footer) | "Coastline is an independent booking platform. It is not a government service." |
| "Demonstrator in Active Development" pages | Removed with the feature flag |
| "Dev" badges in navigation | Removed |

The independence line stays, in the footer and on `/about`. It is a statement of fact about who
runs the service, not a test label.

One exception to the word list: finance views and exports in Operations show the payment provider
of each record as a data field (for example `SANDBOX`). It is a value in a column, not a label on
the page, and it stops staff reading unsettled records as collected money.

### 12.3 Formats

- **Money**: Taka sign, grouping, no decimals when the paisa are zero: `৳50`, `৳1,250`, `৳99.50`.
  Rates read "৳50 an hour", "৳3,200 a night". All amounts come from the API in minor units; the
  client only formats.
- **Time**: 12-hour clock, Asia/Dhaka: "2:00 pm", ranges "2:00–4:00 pm". The timezone is named
  only when the device is set to another zone ("Bangladesh time").
- **Dates**: "Today", "Tomorrow", then "Sat 14 Nov". Never a numeric date on its own.
- **Codes**: bed codes and references are shown exactly as issued (`KOL-014`).

### 12.4 Language

English and Bangla from the start. All strings come from translation keys; none are written in
components. The language switch sits in the top bar on Explore and in Account, labelled in its own
language ("বাংলা" / "English"). Bangla uses Bangla digits for money and time. No string is built by
joining fragments, so word order can differ between languages.

## 13. Accessibility

Target: WCAG 2.2 AA on the web and the equivalent Android accessibility checks.

- Semantic landmarks, one `h1` per page, headings in order. Compose screens set
  `semantics { heading() }` on titles.
- Everything is operable by keyboard with a visible 2-unit `primary` focus ring offset by 2, and by
  TalkBack and switch access on Android. Focus moves into a sheet when it opens and back to its
  trigger when it closes.
- Contrast meets section 3.2. State never relies on colour.
- Forms: visible labels, errors next to the field and summarised at the top, entered values kept
  after an error, correct input types and autofill hints.
- Touch targets 48 × 48. Text scales to 200% without loss.
- Map content always has a list equivalent. The QR code has a text reference beside it.
- Reduced motion is respected (section 3.8).
- Status changes (order progress, bed taken, payment result) are announced through a polite live
  region or `LiveRegionMode.Polite`.

## 14. Android (Kotlin, Jetpack Compose)

The Android app is the same product, not a port. What is shared and how:

| Topic | Decision |
|---|---|
| Theme | `CoastlineTheme` implements sections 3 and 4 on Material 3. Dynamic colour off |
| Layout | `WindowSizeClass` drives the same pane patterns as section 5; `NavigationSuiteScaffold` switches bar and rail |
| Navigation | Navigation Compose graph with the route names of section 6; every route is an App Link |
| Components | Same names as section 9, in a `designsystem` module, so specs and reviews use one vocabulary |
| Data | The same REST `/api/v1`; client models generated from the OpenAPI document |
| Map | MapLibre Native for Android with the same sources and pin styles as the web map |
| Tickets | Cached for offline use; screen brightness raised while a ticket is shown |
| System integration | Edge-to-edge with insets handled, predictive back, system font scale, TalkBack |
| Minimum | Android 8.0 (API 26), which variable fonts require |

Web choices made so the Android app is straightforward: no hover-only interaction, bottom sheets
instead of popovers on small screens, a bottom navigation bar with four destinations, a single
primary action at the bottom of the screen, tokens named by Material role, and route paths that
double as deep links.

Open for the Android work: session handling for a native client (the web uses cookies; see
[security.md](security.md)) and the scanner app for attendants, which may ship as a staff mode in
the same app or as its own app.

## 15. Performance budget

A slow page on mobile data is a design failure.

- Explore is usable within 2.5 s on a mid-range Android phone on a 4G connection (Largest
  Contentful Paint), with layout shift under 0.1.
- The map library loads only on `/map` and the map inset, never on Explore's first paint at compact
  width.
- Images are served at the size they are shown, in a modern format, lazily below the first screen,
  with reserved space so nothing jumps.
- Two font files per script at most (variable). Text renders in the fallback first.
- Availability and order tracking refresh quietly; the page never blanks to reload.

## 16. Out of scope for this design

File uploads, notifications, real payment gateway screens, live chat, reviews written by visitors,
and loyalty features. They are not designed here and no control for them is shown.

## 17. Migration from the current interface

The current interface is a dark, map-first layout with monospace uppercase labels, a horizontally
scrolling seven-item bottom bar, a banner and badges that mark the product as a demo, and bed
selection on map markers. The order below keeps the site working after each step.

1. **Tokens and theme.** Replace the `@theme` block with section 3 and 4 tokens, light and dark.
   Swap fonts to Anek Latin and Anek Bangla. Remove the `label`, `panel`, `grid-paper` and
   `corner-ticks` utilities and the Tailwind default breakpoints.
2. **Shell.** New top bar, bottom navigation bar and navigation rail with four destinations. Remove
   `DemoBanner`, the "Demo" pill and the "Dev" badges. Move the account switcher into the account
   menu.
3. **Copy.** Apply section 12 across pages, toasts, metadata and exports. Move strings to
   translation keys.
4. **Explore and shoreline strip.** New home at `/`; move the map to `/map`.
5. **Sunbed booking.** New `/sunbeds/[pointCode]` with the bed strip and summary bar.
6. **Checkout and tickets.** Shared `/checkout`; `/trips` with redirects from `/bookings` and
   `/food/...`.
7. **Dining and hotels.** Restyle on the new components; rename `/food` to `/dining` with redirects.
8. **Operations.** New layout, `/admin/scan`, tables with card fallback.
9. **Flags.** Put `/rides` and `/activities` behind feature flags, off by default.

The steps above are broken into work packages with files, tests and completion tests in
[implementation-plan.md](implementation-plan.md).

Code follow-ups this design depends on (tracked in [implementation-plan.md](implementation-plan.md)):

- Payment contract: replace `paymentMethod: 'MOCK'` with a method list served by the API, and record
  the provider (`SANDBOX`) on the server side only. This needs a contract change and a new
  migration; applied migrations are not rewritten.
- A payment-methods read endpoint for checkout.
- Stable sign-in in place of the cookie-based account switch.
- A UI copy test that fails the build when a banned word from section 12.2 appears in rendered
  pages.

## 18. Acceptance checklist

- Every page works at 320, 360, 600, 840 and 1200 wide with no sideways page scroll, in light and
  dark themes, in English and Bangla, at 200% text size.
- Navigation matches section 5.2 at each size class; the bottom bar has four items and does not
  scroll.
- A visitor can book a sunbed from Explore to ticket in five screens or fewer, one-handed.
- The total shown before payment equals the amount charged, or the visitor confirmed the new total.
- A lost bed, a declined payment and a lost connection each leave the visitor on the same screen
  with their selection kept and a specific message.
- No banned word from section 12.2 appears in any user-facing surface. No screen claims government
  endorsement.
- Checkout renders no card, PIN or one-time-code field while the sandbox provider is active.
- All colours, type, radii and spacing come from tokens. No raw hex values in components.
- Keyboard and screen-reader users can complete booking, cancellation and check-in. Focus is
  visible. Status is not carried by colour alone.
- Unreleased services are absent from navigation and their routes are closed.
- The same route names, token names and component names are used in the Android app.
