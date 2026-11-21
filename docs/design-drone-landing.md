# Drone-landing design: specification and implementation plan

**Status:** Implemented in `apps/web` on the immersive Hub pages (ADR-003 Accepted 2026-11-21);
remaining work is listed in section 7 and the open decisions in section 9.
**Branch:** `design/drone-landing` (cut from `redesign/v2` at `3ecca8d`)
**Prototype:** `design/drone-landing/` · **Screens:** `design/drone-landing/screens/`
**Media:** `apps/web/public/media/` · **Credits:** `apps/web/public/media/CREDITS.md`

This document is written for whoever continues the work, human or agent. Read it together with
`AGENTS.md`, `docs/design.md` and ADR-003. ADR-003 is accepted and its amendments are applied to
`docs/design.md`, so this document is the source of truth for the immersive Hub pages.

---

## 1. Goal

Make the visitor's first screens feel like flying over Bangladesh with a drone, then landing at a
spot where everything can be booked, without slowing down booking or breaking the platform rules
(independent platform, sandbox payments, help one tap away, WCAG 2.2 AA, Bangla first).

Design references supplied by the team (Dribbble): tourism website UI, tourism agency landing,
mountaineering activity page animation, premium travel platform, nature-conservation site. The shared
traits we took: full-bleed real landscape media, oversized display type with a serif accent, glass
controls over media, horizontal place rails, slow camera motion, and big "next place" teasers.

## 2. Pages and sections

Prototype views are hash routes; the real routes are in brackets.

### 2.1 Explore, `#home` (`/`)

| # | Section | Content | Screen |
|---|---|---|---|
| 1 | **Drone stage hero** | Six slides: Bangladesh (drone video), Cox's Bazar, Sylhet, Rangamati (drone video), Bandarban, Sundarbans. Kicker, title "Bangladesh, *from above.*", current place name (EN + BN) with an "Explore {place}" link, subtitle, search (where / when / guests), place rail with progress bars, Pause/Play, drone HUD | `01`, `02` |
| 2 | **Fly the map** | Bangladesh outline (Natural Earth), one pulsing pin per destination in its accent; hover or tap selects; a 3D-tilt photo card shows the destination, its spots and "Drop into {place}" | `03` |
| 3 | **Spots rail** | Horizontal scroll-snap row of all spots (portrait cards, kind tag in destination accent, EN + BN name, destination). Tilt on pointer. Click flies into the destination | `04` |
| 4 | **Services band** | Full-bleed aerial (wooden boats) with parallax; glass tiles for the nine bookable service types; Photographers highlighted as the signature service | `05` |
| 5 | **Photographers** | Two stacked aerials; "Post a request. *Pick a bid.*"; example rates (৳5 per photo, ৳100 for 20 photos, labelled as typical); three steps: request, sealed bids, keep what you love | `06` |
| 6 | **Help** | 999 national emergency (with "Coastline does not dispatch help"), lost and found, report a problem, nearby facilities | `07` |
| 7 | **Footer** | Destinations, travel, partners, independence and sandbox-payment statement, full media credits | - |

Floating **Help** button on every view (bottom right, danger colour, 56 px).

### 2.2 Destination, `#coxs` etc. (`/d/[destination]`)

| # | Section | Content | Screen |
|---|---|---|---|
| 1 | **Drone stage hero** | Destination media (video for Rangamati, photo elsewhere), breadcrumb, giant name, Bangla name, serif tagline, facts (best time, getting there, number of spots) | `08` |
| 2 | **Alert** | Highest-severity active alert (sample text in prototype) | `08` |
| 3 | **Section tabs** | Overview · Spots · Stay · Food · Move · Do · Help (sticky, as in design.md 5.2) | `08` |
| 4 | **Spot hub** | Nested backgrounds: the selected spot's photo fills the hub and crossfades when another spot is picked. Spot picker chips (photo + name), spot name (EN + BN) and kind tag; panel with **Book / Nearby / Know / Help** segments (design.md 7.3) | `09` |
| 5 | **Popular listings** | 4:3 photo cards, service tag in accent, title, spot, price with unit, Book | `10` |
| 6 | **Help** | 999, Coastline desk, lost and found | - |
| 7 | **Next destination** | Full-width photo teaser that flies to the next destination | - |

Phone layouts: `11-home-phone`, `12-destination-phone`.

## 3. Visual system

### 3.1 Tokens used (all exist in design.md 3.2 unless marked new)

