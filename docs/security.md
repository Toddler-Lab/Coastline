# Security, Privacy and Access Control

**Status:** baseline; legal/privacy review required before public launch

## 1. Threat boundaries

Protect accounts, provider-scoped data, booking inventory, bid/evaluation records, audit history and
finance records from unauthorized access or tampering. Assume browser and mobile-client input is
hostile. The platform must not collect payment credentials or imply public authority.

**Payment credentials.** While the sandbox payment adapter is the active provider, no page, form or
endpoint may render, accept, store or log card numbers, expiry dates, CVVs, wallet PINs or one-time
codes. Checkout sends a method name only. Credential entry arrives only with a licensed gateway's
hosted page and its own security review. This rule exists because the interface no longer marks
payments as test payments: a visitor must never be invited to type real credentials into a flow
that does not need them.

## 2. Authentication

Email/password hashed with Argon2id. Browser sessions use opaque, database-backed tokens delivered
in Secure, HttpOnly, SameSite=Lax cookies. Store only a hash of the session token and a hash of the
CSRF token. Rotate sessions at login and privilege change; revoke on logout; enforce idle and absolute
expiry. Add double-submit CSRF protection. No auth tokens in localStorage.

Throttle login with an in-memory limiter for the single-instance MVP; replace with a shared store
before horizontal scaling. Password reset has no delivery channel yet and is not offered in the
interface until one exists. Seeded accounts and the header-based account switch
(`DEMO_AUTH_ENABLED`) must fail closed in production; where enabled, the interface presents them as
an ordinary "Switch account" list.

The Android app cannot rely on browser cookies and CSRF tokens. Its session mechanism (for example
short-lived access tokens with rotating refresh tokens held in the Android Keystore) is an open
decision and needs its own review before the app ships.

## 3. Roles and authorization

`VISITOR`; `PROVIDER_OWNER/MANAGER/STAFF`; `LISTING_REVIEWER`; `TARIFF_REVIEWER`;
`PROCUREMENT_OFFICER`; `EVALUATOR`; `FINANCE_ANALYST`; `FINANCE_ADMIN`; `PLATFORM_ADMIN`.

Deny by default. Validate provider membership and ownership on every API call. A provider cannot
approve its own listing or tariff. Separate procurement author and evaluator duties. Finance analyst
is read-only; corrections use reversal. Public sees only approved listings and effective internally
approved tariffs.

## 4. Data minimization

Seeded accounts are synthetic. Collect minimal account/contact data. No identity documents, payment
credentials, precise visitor movement history or child data in MVP. Do not persist browser
geolocation. No sensitive values in logs, analytics or seed fixtures.

MVP has no file uploads. Listing images are seeded or remote URLs; do not accept arbitrary file
content. There is no notification feature.

## 5. Security controls

Schema validation, parameterized DB operations, server-side RBAC, secure headers/CSP, TLS outside
local, secret manager, CORS allowlist, rate limits, dependency review and redacted structured logs.
Test IDOR, XSS, CSRF, brute force, mass assignment, session fixation and privilege escalation.
Production needs backup/restore and an incident process.

## 6. Auditability

Append-only audit for role/config changes, listing/tariff review, procurement/evaluation, contract
dues, finance posting/reversal and evaluator conflict declarations. Store actor, action, entity,
entity ID, time, reason, request ID and safe before/after summary. Exclude passwords, tokens, full
bid documents and sensitive personal data. Restrict DB update/delete rights where feasible.
Ledger/audit correction is by compensating/reversal record.

## 7. Privacy and release gate

Before public launch, define lawful basis, jurisdiction, retention, access/deletion requests,
breach handling and vendor processing, and publish the terms and privacy pages linked from the
footer. Do not claim regulatory compliance without assessment. Government involvement, authority,
tariffs and data sharing require explicit agreements and qualified review; until then the
interface makes no such claim and carries the independence statement in the footer and on
`/about`.
