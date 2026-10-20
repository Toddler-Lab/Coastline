# UX and Design Specification

**Audience:** product design, frontend engineering · **Status:** MVP baseline

## 1. Experience principles

Make service conditions and provenance visible; keep booking predictable; surface availability,
cancellation terms and the simulated-payment boundary before commitment; provide clear recovery
paths; admin screens prioritize queues, evidence and audit. Never use design to imply government
endorsement.

## 2. Information architecture

Public: Home, Explore, Listing detail, Tariff explainer, Demo booking, Proposal/About. Visitor:
bookings/profile. Provider: overview, listings, products/inventory, booking calendar, tariff
proposals, activity. Admin: listing/tariff queues, procurement, contracts/dues, finance, audit,
users/providers, pilot configuration.

There is no notification center, media library or file-upload screen in MVP.

## 3. Visual system

Calm coastal civic-service clarity. Suggested tokens: deep navy, sea teal, warm sand; high-contrast
surfaces; restrained borders/cards; consistent spacing and type scale. Define CSS variables/design
tokens. Use semantic status colors plus text/icons; never color alone. No official seals, flags or
government-branded identity.

## 4. Components and interaction patterns

Use accessible Radix primitives with Tailwind; shadcn/ui components may be copied in where useful.
Shared components: status badge, demo/provenance banner, currency/date formatter, availability
summary, form field/error, confirmation dialog, empty/loading/error state, responsive data table.
Keep forms keyboard friendly and preserve entered values after validation errors.

Listing imagery is rendered from seeded or remote URLs with descriptive alt text. There is no
provider upload control, cropper or media library.

## 5. Required content cues

Persistent banner: “Proposal demo — not an official government service.” Price status: “Indicative
demo rate”; show source, validity and last verified. Checkout: “Simulated only — no payment is
processed.” Finance and exports: “SIMULATED — no money collected or owed.” Distinguish internal
platform approval from any public authority decision. Show timezone, availability freshness,
cancellation terms and the no-refund rule.

## 6. Responsive behavior

Design mobile first at 360px. Filters become drawer/sheet on narrow view. Tables collapse into cards
or accessible horizontal scroll. Admin queues support tablet and desktop. No critical action depends
on hover.

## 7. Accessibility and localization

Target WCAG 2.2 AA practices: semantic landmarks/headings, keyboard support, visible focus, labels,
error summaries, sufficient contrast, reduced motion, descriptive alt text. Charts have table
equivalents. English first; use translation keys and centralized date/currency formatting so Bangla
can be added without rewriting views.

## 8. UX acceptance checklist

Every page is usable at mobile width; focus order is logical; status is understandable without
color; required disclaimer remains visible; no simulated amount is presented as collected or owed;
forms announce errors and preserve input; map content has a list alternative; cancel-before-start
is clear and no-refund language is visible; no upload or notification affordance is shown.
