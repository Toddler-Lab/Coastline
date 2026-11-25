# Design Specification

**Audience:** product, design and web engineering · **Status:** target design for the v2 redesign
(branch `redesign/v2`), replaces the map-centred interface · **Last revised:** 2026-11-17

Coastline is a tourism service platform for Bangladesh. A visitor picks a destination (Cox's Bazar,
Sylhet, Rangamati and any destination an operator adds), opens a spot inside it (Laboni Beach,
Ratargul, Kaptai Lake), and finds everything that spot offers: places to stay and eat, sunbeds,
rides, boats, tours, entry tickets, photographers, nearby facilities, safety information and help
such as lost and found. Service providers run their business in their own portal, spot staff run a
desk, and the operator runs the platform from the admin console.

Plan and phases: [implementation-plan.md](implementation-plan.md). Data:
[data-model.md](data-model.md). Endpoints: [api.md](api.md).

## 1. Who we design for

| Person | Situation | What that demands |
|---|---|---|
| Visitor on the spot | Outdoors, phone in one hand, sun glare, mobile data | Light theme, large targets, short flows, tickets that open offline, help one tap away |
| Visitor planning ahead | Laptop or phone, days before the trip | Photos, clear prices, comparison, saving favourites |
| Service provider | Hotel desk, restaurant counter, boatman or photographer on the sand | A portal that fits their service type: rooms, menus, seats, bids; works on a phone |
| Spot desk staff | Standing at a counter or walking a beach | Scan tickets, log found items, take complaints, fast and dense |
| Operator (admin) | Desktop | Destinations, approvals, finance, disputes, audit |

Most visitors read Bangla first. Every layout must hold Bangla text without truncation.

## 2. Principles

1. **Place first, then service.** The visitor chooses where, then what. The spot hub is the heart of
   the product: one page that answers "what can I book, what is near, what should I know, where do I
   get help".
2. **Data shapes the screen.** Destinations, spots and the services offered at each are data. A new
   destination, spot or service type never needs a layout change or a new navigation item.
3. **One column, one primary action.** Pages scroll top to bottom in a single centred column. No
   screen uses three side-by-side panels. The primary action sits in the same place on every
   screen: bottom bar on phones, sticky card on desktop.
4. **Price before commitment.** The total, the platform fee and the cancellation rule are visible
   before the visitor pays. If the server price differs, the visitor sees the new total and
   confirms again.
5. **Help is never more than one tap away.** Emergency information, lost and found and reporting a
   problem are reachable from every visitor screen.
6. **One checkout, one ticket.** Every service pays through the same checkout and produces the same
   ticket shape.
7. **Familiar over clever.** Patterns follow what travellers already know from mainstream travel
   apps: search-first home, photo cards, bottom sheets, trip timeline, inbox.
8. **No claims we cannot back.** Coastline is an independent platform. Nothing implies government
   endorsement, official tariffs or police verification.

## 3. Visual language

### 3.1 Concept

Bright, photo-led and calm. Photography of the actual places carries the emotion; the interface
around it stays quiet: white and soft-grey surfaces, one deep teal brand colour, and a per-destination
accent that tints hero areas and selected states. Shapes are soft but not bubbly.

Avoid: neon, stock tropical imagery, dense dashboards on visitor pages. Glass blur and photo-legibility
gradients are allowed only over hero media on Hub pages (ADR-003). Uppercase technical labels are
allowed only in the decorative drone HUD.

### 3.2 Colour roles

Components use role tokens only, never raw values.

