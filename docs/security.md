# Security, Privacy and Access Control

**Status:** v2 target. Sign-in is built in the last phase; production use needs a legal and privacy
review.

## 1. Threat boundaries

Protect accounts, provider-scoped data, inventory, payments and ledger, bids, lost-and-found private
details, complaints and audit history. Treat all browser input as hostile. Never collect real
payment credentials while the sandbox gateway is active. Never imply public authority.

## 2. Identity before and after sign-in

**Until the sign-in phase:** a seeded-account switcher picks one of the synthetic accounts (tourists,
providers of each type, desk staff, admin). The web app sends it as `x-demo-user-id`. This works
only when `DEMO_AUTH_ENABLED=true` and `APP_ENV` is `local` or `staging`; the API refuses to start
with it enabled in production. Every guard and scope check below runs exactly as it will after
sign-in, so authorization is real from day one.

**Sign-in phase:** phone number with a one-time code (email optional). Database-backed opaque
sessions in Secure, HttpOnly, SameSite=Lax cookies; only token hashes stored; rotation on sign-in
and role change; idle and absolute expiry; CSRF protection for cookie-authenticated writes; rate
limits on code requests and verification; codes hashed, single-use, short-lived.

## 3. Roles and scope

| Role | Can |
|---|---|
| `TOURIST` | Own bookings, requests, messages, reviews, saved items, reports, claims |
| `PROVIDER` (member `OWNER` or `STAFF`) | Only their provider's listings, bookings, bids, jobs, earnings. `STAFF` cannot change prices, payout details or members |
| `DESK` | Check-in, lost and found, complaints and alerts in assigned destinations only |
| `ADMIN` | Everything, with audit; cannot edit ledger or audit rows |

Rules:

- Deny by default. Provider scope comes from `provider_members`, desk scope from
  `desk_assignments`, never from request input.
- Another user's record returns `404`, not `403`.
- A provider cannot approve its own listing or revision; only admin approves.
- Bids are sealed: a provider reads only its own bids; the requesting tourist reads all bids on
  their request.
- Lost-and-found private details, private photos and verification answers are visible only to desk
  staff of that destination and admin. Answers are stored hashed.
- Tourist contact details are shown to a provider only for that provider's bookings and accepted
  jobs.

## 4. Uploads

- Images only: JPEG, PNG, WebP; maximum 8 MB; maximum 12 per listing, 30 per portfolio, 4 per
  lost-and-found item or complaint.
- Validate by content, not by extension; re-encode with `sharp`; strip EXIF including location;
  generate sizes; store under random keys.
- Private media (`LOST_FOUND` private, `PROVIDER_DOC`, `JOB_PREVIEW` before settlement) is served
  only through an authorised endpoint; job previews are watermarked.
- Rate-limit uploads per user.

## 5. Payments

All payments go through the payment-provider port. While `SANDBOX` is the adapter the gateway
screen never renders or accepts card numbers, CVV, wallet PINs or one-time codes. Totals and
commission are always computed on the server. Every payment call is idempotent. Enabling a live
adapter is a separate change with its own security review.

## 6. Data minimisation

Synthetic identities only in seeds and tests. Collect name and phone; email optional. No identity
document numbers are stored for lost-and-found handover; desk staff record only "ID checked" and a
note. Browser location is used on the device for "near me" and never stored. Logs exclude personal
data, private details, messages and tokens.

## 7. Controls

Schema validation on every boundary; parameterised queries; server-side role and scope checks;
secure headers and CSP; CORS allowlist; rate limits on search, uploads, bids, messages, claims and
sign-in; message length limits and HTML escaping; structured redacted logs; dependency review.
Test IDOR across providers, desks and tourists, sealed-bid leakage, claim brute force, upload
abuse, mass assignment and privilege escalation.

## 8. Audit

Append-only audit for every privileged transition listed in [workflows.md](workflows.md) section 10,
with actor, action, entity, time, reason, request ID and a safe before and after summary. No
secrets, tokens, answers or private details in audit payloads.

## 9. Release gate

Before real public use: define lawful basis, retention (messages, lost-and-found, complaints),
access and deletion requests, breach handling, and vendor processing; complete a security
assessment; sign provider agreements covering commission and payouts. Do not claim regulatory
compliance without assessment.