| Token | Value | Use in this design |
|---|---|---|
| `primary` | `#0E6E6A` | Brand, primary buttons, eyebrow text |
| `primary-ink` *(new)* | `#08403D` | Primary button hover |
| `bg` | `#F7F8F8` (prototype uses `#F3F6F4`, align to token) | Page |
| `surface` | `#FFFFFF` | Cards, hub panel |
| `text` / `muted` / `border` | design.md values | Text |
| `danger` | `#B3261E` | Help button, emergency card |
| `warn` | `#9A5B00` | Alert banner |
| Accents | SEA `#0B7A8F`, FOREST `#2F7D32`, LAKE `#2457A6`, HILL `#8A5A1F` | Pins, tags, tabs, hub, prices on destination pages |
| `sun` *(new)* | `#E8A93A` | Kicker rule, progress bars, map pin highlight on dark media |
| `cream` *(new)* | `#F6E7C8` | Serif accent words on dark media |
| `stage-scrim` *(new)* | top 0.55 → 0 at 26%, 0 at 50%, 0.78 at 100% of `#06100F`; plus a radial vignette 0.45 | Text legibility over media. Required wherever text sits on media |
| `glass` *(new)* | `rgba(255,255,255,.14)` + `blur(16px)`, border `rgba(255,255,255,.28)` | Controls over media only |

### 3.2 Type

| Role | Desktop | Phone | Face |
|---|---|---|---|
| `display-xl` *(new)* | clamp(46 px, 7.4vw, 112 px) / 0.92, 800, -0.045em | 46 px | Inter, accent phrase in Instrument Serif italic |
| `display-dest` *(new)* | clamp(56 px, 9vw, 150 px) / 0.88, 800 | 56 px | Inter |
| `h2` | clamp(34 px, 4.6vw, 64 px) / 1, 800 | 34 px | Inter + serif accent |
| `eyebrow` | 12 px, 700, 0.18em, uppercase | same | Inter |
| `hud` | 11 px, 0.08em, uppercase | hidden | JetBrains Mono (decorative only) |
| Bangla | Hind Siliguri 400-700, line height ≥ 1.6 | same | - |

### 3.3 Shape and elevation

Radius: cards 22-24, hub 32, chips and buttons full, hero frame 0. Cards on light surfaces have a
border; cards over media have one soft shadow. This is softer than design.md 3.4 (`lg` 20); align
to `lg` in implementation unless ADR-003 says otherwise.

### 3.4 Iconography

The prototype uses inline stroke SVGs in the Lucide style (stroke 1.8). Use **Lucide** in the app,
with one fixed icon per service type, as design.md 3.5 requires: Stay `bed-double` / `hotel`,
Food `utensils`, Sunbeds `umbrella`, Rides `car`, Boats `sailboat`, Tours `compass`,
Tickets `ticket`, Guides `user-round`, Photographers `camera`.

## 4. Motion specification

All motion stops or becomes instant under `prefers-reduced-motion: reduce`.

| Name | What moves | Timing | Notes |
|---|---|---|---|
| **Drone drift** | Hero media: `scale(1.12) translate(-2%, 1.5%) rotate(-0.6°)` → `scale(1.02) translate(2%, -1.5%) rotate(0.5°)` | 22 s ease-in-out, alternate, infinite | Paused with the hero |
| **Dive** | Incoming slide media: from `scale(1.45) translateY(4%) rotate(-2°) blur(6px)` | 1.6 s `cubic-bezier(.16,1,.3,1)` | Then hands over to drift |
| **Circular reveal** | Incoming slide: `clip-path: circle(0% → 150%)` centred on the clicked rail item, pin or (auto) 78% / 50% | 1.5 s `cubic-bezier(.7,0,.2,1)` | Outgoing layer stays underneath until done |
| **Camera tilt** | Hero `.cam`: `rotateX(py × -3°) rotateY(px × 4°) translate(px × -26 px, py × -18 px)` | 0.9 s ease-out follow | Pointer only; off on touch and reduced motion |
| **Mist** | Two radial highlights drifting across the hero | 40 s linear alternate | Screen blend, 35% |
| **Auto-advance** | Next slide | every 8 s | Visible Pause/Play; paused on rail hover; off under reduced motion |
| **Progress** | Active rail bar width 0 → 100% | 8 s linear | Pauses with hero |
| **Text swap** | Place name, hub title: fade + 16 px rise + blur 6 px → 0 | 0.9 s / 0.6 s | - |
| **Tilt cards** | Map card and spot cards: rotateX/Y up to ±5° from pointer, lift 8 px on hover | 0.5 s ease-out | - |
| **Fly-through** | Clicked card photo expands from its rect to full viewport, then route change, then fade out | 1 s + 0.6 s | Use the View Transitions API in the app if available in Next.js 16 (check `node_modules/next/dist/docs`) |
| **Spot hub crossfade** | Spot background photos | 1.2 s opacity + slow scale 1.12 → 1.02 | - |
| **Scroll reveal** | Sections rise 40 px and fade in once | 1 s ease-out | IntersectionObserver, threshold 0.12 |
| **Parallax band** | Services background translateY(distance from viewport centre × -0.18) | on scroll | One band per page |