| Role | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F7F8F8` | `#0F1415` | Page background |
| `surface` | `#FFFFFF` | `#171D1E` | Cards, sheets, bars |
| `surface-alt` | `#EEF2F2` | `#1F2728` | Filled inputs, chips, skeletons |
| `text` | `#121A1C` | `#E8EEEE` | Primary text |
| `muted` | `#56656A` | `#9AABAE` | Secondary text, captions |
| `border` | `#DDE3E4` | `#2C3638` | Dividers, outlines |
| `primary` | `#0E6E6A` | `#5FD0C6` | Brand, primary buttons, links, selection |
| `on-primary` | `#FFFFFF` | `#00302D` | Text on primary |
| `action-bg` | `#0E6E6A` | `#08403D` | Filled actions and selected controls |
| `action-fg` | `#FFFFFF` | `#E8EEEE` | Text and icons on filled actions |
| `primary-soft` | `#DDF2EF` | `#123B39` | Selected chip, active tab background |
| `accent` | per destination | per destination | Hero tint, destination badge |
| `success` | `#1E7B3A` | `#7BD88F` | Confirmed, available |
| `warn` | `#9A5B00` | `#F2C46D` | Caution alerts, pending |
| `danger` | `#B3261E` | `#FF8A80` | Errors, emergency, cancelled |
| `info` | `#1F5FA8` | `#8DB8F2` | Informational alerts |
| `scrim` | `rgb(0 0 0 / 0.45)` | `rgb(0 0 0 / 0.6)` | Behind sheets and dialogs |

Destination accents, chosen by the operator per destination:

| Accent | Light | Dark | Typical destination |
|---|---|---|---|
| `SEA` | `#0B7A8F` | `#6FD3E6` | Cox's Bazar, Kuakata, Saint Martin's |
| `FOREST` | `#2F7D32` | `#8FD694` | Sylhet, Sundarbans |
| `LAKE` | `#2457A6` | `#93B7F0` | Rangamati, Kaptai |
| `HILL` | `#8A5A1F` | `#E3B474` | Bandarban, Khagrachari |
| `HERITAGE` | `#8E3B46` | `#EBA2AB` | Old Dhaka, Paharpur, Bagerhat |
| `NEUTRAL` | `#4F5B62` | `#B2BEC4` | Anything else |

All text on its background meets WCAG AA (4.5:1 body, 3:1 large text and icons) in both themes.
Status is never shown by colour alone: every status has a label and an icon.

### 3.3 Typography

One family with Latin and Bangla cuts: **Hind Siliguri** for Bangla and **Inter** for Latin, loaded
with `next/font`. Numbers use tabular figures in prices, times and tables.

On Hub pages only (ADR-003), a `display-xl` role (56-112 px, 800, tracking -0.045em) is available for
hero titles, with an optional Instrument Serif italic accent phrase and a decorative JetBrains Mono
HUD. Inter and Hind Siliguri remain the only text faces for body, labels and Bangla.

| Role | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 32 / 40 (40 / 48 desktop) | 700 | Destination and spot names on heroes |
| `title-lg` | 24 / 32 | 700 | Page titles |
| `title` | 20 / 28 | 600 | Section headings |
| `title-sm` | 16 / 24 | 600 | Card titles, sheet titles |
| `body` | 16 / 24 | 400 | Running text |
| `body-sm` | 14 / 20 | 400 | Secondary text |
| `label` | 14 / 20 | 600 | Buttons, chips, tabs |
| `caption` | 12 / 16 | 500 | Metadata, badges |

Body text is never below 14 px. Bangla line height is 1.6 or more.

### 3.4 Shape, elevation, spacing

- Radius: `sm` 8 (chips, inputs), `md` 12 (cards, buttons), `lg` 20 (sheets, hero media), `full`.
- Elevation: cards are flat with a `border`; sticky bars and sheets use one soft shadow level; no
  stacked shadows.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64. Page side margin 16 (phone), 24 (tablet), 32
  (desktop). Content max width 1200.

### 3.5 Imagery and icons

- Photos are real images of the place, at 4:3 on cards and 16:9 or 21:9 on heroes, always with alt
  text and a credit line where the licence requires it. Uploaded images are resized server side.
- Icons: Lucide, 20 px in body, 24 px in navigation, stroke 1.75. Each service type has one fixed
  icon used everywhere (tile, card badge, ticket, filter).

### 3.6 Motion

150-250 ms ease-out for sheets, tabs and expanding cards. On Hub pages only (ADR-003): hero drone
drift, one parallax band, and an auto-advancing hero with a visible pause control, pause on
interaction, and no auto-advance under reduced motion. Everywhere else: no parallax, no autoplay.
All motion stops or becomes instant under `prefers-reduced-motion`.

## 4. Layout and responsiveness

| Class | Width | Columns | Navigation |
|---|---|---|---|
| Compact | under 600 | 4 | Bottom bar |
| Medium | 600-1023 | 8 | Bottom bar, wider content |
| Expanded | 1024 and up | 12, max 1200 | Top bar |

