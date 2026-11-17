# Test Strategy and Quality Gates

## 1. Objectives

Protect inventory, money and privacy invariants and authorization boundaries, and keep the main
journeys working on phones. Tests use synthetic data and never reach a live gateway or external
service.

## 2. Layers

- **Unit (Vitest):** pricing and commission arithmetic, cancellation refunds, photographer
  settlement (per photo, per package, per hour), match scoring, state machines, policy checks,
  formatters, contract validation per listing type.
- **API (Vitest + Supertest):** validation, status codes, role and scope checks for tourist,
  provider owner and staff, desk and admin; sealed bids; private lost-and-found fields; OpenAPI
  matches routes.
- **PostgreSQL integration:** migrations from empty and from the `dev` data; backfill correctness;
  constraints; slot locking; idempotency; ledger balance and reversal; payout netting.
- **Web unit (Vitest + Testing Library):** components in light and dark, keyboard behaviour,
  Bangla rendering, route helpers.
- **End to end (Playwright):** at 360 and 1280 px:
  1. Explore -> destination -> spot -> book a sunbed -> pay -> ticket offline.
  2. Book a stay and a boat departure through the shared checkout.
  3. Post a photographer request -> two providers bid -> counter -> accept -> pay deposit ->
     deliver -> select photos -> pay balance -> commission visible to admin.
  4. Report lost -> desk logs found -> match -> claim -> handover.
  5. Complaint -> desk acknowledges -> resolves.
  6. Provider applies -> admin approves -> listing submitted -> approved -> visible on Explore.
  7. Admin creates a destination and spot -> visible on Explore -> hidden again.

## 3. Concurrency and money tests

Race separate connections for the last slot, seat, room night, bed hour and table hour: exactly one
wins. Repeat payment and bid-acceptance calls with the same key: one effect. Two acceptances on one
request: one wins. Expiry and cancellation release once. Every ledger entry balances; refunds
reverse commission proportionally; a payment is in at most one payout.

## 4. Quality gates

Run after every work package:

```bash
pnpm format:check
pnpm typecheck
pnpm db:validate
pnpm test
pnpm build
```

Plus the Playwright suite once it exists, and a manual check of changed pages at 360, 768 and
1280 px in light and dark, by keyboard. Do not report a check as passed unless it was run; list
gaps separately from failures.

## 5. Fixtures

Deterministic synthetic seeds and a controllable clock. Tests use the isolated test database
(`TEST_DATABASE_URL`). Seeds for local use are separate from test fixtures. No real personal data,
no real phone numbers other than public emergency numbers.
