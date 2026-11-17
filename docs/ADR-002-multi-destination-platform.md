# ADR-002: Multi-destination service platform

- **Status:** Accepted
- **Date:** 2026-11-17
- **Decision owners:** project team

## Context

Coastline was built as a Cox's Bazar beach product: the sunbed map was the home page and
`BeachPoint` was the root of the data. The project now covers many tourist destinations and a wide
set of services (stays, food, sunbeds, rides, boats, tours, tickets, photographers, help). The first
redesign attempt kept the beach-centred structure and reskinned every file before improving any
journey.

## Decision

1. Restart the redesign from `dev`; keep the API engines; preserve the earlier attempt on `wp/*`
   branches for reference.
2. Model places as **Destination -> Spot**, created by the operator. Services attach to a
   destination and optionally a spot.
3. Introduce **providers** and a generic **listing** for every service type, with operator approval.
4. Keep the sunbed, stay and dining engines; add one **generic offering engine** for time-slot,
   departure and entry bookings, and a **request-and-bid** flow for photographers, guides and
   charters.
5. One **checkout** through a payment-provider port with a sandbox adapter; record every payment
   with a **commission** split in a double-entry **ledger**; record **payouts**.
6. New UI: place-first hubs, one column, four page shapes, Explore · Saved · Trips · Inbox ·
   Profile, an always-available Help button; provider, desk and admin workspaces.
7. Allow **image uploads** and an **in-app inbox**; build **sign-in last**, with real role and scope
   checks from the start through the seeded-account switcher.

## Alternatives considered

- Continue the first redesign: structure tied to one coast; slow to show results.
- Flat list of spots without destinations: long lists, hotels forced onto one spot.
- One engine per new service: duplicated locking and checkout code.
- Merge all engines into one bookings table now: high-risk migration of tested code for little
  visible gain.
- Build sign-in first: slows every later phase; scopes can be enforced without it.

## Consequences

Large scope, split into ten milestones that each produce a working product. The data model grows
substantially; backfill migrations must be tested on existing data. AGENTS.md now allows uploads,
in-app notifications and recorded commission and payouts, while live money stays gated.