Designed at 360 px first; never scrolls sideways at 320 px. Touch targets are at least 44 x 44 with
8 px between them. Nothing depends on hover. Sticky bars reserve their height plus
`env(safe-area-inset-bottom)` as page padding. The primary button stays visible above the on-screen
keyboard.

### 4.1 Four page shapes

Every visitor page is one of these.

| Shape | Compact | Expanded |
|---|---|---|
| **Hub** (Explore, destination, spot) | Hero, then stacked sections and horizontal card rows | Same stack; card rows become 3-4 column grids; a narrow "At a glance" side card on the spot hub |
| **List** (any service list, search, lost and found board) | Filter chips row, Filters button opens a sheet, one-column cards; List / Map toggle | Filter row above a 3-column grid; Map view splits list (400 wide) and map |
| **Detail** (listing, photographer, request) | Gallery, content, sticky bottom bar with price and primary button | Gallery, content in 8 columns, sticky booking card in 4 columns |
| **Flow** (booking steps, checkout, report forms) | One step per screen, progress at the top, primary button at the bottom | Centred 640-wide column, order summary card on the right |

Sheets: on compact screens filters, pickers, the help menu and confirmations open as bottom sheets;
on expanded screens as centred dialogs (max 560 wide) or a side sheet for filters.

## 5. Navigation

### 5.1 Visitor

Bottom bar (compact and medium) or top bar (expanded): **Explore · Saved · Trips · Inbox · Profile**.

```text
+---------------------------------------------------+
| Explore   Saved   Trips   Inbox(2)   Profile      |
+---------------------------------------------------+
```

- **Explore** is home: search, destinations, the current destination's spots and services.
- **Saved** holds saved listings, spots and photographers.
- **Trips** is the timeline of everything the visitor has: bookings, tickets, photographer jobs,
  lost-item reports and complaints.
- **Inbox** holds conversations with providers, bids on photographer requests, booking updates,
  lost-and-found matches and spot alerts. Badge shows unread count.
- **Profile** holds the account, language, theme, help centre, legal pages and the workspace
  switcher.

The **Help button** is a floating round button (bottom right, above the bottom bar) on every
visitor screen except checkout and ticket screens. It opens the Help sheet: Emergency, Lost and
found, Report a problem, Help centre. On expanded screens Help is also a top-bar item.

The top bar on expanded screens holds: logo, destination switcher, search field, the five
destinations, Help.

### 5.2 Inside a destination and a spot

A **section tab row** sits under the hero and sticks to the top when scrolled.

- Destination: Overview · Spots · Stay · Food · Move · Do · Help
- Spot: Overview · Book · Nearby · Know · Help

Tabs are generated from the services that exist there; a destination with no boats shows no boat
tile. On phones the row scrolls sideways with a partial next tab visible.

### 5.3 Workspaces

One account can hold several workspaces. The workspace switcher (Profile, and the avatar menu on
expanded screens) moves between Visitor, Provider, Desk and Admin. Until sign-in is built, the same
switcher picks a seeded account (see [security.md](security.md)).

| Workspace | Compact navigation | Expanded navigation |
|---|---|---|
| Provider `/provider` | Bottom bar: Today · Bookings · Listings · Inbox · More | Left sidebar 240 wide: Today, Bookings, Calendar, Listings, Requests (photographers and guides), Inbox, Earnings, Reviews, Business profile |
| Desk `/desk` | Bottom bar: Scan · Lost & found · Reports · More | Left sidebar: Scan, Arrivals, Lost & found, Reports, Alerts |
| Admin `/admin` | Bottom bar: Overview · Approvals · Help desk · More | Left sidebar: Overview, Destinations, Providers, Listings, Bookings, Payments, Payouts, Lost & found, Complaints, Alerts, Users, Settings, Audit |

The provider sidebar adapts to the provider's service types: a hotel sees Rooms; a restaurant sees
Menu and Tables; a photographer sees Requests, Packages and Portfolio.

## 6. Routes

Public routes are stable deep links.

### 6.1 Visitor