## 5. Media

| Need | Spec |
|---|---|
| Hero video | MP4 H.264, 1600 px wide, 18 s loop, muted, no audio track, 0.6 s fade in/out, about 3-6 MB. Always with a WebP poster (first good frame) |
| Hero photo | WebP, max 2200 px, quality 80, 16:9 or wider, subject in the lower-middle third (text sits bottom-left) |
| Spot photo | WebP, 4:3 or 3:4 crop must work; used in rail cards, hub background and listings |
| Credits | Every file listed in `apps/web/public/media/credits.json`; footer renders it |

The current files are real Wikimedia Commons photos and videos (CC BY / CC BY-SA). They stand in
until operators upload their own destination media; see CREDITS.md for obligations.

## 6. Mapping to the Next.js app

`apps/web` is Next.js 16 App Router, React 19, Tailwind CSS v4 with role tokens, SWR, MapLibre.
**Read `apps/web/node_modules/next/dist/docs/` before writing code** (AGENTS.md: this Next.js
version has breaking changes).

| Prototype part | App component (suggested) | Route / data |
|---|---|---|
| `.stage`, `.layer`, `.cam`, HUD, mist, scrim | `DroneStage` (client) with `DroneLayer`, `DroneHud` | Shared by `/`, `/d/[destination]` |
| Hero sequencer, rail, pause | `HeroSequencer` (client) | `/`: destinations list API (active, ordered) |
| Search inside hero | existing `SearchField` | `/search` |
| Map | `BangladeshMap` (SVG outline from `tools/bd-outline.mjs`, pins projected from destination lat/lng) | destinations API. Keep MapLibre for list/map toggles; the outline map is decorative navigation |
| Map card, spot cards | `TiltCard`, `SpotCard`, `CardRow` | destinations + spots APIs |
| Services band | `ServiceTile` (existing) on `PhotoBand` | service types with active listings (design.md 7.1 rule) |
| Photographers | `PhotographerPromo` | static copy + link to `/requests/new` |
| Help | existing `HelpButton`, `HelpSheet`, emergency contacts API | `/help/*` |
| Fly-through | `FlyTransition` or View Transitions | navigation from cards, pins, rail |
| Destination hero, facts, tabs | `DestinationHero`, existing section tab row | `/d/[destination]` |
| Spot hub with nested backgrounds | `SpotHub` (`SpotPicker`, `SpotHubPanel` with Book/Nearby/Know/Help) | `/d/[destination]/s/[spot]` (picker can deep-link) |
| Listings | existing listing card | listings API |
| Language toggle | existing i18n (WP-05) | `name_bn` fields |

### Data needed that does not exist yet

- `destinations.hero_video` (or a destination media list with type and poster) and coordinates for
  pins (coordinates already exist per design.md 5).
- `spots.hero_photo` (if not already present) and a short spot "kind" label (exists: `kind`).
- A media credit record (author, licence, source URL) for operator-uploaded media.

## 7. Implementation plan (work packages)

Each package is one reviewable pull request into `redesign/v2`, following the repository gate
(`pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`, Playwright where relevant).
Do not start before ADR-003 is accepted, except DL-01.

