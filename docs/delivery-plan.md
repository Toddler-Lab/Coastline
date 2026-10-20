# Delivery Plan and Demo Acceptance

## 1. Twelve-week MVP plan

| Week | Outcome |
|---|---|---|
| 1 | Confirm baseline, CI, UX shell, privacy/threat review |
| 2 | Schema/migrations, sessions/auth/CSRF, RBAC, seed framework |
| 3 | Provider membership, listing editor, moderation queue |
| 4 | Public catalogue/detail and indicative tariff reads |
| 5 | Products, inventory, tariff proposal/review |
| 6 | Booking holds/confirmation/expiry and concurrency safety |
| 7 | Mock checkout, booking views and provider calendar |
| 8 | Procurement notices/lots/bids |
| 9 | Evaluation, demo recommendation, draft contract/dues |
| 10 | Double-entry demo ledger, reconciliation and reports |
| 11 | Audit search, security/accessibility/E2E pass |
| 12 | Fixes, seed/demo rehearsal, deployment rehearsal and handoff |

Team is 2–4 developers. Assign one owner for schema/migrations and one for web/design integration;
review shared contracts before parallel edits.

## 2. Release acceptance

Only approved listings and effective internally approved tariffs are public; provider isolation is
enforced; mock booking never charges; last-unit race has one winner; expiry/cancel restores once;
price snapshots are immutable; procurement workflow is traceable and non-binding; posted journals
balance and reverse; audit has actor/time/reason; all authority/money concepts are clearly labelled;
responsive keyboard-usable interface; migration/seed/OpenAPI reproducible; 10-minute walkthrough
succeeds.

No upload, notification or real payment/government integration is required for MVP.

## 3. Stakeholder demo script

Show proposal banner and central beach scope; browse sunbeds and transport fare references; create
mock booking; submit listing and internally approve; propose tariff and inspect history; view
concession notice/synthetic bids/recommendation; trace booking to simulated ledger/prototype revenue
estimate; inspect audit actor/time/reason.

## 4. Go-live gate

Before any real pilot, obtain explicit authorization and resolve official boundary, lawful
tariff/procurement rules, privacy/retention, support/safety operations, hosting, licensed
maps/payments, security assessment and formal agreements. This MVP acceptance is not a
production-readiness or legal approval.