| Route | Page | Shape |
|---|---|---|
| `/` | Explore | Hub |
| `/search?q=&type=&destination=` | Search results | List |
| `/d/[destination]` | Destination | Hub |
| `/d/[destination]/[service]` | Service list in a destination (`stay`, `food`, `sunbeds`, `rides`, `boats`, `tours`, `tickets`, `photographers`, `shopping`, `facilities`) | List |
| `/d/[destination]/s/[spot]` | Spot hub | Hub |
| `/d/[destination]/s/[spot]/[service]` | Service list at a spot | List |
| `/l/[listing]` | Listing detail (any bookable or info listing) | Detail |
| `/l/[listing]/book` | Booking steps for that listing | Flow |
| `/sunbeds/[beachPoint]` | Sunbed picker (map) | Flow |
| `/photographers/[provider]` | Photographer profile, packages, portfolio | Detail |
| `/requests/new?type=photographer&spot=` | Post a photographer request | Flow |
| `/requests/[ref]` | Request with incoming bids | Detail |
| `/checkout/[draft]` | Shared checkout | Flow |
| `/trips` | Trips timeline | List |
| `/trips/[ref]` | Ticket or order detail | Detail |
| `/inbox`, `/inbox/[thread]` | Inbox and a conversation | List, Detail |
| `/saved` | Saved items | List |
| `/help` | Help centre for the current destination | Hub |
| `/help/emergency` | Emergency information | Detail |
| `/help/lost-found` | Lost and found board and actions | List |
| `/help/lost-found/report?kind=lost\|found` | Report an item | Flow |
| `/help/lost-found/[ref]` | A report or a found item, with claim | Detail |
| `/help/report` | Report a problem (complaint) | Flow |
| `/profile` | Profile and settings | Hub |
| `/about`, `/terms`, `/privacy` | Information pages | Detail |

### 6.2 Provider, desk, admin

| Route | Page |
|---|---|
| `/provider/onboarding` | Become a provider: business details, service types, destination, documents |
| `/provider` | Today: arrivals, open requests, recent bookings, earnings this week |
| `/provider/listings`, `/provider/listings/[id]` | Listings and the listing editor (adapts to type) |
| `/provider/calendar` | Availability and blocked dates |
| `/provider/bookings`, `/provider/bookings/[ref]` | Bookings, check-in, cancel |
| `/provider/requests`, `/provider/requests/[ref]` | Open photographer or guide requests, place a bid |
| `/provider/inbox` | Conversations |
| `/provider/earnings` | Gross, commission, net, payouts |
| `/provider/reviews` | Reviews and replies |
| `/desk` | Scan a ticket or enter a reference |
| `/desk/lost-found`, `/desk/lost-found/[ref]` | Log found items, verify claims, hand over |
| `/desk/reports` | Complaint intake for the desk's destination |
| `/admin` | Overview |
| `/admin/destinations`, `/admin/destinations/[slug]` | Destinations and their spots |
| `/admin/providers`, `/admin/providers/[id]` | Provider applications and accounts |
| `/admin/listings` | Listing approval queue |
| `/admin/bookings` | All bookings |
| `/admin/payments`, `/admin/payouts` | Payment records, commission, payouts |
| `/admin/lost-found`, `/admin/complaints`, `/admin/alerts` | Help operations |
| `/admin/users`, `/admin/settings`, `/admin/audit` | Users, commission and platform settings, audit log |

### 6.3 Routes from the current build

| Current | New |
|---|---|
| `/` (beach map) | `/` Explore; the map moves to `/sunbeds/[beachPoint]` |
| `/hotels`, `/hotels/[slug]` | `/d/[destination]/stay`, `/l/[listing]` |
| `/food`, `/food/[code]` | `/d/[destination]/food`, `/l/[listing]` |
| `/bookings`, `/bookings/[ref]`, `/food/orders/[ref]`, `/food/reservations/[ref]` | `/trips`, `/trips/[ref]` |
| `/rides`, `/activities` | `/d/[destination]/rides`, `/d/[destination]/tours` |
| `/admin/bookings`, `/admin/points`, `/admin/dining/*` | `/desk`, `/provider/*`, `/admin/*` |

Every old route answers with a permanent redirect.

## 7. Page specifications

### 7.1 Explore (`/`)

