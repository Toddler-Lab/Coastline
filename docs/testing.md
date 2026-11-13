# Test Strategy and Quality Gates

## 1. Objectives

Protect domain invariants, authorization boundaries, usability and the publishable-copy rule. Tests
use synthetic data and must never reach live payment or government systems.

**Status (2026-11-13).** Implemented: Vitest API and PostgreSQL integration specs under
`apps/api/src`, run with `pnpm test`. Not yet in place: a CI workflow, web unit tests, Playwright
and the copy, responsive and accessibility checks described below. They are added by WP-01, WP-06,
WP-21 and WP-22 of [implementation-plan.md](implementation-plan.md); until then, report those
layers as gaps, not as passed.

## 2. Test layers

- **Unit (Vitest):** tariff effective-date and `rate_type` selection, fee split arithmetic, state
  transitions, authorization policy, input validation.
- **API (Vitest + Supertest):** OpenAPI accuracy, success/error mapping, role checks, validation,
  pagination and cookie/CSRF behavior.
- **PostgreSQL integration (Vitest):** migrations, foreign/check constraints, provider scoping,
  balanced ledger, booking locking/idempotency/release, session persistence.
- **UI:** critical routes, loading/empty/error/offline states, keyboard flow, cancellation and
  refund copy, absence of upload/notification controls.
- **Responsive:** each critical route at 320, 360, 600, 840 and 1200 px wide, light and dark, with
  no horizontal page scroll, the right navigation pattern for the size class and 48 px touch
  targets ([design.md](design.md) sections 5 and 18).
- **Copy:** an automated check renders the critical routes, toasts, page metadata and exports and
  fails when a banned word from [design.md](design.md) section 12.2 appears. A second check asserts
  that checkout contains no card-number, CVV, PIN or one-time-code input.
- **Payment port:** the sandbox adapter approves, declines on a forced-failure fixture, refunds and
  honours idempotency keys; a declined charge leaves no confirmed booking.
- **Release control:** flagged-off routes answer not-found and are absent from navigation; startup
  rejects the sandbox adapter in production without the explicit allow setting.
- **E2E (Playwright):** Explore → beach point → beds → checkout → ticket; lost-bed conflict keeps
  the selection; table reservation; food order to a booked bed and tracking; cancel and refund;
  staff scan and check-in; listing submission → review; rate proposal → approval; notice → bid →
  recommendation; booking → ledger reconciliation; audit search. Run the visitor journeys in a
  phone viewport and a desktop viewport.

## 3. Concurrency and security tests

Use separate DB connections to race for the final inventory unit: exactly one hold succeeds and
available never goes negative. Retrying with the same idempotency key returns the same result.
Expiry and cancellation restore exactly once. Test cross-provider IDOR, privilege escalation, CSRF,
session fixation, validation abuse and finance read/write separation.

## 4. Quality gates

CI runs: format check, lint, TypeScript typecheck, Prisma validation, migration validation,
unit/integration/API tests, build and Playwright on the critical journeys. Accessibility automation
plus manual keyboard/screen-reader spot checks. Dependency scan as available. Do not report a check
as passed unless it was run; distinguish gaps from failures.

## 5. Fixtures

Deterministic synthetic records and a controllable clock. Never use production personal data.
Application seeds are separate from test fixtures; tests use an isolated database or schema. PostgreSQL tests use
the Docker Compose database or a disposable test container.