| WP | Title | Scope | Done when |
|---|---|---|---|
| **DL-01** | Media and credits | Keep `apps/web/public/media`; add a typed `media-credits` loader and a `MediaCredit` footer component | Footer lists every file from `credits.json`; no image without alt text |
| **DL-02** | Immersive tokens | Add `sun`, `cream`, `stage-scrim`, `glass`, `primary-ink`, `display-xl`, `display-dest`, motion durations and easings to the Tailwind v4 theme in `globals.css`; light and dark | Tokens used by DL-03..07; no raw colours in components |
| **DL-03** | `DroneStage` | Layers, drift, dive, circular reveal, pointer tilt, HUD, scrim, mist; `poster` as LCP image via `next/image` priority; reduced motion | Unit test for slide state; visual check against `screens/01`, `08` |
| **DL-04** | Explore hero | `HeroSequencer` with rail, progress, Pause/Play, search; data from destinations API | Pause works by mouse and keyboard; no auto-advance under reduced motion; Playwright test |
| **DL-05** | Map and spots rail | `BangladeshMap`, `TiltCard`, `SpotCard` row with scroll-snap | Pins keyboard reachable with names; matches `screens/03`, `04` |
| **DL-06** | Services band, photographers, help | `PhotoBand` with parallax, `ServiceTile` reuse, `PhotographerPromo`, help cards | Only service types with active listings show |
| **DL-07** | Destination and spot hub | `DestinationHero`, alert, sticky tabs, `SpotHub` nested backgrounds and segments, listings, next destination | Matches `screens/08`-`10`, `12`; deep link `/d/x/s/y` opens that spot |
| **DL-08** | Fly-through | View Transitions or `FlyTransition` | Works from cards, pins, rail; instant under reduced motion |
| **DL-09** | Quality | Lighthouse and WebPageTest on a mid-range phone profile, axe, contrast over media, Bangla layout pass | Targets in section 8 met and measured |
| **DL-10** | Data model | `hero_video` (or destination media), spot hero photo, media credit fields; admin editor fields | Migration + API + admin form; seeds updated |

Suggested order: DL-01 → DL-02 → DL-03 → DL-04 → DL-07 → DL-05 → DL-06 → DL-08 → DL-10 → DL-09.

**Implemented in the app (2026-11-21):** DL-01 media and credits, DL-02 tokens and type, DL-03
`DroneStage`, DL-04 Explore hero with rail and search, DL-05 map and spots rail, DL-06 services band,
photographers and help, DL-07 destination and spot heroes with nested backgrounds, and DL-08
fly-through. The EN/BN switch now writes a cookie and is shared by all Hub components. Still open:
DL-09 measured quality (axe, Lighthouse, 320 px pass), DL-10 data-model fields for operator media,
full Bangla copy across the whole site (WP-29), and the web test runner's wider Playwright journeys
(WP-01). Prices, distances, tips and desk numbers remain samples.

## 8. Acceptance criteria

- **Accessibility:** WCAG 2.2 AA. Auto-advancing hero has a visible Pause/Play control and stops on
  rail hover or focus. Under reduced motion there is no autoplay, drift, parallax, dive or fly.
  Text over media keeps 4.5:1 against the scrimmed area. All controls are 44 px minimum targets and
  keyboard reachable. Decorative HUD is `aria-hidden`.
- **Performance (to measure, not assumed):** LCP ≤ 2.5 s on a mid-range phone with 4G (poster is the
  LCP); only the first slide's video preloads; below-the-fold images lazy load; CLS < 0.1.
- **Content:** Bangla names on every place; no prices without unit; sample data clearly marked
  until real API data replaces it; independence statement and sandbox note in the footer; no claims
  of official tariffs or emergency dispatch.
- **Phone:** designed at 390 px; place rail becomes a horizontal chip row; HUD hidden; Help button
  icon-only; search stacks with a full-width Explore button. Add the bottom tab bar
  (Explore · Saved · Trips · Inbox · Profile) from design.md 5.1 in the app; the prototype omits it.

## 9. Open decisions

| # | Decision | Owner | Options |
|---|---|---|---|
| 1 | Accept ADR-003 | Product owner | Accept / accept with changes / reject |
| 2 | Where media lives long term | Tech lead | Repo `public/` (now, ~18 MB) / Git LFS / storage port (S3) |
| 3 | Hero video per destination in the data model | Tech lead | `hero_video` field / generic destination media table |
| 4 | Extra fonts (Instrument Serif, JetBrains Mono) | Design | Keep / drop serif accent / drop HUD |
| 5 | Bandarban and Sundarbans | Operator | Add as destinations / remove from the hero |
| 6 | Content accuracy of "Know" tips and best times | Operator | Review and replace before launch |

## 10. Known gaps in the prototype

- Prices, distances, alert text and desk numbers are samples.
- No bottom tab bar on phones (see section 8).
- No dark theme pass yet (design.md requires light, dark and system).
- Bangla toggle translates the main headings and nav only; full copy belongs to the i18n work (WP-05).
- Map projection is Mercator from Natural Earth 50m; fine for a decorative outline, not for
  distances.