> **Immersive Hub (ADR-003).** The 21:9 hero and destination chips described below are replaced by a
> full-viewport drone stage with a place rail and search inside the hero, followed by the fly-the-map
> section, spots rail, services band, photographers and help. See `docs/design-drone-landing.md`
> section 2.1. Destination chips stay on phones. The text and rules below still apply to the search,
> service tiles and alerts in those sections.

```text
+-----------------------------------------+
| (logo)          [Cox's Bazar v]   (bell) |
| +-------------------------------------+ |
| | Search stays, food, boats, places   | |
| +-------------------------------------+ |
| (Cox's Bazar)(Sylhet)(Rangamati)(More>) |
|                                         |
| [   destination hero photo         ]    |
| Cox's Bazar · 120 km of sea beach       |
| [!] Sea: caution today        Details > |
|                                         |
| What do you need?                       |
| [Stay ][Food ][Sunbed][Rides]           |
| [Boats][Tours][Photo ][Tickets]         |
|                                         |
| Spots in Cox's Bazar             All >  |
| [photo][photo][photo]  >                |
| Popular stays                    All >  |
| [card][card][card]  >                   |
| Recently viewed                         |
+-----------------------------------------+
| Explore Saved Trips Inbox Profile   (?) |
+-----------------------------------------+
```

- Search accepts free text and suggests places, listings and service types as the visitor types
  ("boat Kaptai", "photographer Inani").
- Destination chips switch the page below them; the choice is remembered.
- Service tiles show only service types that have at least one active listing in the destination.
- Active spot alerts for the destination appear as one compact banner with the highest severity.

### 7.2 Destination (`/d/[destination]`)

> **Immersive Hub (ADR-003).** The 21:9 hero is replaced by a full-height drone stage (media video
> or photo, breadcrumb, giant name, Bangla name, serif tagline, facts). See
> `docs/design-drone-landing.md` section 2.2. All content and behaviours below remain in scope.

Hero (21:9 desktop, 4:3 phone) with name, tagline and accent. Section tab row. Overview holds: about,
best time to visit, how to get there, the service tiles, the spot list, popular listings per service,
current alerts, and help contacts for the destination.

### 7.3 Spot hub (`/d/[destination]/s/[spot]`)

> **Immersive Hub (ADR-003).** The hero and spot hub use nested, crossfading spot backgrounds: the
> selected spot's photo fills the hub and crossfades when another spot is picked, with a photo spot
> picker and Book / Nearby / Know / Help segments. See `docs/design-drone-landing.md` section 2.2.
> Every booking, alert, emergency and help behaviour below is preserved.

```text
+-----------------------------------------+
| <  Laboni Beach                 (♡)(⋯)  |
| [          hero photo              ]    |
| Cox's Bazar · Beach · Open 6am-7pm      |
| (sun) 31°  Sea: caution  Entry: free    |
| Overview  Book  Nearby  Know  Help      |
|-----------------------------------------|
| Book here                               |
| [Sunbeds][Food][Stay][Rides]            |
| [Photographers][Tours]                  |
|                                         |
| Popular at Laboni                       |
| [card][card][card] >                    |
|                                         |
| Nearby          [List | Map]            |
| (ATM 200m)(Pharmacy)(Washroom)(Prayer)  |
|                                         |
| Need help?                              |
| [Lost & found] [Emergency] [Report]     |
|                                         |
| Know before you go                    > |
| Rules · Safe swimming zones · Tides     |
+-----------------------------------------+
```

- The status line shows live conditions: weather (when a provider is configured), the current alert
  and entry price or "free".
- **Book** lists the bookable service types present at the spot, then popular listings.
- **Nearby** lists facility listings (ATM, pharmacy, hospital, washroom, prayer room, parking,
  police box, lifeguard post, first aid) sorted by distance from the spot, with a map toggle.
- **Know** holds operator-written content: rules, safety notes, best time, entry hours, how to get
  there, local customs.
- **Help** shows the destination's desk, emergency numbers and the lost-and-found shortcut.
- On expanded screens an "At a glance" card sits on the right: hours, entry, emergency number,
  nearest desk, "Report lost item".

### 7.4 Service list (`/d/[destination]/[service]`)

Filter chips row: spot, date, price range, rating, service-specific filters (stay: guests, room
type; food: cuisine, reserve, delivers to sunbed; rides: vehicle, seats; photographers: photo, video,
drone, price per photo). Sort: recommended, price, rating, distance.

