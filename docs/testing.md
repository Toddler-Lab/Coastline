# Test Strategy and Quality Gates

## 1. Objectives

Protect domain invariants, authorization boundaries, usability and proposal/demo labels. Tests use
synthetic data and must never reach live payment or government systems.

## 2. Test layers

- **Unit (Vitest):** tariff effective-date and `rate_type` selection, fee split arithmetic, state
  transitions, authorization policy, input validation.
- **API (Vitest + Supertest):** OpenAPI accuracy, success/error mapping, role checks, validation,
  pagination and cookie/CSRF behavior.
- **PostgreSQL integration (Vitest):** migrations, foreign/check constraints, provider scoping,
  balanced ledger, booking locking/idempotency/release, session persistence.
- **UI:** critical routes, loading/error states, keyboard flow, responsive layout, demo disclaimers,
  cancellation and no-refund copy, absence of upload/notification controls.
- **E2E (Playwright):** search → hold → mock confirmation; listing submission → review; tariff
  proposal → approval; notice → bid → recommendation; booking → ledger reconciliation; audit search.

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

Deterministic synthetic records and a controllable clock. Never use production personal data. Demo
seeds are separate from test fixtures; tests use an isolated database or schema. PostgreSQL tests use
the Docker Compose database or a disposable test container.
