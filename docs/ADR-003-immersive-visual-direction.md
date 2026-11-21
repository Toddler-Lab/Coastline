# ADR-003: Immersive "from above" visual direction for visitor discovery pages

- **Status:** Accepted (product owner approved 2026-11-21; amendments applied to `docs/design.md`)
- **Date:** 2026-11-18
- **Branch:** `design/drone-landing`
- **Affects:** `docs/design.md` 3.1, 3.2, 3.3, 3.6, 7.1, 7.2, 7.3; visitor Hub pages only

## Context

`docs/design.md` defines a calm, quiet, photo-led UI and explicitly rules out glass blur, gradient
washes, tiny uppercase technical labels, parallax and autoplaying carousels (3.1, 3.6). The team
has asked for a landing experience that feels like flying over Bangladesh: real drone footage,
3D camera movement, animated transitions between places and nested photo backgrounds per spot.
A working prototype of that direction is in `design/drone-landing/` with screenshots in
`design/drone-landing/screens/`.

The two directions conflict. This ADR records the proposed change so the conflict is resolved
deliberately rather than by whichever agent touches the code next.

## Decision (proposed)

Adopt the immersive direction **only on the three Hub-shape discovery pages** (Explore `/`,
Destination `/d/[destination]`, Spot hub `/d/[destination]/s/[spot]`). List, Detail and Flow pages
(service lists, listing detail, booking, checkout, tickets, trips, help forms) and all provider,
desk and admin workspaces keep the current calm spec unchanged.

Inside the Hub pages:

1. **Hero media.** A full-viewport drone stage replaces the 21:9 hero on desktop. It shows a muted,
   looping drone video or a still photo, with a slow "drone drift" (scale and translate over 22 s)
   and a small pointer-driven 3D tilt. On phones the stage is full height but the tilt is off.
2. **Sequencing.** Explore cycles through destinations every 8 s with a circular reveal from the
   chosen place. It has a visible **Pause/Play** control (WCAG 2.2.2), pauses on hover or focus of
   the place rail, and does not auto-advance when `prefers-reduced-motion: reduce` is set.
3. **Drone HUD.** A decorative overlay (corner brackets, REC, timecode, coordinates, altitude) in a
   monospace face. It is `aria-hidden`, hidden on phones, and never carries information a visitor
   needs.
4. **Glass surfaces.** Translucent blurred panels are allowed only on top of hero media (search,
   place rail, facts, service tiles over the services band). Elsewhere surfaces stay solid.
5. **Parallax.** Allowed on the hero camera and on one full-bleed photo band per page; never on
   text or controls. Disabled under reduced motion.
6. **Display type.** Hero and section titles may use a larger display size than `display`
   (up to 112 px desktop) with an **Instrument Serif italic** accent phrase. Inter and Hind Siliguri
   remain the only text faces for body, labels and Bangla.
7. **Fly-through.** Opening a destination from a card or pin expands that photo to full screen
   (1 s) before the destination page appears. Disabled under reduced motion.
8. **Accents.** Unchanged: destination accents use the `SEA`, `FOREST`, `LAKE`, `HILL`,
   `HERITAGE`, `NEUTRAL` tokens from 3.2. The prototype already uses those values.

## Amendments to docs/design.md if accepted

| Section | Current text | Amended text |
|---|---|---|
| 3.1 Concept | "Avoid: glass blur, gradient washes, neon, stock tropical imagery, tiny uppercase technical labels, dense dashboards on visitor pages." | "Avoid: neon, stock tropical imagery, dense dashboards on visitor pages. Glass blur and photo-legibility gradients are allowed only over hero media on Hub pages (ADR-003). Uppercase technical labels are allowed only in the decorative drone HUD." |
| 3.3 Typography | One family (Inter + Hind Siliguri). | Add a `display-xl` role (56-112 px, 800, tracking -0.045em) for Hub hero titles, and an optional Instrument Serif italic accent phrase. JetBrains Mono only in the decorative HUD. |
| 3.6 Motion | "No parallax, no autoplaying carousels." | "On Hub pages only: hero drone drift, one parallax band, and an auto-advancing hero with a visible pause control, pause on interaction, and no auto-advance under reduced motion (ADR-003). Everywhere else: no parallax, no autoplay." |
| 7.1 Explore | Search, destination chips, 21:9 hero. | Drone stage hero with place rail, search inside the hero, then map, spot rail, services band, photographers, help (see `docs/design-drone-landing.md`). Destination chips stay on phones. |
| 7.2 / 7.3 | 21:9 hero; standard hub. | Full-height drone stage; spot hub with nested spot backgrounds (see the spec). |

## Consequences

- **Performance:** the hero becomes the LCP element. Mitigations are in the spec: a poster image as
  LCP, video `preload="metadata"` except the first slide, MP4 at ~3-6 MB per 18 s loop, and lazy
  loading for everything below the fold. This must be measured, not assumed.
- **Data:** destinations need an optional hero video (or a media list) in addition to the hero
  photo; spots need their own hero photo. This is a data-model change for `places`.
- **Accessibility:** extra work for pause control, reduced motion, and contrast of text over
  moving footage (scrim gradients are required).
- **Repository size:** about 18 MB of media in `apps/web/public/media`. Long term, move media to the
  storage port (S3-compatible) or Git LFS.
- **Scope creep risk:** keeping the direction to Hub pages keeps booking and workspace screens fast
  and predictable.

## Alternatives considered

1. **Keep design.md as is** and use photos only in the 21:9 hero. Lowest risk, but it does not
   deliver the requested experience.
2. **Immersive everywhere.** Rejected: hurts task speed on booking flows and workspaces and makes
   accessibility harder for little benefit.

## Approval

Approved 2026-11-21. The status above is **Accepted** and the amendments table has been applied to
`docs/design.md` in the same change. The immersive direction is authorised **only** on the three
Hub-shape discovery pages (`/`, `/d/[destination]`, `/d/[destination]/s/[spot]`); lists, details,
flows, help forms and the provider, desk and admin workspaces keep the calm spec unchanged.