Card: photo 4:3, name, spot and distance, rating with count, one key fact (for example "Sea view",
"Delivers to your sunbed", "Tk 5 per photo"), price "from Tk 3,500 / night" with the unit always
shown, save button. Map view shows price pins.

### 7.5 Listing detail (`/l/[listing]`)

Gallery (swipe on phone, grid of five on desktop), name, provider, spot, rating, key facts as chips,
description, what is included, options (rooms, menu, packages, departure times), cancellation rule,
location card, reviews, provider card with "Message". Sticky booking card or bottom bar: price with
unit, the inputs needed for that type (dates, time, seats, quantity) and the primary button.

The booking inputs depend on the listing's booking mode (see [workflows.md](workflows.md)):

| Mode | Inputs | Examples |
|---|---|---|
| `NIGHTS` | Check-in, check-out, guests, room type | Stays |
| `TIME_SLOT` | Date, start time, duration | Sunbeds, tables, kayak hire |
| `DEPARTURE` | Date, departure, seats | Boat trips, tours, shared jeeps |
| `ENTRY` | Date, ticket types and counts | Parks, eco-parks, museums |
| `ORDER` | Menu items and quantities, delivery target | Food to a sunbed |
| `QUOTE` | Request form; providers bid | Photographers, private guides, charters |
| `INFO` | No booking; contact and directions | Facilities, shops, emergency points |

### 7.6 Sunbed picker (`/sunbeds/[beachPoint]`)

```text
+-----------------------------------------+
| <  Sunbeds · Laboni Beach               |
| (Laboni)(Sugandha)(Kolatoli)(Inani) >   |
| [Today v]  [2 pm v]  [2 hours v]        |
| +-------------------------------------+ |
| |                                     | |
| |   map of the bed row, full width    | |
| |   o free   * yours   x booked       | |
| |                                     | |
| +-------------------------------------+ |
| Bed list (accessible alternative)    v  |
|-----------------------------------------|
| 2 beds · 2 h · Tk 200        [Continue] |
+-----------------------------------------+
```

The map is full width. Every bed is also selectable from an accessible list below the map. The
summary bar shows count, time and total and leads to checkout.

### 7.7 Photographers

**Two ways to hire**, matching how photographers work at Bangladeshi spots:

1. **Book a package directly** from a photographer's profile: for example "20 photos for Tk 100",
   "Tk 5 per edited photo", "30-minute reel Tk 800". Packages state price unit (per photo, per
   package, per hour), the photo count included, extra-photo price, delivery time and format (soft
   copy, print).
2. **Post a request and receive bids** (`/requests/new`): spot, date, time window, number of people,
   type (photo, video, drone, reel), expected photo count, optional budget per photo or total.
   Verified photographers at that destination bid during the bidding window.

Request page:

```text
+-----------------------------------------+
| <  Your request · CXB-PH-4821           |
| Laboni Beach · Sat 23 Nov · 4-6 pm      |
| Photos · 4 people · ~30 photos          |
| Bids close in 1 h 12 m                  |
|-----------------------------------------|
| 5 bids                     Sort: Best v |
| +-------------------------------------+ |
| | (img) Rafiq Studio  ★4.8 (126)      | |
| | Tk 4 / photo · 30 photos = Tk 120   | |
| | Extra photos Tk 4 · delivery 2 h    | |
| | [portfolio thumbnails]              | |
| | [Counter]   [Message]   [Accept]    | |
| +-------------------------------------+ |
| ...                                     |
+-----------------------------------------+
```

- Bids are sealed: a photographer sees only their own bid.
- Each bid shows the comparable total for the requested photo count, plus the per-photo and extra
  price, so visitors compare like with like.
- The visitor may send one counter-offer per bid; the photographer accepts, declines or revises once.
- Accepting creates a booking that goes to checkout for a deposit (operator setting, default 20 %).
  The other bids close automatically.
- After the shoot the photographer uploads a preview set or a delivery link and states the final
  count. The visitor selects the photos they keep (per-photo pricing) or confirms the package, and
  pays the balance. See [workflows.md](workflows.md) section 5.

### 7.8 Checkout (`/checkout/[draft]`)

One page for every service:

