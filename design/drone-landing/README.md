# Drone-landing design (prototype)

A clickable, static prototype of the immersive "Bangladesh from above" visitor UI: a drone-video
hero, a map of Bangladesh, spot cards, destination pages and the spot hub. It is the **design
source of truth for this direction** until the Next.js implementation lands.

- Spec and implementation plan: [`docs/design-drone-landing.md`](../../docs/design-drone-landing.md)
- Decision record (status: Proposed): [`docs/ADR-003-immersive-visual-direction.md`](../../docs/ADR-003-immersive-visual-direction.md)
- Media and licences: [`apps/web/public/media/CREDITS.md`](../../apps/web/public/media/CREDITS.md)

This folder is **not application code**. Nothing in `apps/web` imports it. It is excluded from
Prettier (`.prettierignore`) so `pnpm format:check` is unaffected.

## Open it

Serve the repository root (so the relative media path resolves) and open the page:

```bash
# from the repository root
npx serve .            # or: python -m http.server 8080
# then open http://localhost:3000/design/drone-landing/index.html  (port as printed)
```

Opening `index.html` straight from disk also works in Chrome and Edge. The page reads media from
`../../apps/web/public/media/`; set `window.COASTLINE_MEDIA` before `data.js` loads to point it
elsewhere (for example `/media/` when served by Next.js).

Views are hash routes: `#home`, `#coxs`, `#sylhet`, `#rangamati`, `#bandarban`, `#sundarbans`.

## Files

| File | What it holds |
|---|---|
| `index.html` | Page shell: nav, `<main>` mount, floating Help button |
| `styles.css` | All styles. Top of file: tokens as CSS variables; then stage (drone camera), hero, map, spots, band, photographers, help, destination, spot hub, fly transition |
| `data.js` | Content: destinations, spots, service catalogue, sample nearby list, Bangladesh outline path and pin positions, media credits |
| `app.js` | Behaviour: hash router, hero sequencer (auto-advance, pause, circular reveal), drone camera parallax, map, fly-through transition, spot hub, language toggle |
| `screens/` | Reference screenshots (desktop 1440 x 900 and phone 390 x 844) |
| `tools/bd-outline.mjs` | Regenerates the Bangladesh SVG outline and pin coordinates from `world-atlas` (Natural Earth 50m) |

## What is real and what is sample

| Real | Sample (replace with API data) |
|---|---|
| Photos and video (Wikimedia Commons, credited) | Prices, units, listing titles |
| Bangladesh outline (Natural Earth) | Nearby facility distances |
| Destination and spot names (English and Bangla) | The alert banner text |
| Service catalogue and booking modes (from `docs/PRD.md`) | "Know" tips and best-time text (need operator review) |
| Photographer flow (sealed bids, per-photo / package) | Desk contact numbers |

Only Cox's Bazar, Sylhet and Rangamati are in the seed data. Bandarban and the Sundarbans are
included to show the five-landscape story; they become real only when the operator adds them.

## Regenerate the map outline

```bash
cd design/drone-landing/tools
npm i world-atlas@2 topojson-client d3-geo
node bd-outline.mjs      # writes bd.json: { path, pins }; paste into data.js (BD_PATH, PINS)
```