1. **Review**: items, dates, price lines, platform fee line, total, cancellation rule.
2. **Contact**: name and phone (prefilled from the account).
3. **Pay**: choose bKash, Nagad, card or pay at the venue (where the provider allows it). The
   payment step opens the gateway screen of the payment provider in use. While the sandbox gateway
   is active it shows the method, amount and Approve / Decline, and never asks for card numbers,
   PINs or one-time codes.
4. **Done**: the ticket.

If the server total differs from the shown total, checkout stops and shows the new total.

### 7.9 Ticket and trip detail (`/trips/[ref]`)

Large QR, reference in a mono font, service icon and name, spot, date and time, people or items,
paid amount and the receipt link, status, cancellation button with its deadline, directions,
"Message provider", "Report a problem". Tickets cache in the browser and open offline.

### 7.10 Trips (`/trips`)

Tabs: Upcoming · Past · Requests · Reports. Upcoming groups by day; "Today" shows live items first
(active sunbed time, food order status, photographer arriving). Requests holds photographer and guide
requests with bid counts. Reports holds lost-item reports, claims and complaints with status.

### 7.11 Inbox (`/inbox`)

Threads with providers (per booking or per request), system updates (booking confirmed, bid received,
match found, alert). A conversation shows the linked booking or request as a pinned card at the top.
Text only; images are attached through the relevant feature (portfolio, lost item), not chat.

### 7.12 Help

Help sheet (from the floating button):

```text
+-----------------------------------------+
| How can we help?                        |
| [!] Emergency                         > |
|     Call 999, nearest hospital          |
| [?] Lost something / found something  > |
| [flag] Report a problem               > |
|     Overcharging, safety, a listing     |
| [i] Help centre                       > |
+-----------------------------------------+
```

**Emergency** (`/help/emergency`): the national emergency number 999 and other public numbers the
operator enters for the destination (tourist police, fire, hospital, coast guard), each with a call
button, then the nearest hospital, first aid and lifeguard posts from Nearby. The page states these
are public numbers and Coastline does not dispatch help.

**Lost and found** (`/help/lost-found`):

- Two primary actions: "I lost something" and "I found something".
- The board lists found items for the current destination with category, spot, date and a generic
  description. Distinguishing details and photos are private.
- "This might be mine" starts a claim: the visitor answers the item's verification questions and
  books a time to collect at the desk.
- The visitor's own reports show status and suggested matches.

**Report a problem** (`/help/report`): category (overcharging, safety, cleanliness, a listing is
wrong, a provider behaved badly, other), spot, optional linked booking, description, optional
photos. Returns a reference; status appears in Trips, Reports.

### 7.13 Profile (`/profile`)

Account details, language (Bangla, English), theme (system, light, dark), saved payment method
labels (never credentials), workspace switcher, become a provider, help centre, about, terms,
privacy.

### 7.14 Provider portal

- **Onboarding**: business name, service types, destination and spots, contact, payout method
  label, verification documents (uploaded, reviewed by the operator). Status: submitted, approved,
  changes requested, rejected.
- **Today**: arrivals and departures, open requests near them, pending orders, today's earnings.
- **Listing editor**: one form shell with sections that depend on booking mode: photos, details,
  options, prices with units, capacity and schedule, cancellation rule. New listings and material
  changes go to operator approval.
- **Calendar**: availability per listing; block dates or slots.
- **Bookings**: list with filters; check in by scanning or reference; cancel with a reason.
- **Requests** (photographers, guides): open requests at their destination with time left, place or
  revise a bid, accepted jobs, mark delivered with photo count.
- **Earnings**: per booking gross, commission, net; payout history and the next payout.
- **Reviews**: reply once per review.

### 7.15 Desk

- **Scan**: camera scanner with a reference fallback; result card with ticket, service and status,
  and "Check in".
- **Lost and found**: log a found item (category, spot, where found, description, private details,
  verification questions, photos, storage location); claims queue; hand over after checking ID;
  expiry list.
- **Reports**: complaints for the desk's destination; acknowledge, add a note, escalate to admin,
  resolve.

### 7.16 Admin console

Overview (bookings, gross, commission, active providers, open complaints, per destination);
destinations and spots editor with drag ordering, hero photo, accent, content sections and help
contacts; provider approvals; listing approvals with a diff of changes; payments and refunds;
commission settings per service type; payouts; lost-and-found and complaints oversight; alerts;
users and roles; audit search.

## 8. Component library

Shared by all workspaces, built on accessible primitives (Radix for dialog, sheet, tabs, popover,
radio group, select).

Foundations: `Button` (primary, secondary, text, danger; sizes), `IconButton`, `Chip` (filter,
choice, input), `Badge`, `StatusBadge`, `TextField`, `TextArea`, `Select`, `DatePicker`,
`TimePicker`, `Stepper` (quantity), `Tabs`, `SectionTabs` (sticky), `Sheet`, `Dialog`, `Snackbar`,
`Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `Rating`, `Money`, `PriceUnit`.

Patterns: `TopBar`, `BottomBar`, `Sidebar`, `WorkspaceSwitcher`, `DestinationSwitcher`,
`SearchField` with suggestions, `HelpButton` and `HelpSheet`, `Hero`, `ServiceTile`, `CardRow`,
`ListingCard`, `SpotCard`, `ProviderCard`, `FilterBar`, `MapToggle`, `MapView`, `Gallery`,
`BookingCard` / `BookingBar`, `PriceBreakdown`, `CheckoutSteps`, `GatewayScreen`, `Ticket` with QR,
`TripTimeline`, `BidCard`, `CounterOfferSheet`, `ThreadList`, `MessageComposer`, `AlertBanner`,
`NearbyList`, `LostItemCard`, `ClaimForm`, `ReportForm`, `DataTable` (responsive: cards on compact),
`MetricCard`, `ApprovalDiff`, `ImageUploader`.

Every component supports light and dark, Bangla text, keyboard use and a loading state.

## 9. Loading, empty, error and offline

- Loading: skeletons in the shape of the content; never a full-page spinner.
- Empty: one sentence on why it is empty and one action ("No boats at this spot yet. See boats in
  Rangamati").
- Error: what failed, a retry button, and the reference of anything already paid.
- Offline: a bar at the top; tickets and the last viewed trip work; booking actions are disabled
  with an explanation.
- Optimistic actions (save, mark read) with an undo snackbar instead of confirmation dialogs.
  Destructive actions (cancel booking, reject bid) use a confirmation sheet that states the result.

## 10. Content and copy

- Plain words, sentence case, active voice. Buttons are verbs ("Book sunbed", "Accept bid").
- Money: "Tk 1,250" in English and "১,২৫০ টাকা" in Bangla; always with the unit ("/ night",
  "/ hour", "/ photo", "/ person").
- Dates and times in Asia/Dhaka, 12-hour clock in English.
- Prices are set by providers; nothing calls them official or government tariffs. Reviews come only
  from completed bookings.
- Payment wording is the same as a live gateway. Receipts, provider earnings and admin finance views
  show each payment's provider field (for example `SANDBOX`), so recorded payments are never read as
  settled money.
- Emergency and safety content states its source and that Coastline does not dispatch help.
- Lost and found never mentions police verification.

## 11. Accessibility

WCAG 2.2 AA. Every interactive element is keyboard reachable in visual order with a visible 2 px
focus ring. Sheets and dialogs trap focus and return it on close. The bed map, all maps and the QR
scanner have list or text alternatives. Form errors are announced and linked to their field. Touch
targets are at least 44 x 44. Text scales to 200 % without loss. Language is set on the document and
on mixed-language fragments.

## 12. Performance

On a mid-range Android over 4G: first contentful paint under 2 s on Explore, interaction to next
paint under 200 ms, JavaScript for a visitor page under 200 KB compressed. Maps load only on pages
and views that show a map. Images are served resized with `srcset` and lazy below the fold.

## 13. Acceptance checklist

- A destination, spot, provider and listing created through the portals appear on Explore with no
  code change, and disappear when hidden.
- Each booking mode books through the shared checkout and produces a ticket in Trips.
- A photographer request receives bids, one is accepted, the job is delivered and paid by photo
  count, and the commission appears in admin finance.
- Lost item: report, match, claim, hand over, all visible in Trips and the desk.
- Help is reachable in one tap from every visitor screen.
- Every page works at 320, 360, 768 and 1280 px, in light and dark, by keyboard, in Bangla and
  English, and never scrolls sideways.
