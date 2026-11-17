# Domain Workflows

**Applies to:** places, providers, listings, bookings, photographers, payments, help operations.
Payments go through the payment-provider port; the sandbox gateway moves no money but every payment,
commission and payout is recorded as described here.

## 1. Places

- The operator creates a destination, then spots inside it. A destination or spot appears publicly
  when it is active and, for service tiles, when at least one active listing of that type exists.
- Hiding a destination hides its spots and listings from public reads. Bookings, tickets and
  reports that reference them stay readable by their owners, providers, desk and admin.
- Alerts are active while now is inside `[starts_at, ends_at)`. The highest severity active alert
  for a destination shows on Explore and the destination page; spot alerts show on the spot hub.

## 2. Provider onboarding and listing approval

```text
Provider:  APPLIED -> APPROVED | CHANGES_REQUESTED -> APPLIED | REJECTED
           APPROVED -> SUSPENDED -> APPROVED
Listing:   DRAFT -> PENDING_REVIEW -> ACTIVE | CHANGES_REQUESTED -> PENDING_REVIEW | REJECTED
           ACTIVE -> SUSPENDED -> ACTIVE ;  any -> ARCHIVED
Revision:  PENDING -> APPROVED (applied to the listing) | REJECTED
```

- A provider may create listings only of service types approved for it.
- Material changes to an active listing (price, capacity, photos, title, description,
  cancellation policy) create a revision; the live listing is unchanged until the revision is
  approved. Availability, blocked dates and stock changes apply immediately.
- A suspended provider's listings are hidden; existing bookings stand and can be cancelled by the
  operator with refunds.
- Every decision records the reviewer and a reason in the audit log.

## 3. Generic booking (`TIME_SLOT`, `DEPARTURE`, `ENTRY`, packages)

```text
PENDING_PAYMENT -> CONFIRMED -> CHECKED_IN -> COMPLETED
PENDING_PAYMENT -> EXPIRED            (hold elapsed, inventory released)
CONFIRMED -> CANCELLED                (tourist before deadline, provider or admin with reason)
CONFIRMED -> NO_SHOW                  (provider, after the start plus grace)
```

1. **Draft.** The API validates the listing, offering, slot, quantity and limits, prices every line
   from the database, applies the commission rule, and in one transaction locks the slot row
   `FOR UPDATE`, checks `booked + qty <= capacity`, increments `booked`, and creates the booking in
   `PENDING_PAYMENT` with a 10-minute hold. The client never sends a price.
2. **Pay.** Checkout creates a payment through the port (section 6). Success confirms the booking
   exactly once; failure leaves it pending until it expires.
3. **Expire.** A worker expires holds in small batches and releases inventory exactly once.
4. **Cancel.** The snapshotted policy decides the refund: full refund before `freeUntilHours`,
   `lateRefundPercent` after it, nothing after the start. Inventory is released once.
5. **Complete.** Check-in, or the end time passing for no-check-in services, completes the booking
   and opens the review window (14 days).

Last-unit races produce exactly one success; the loser gets `409` with fresh availability.

## 4. Existing engines

These keep their current rules and gain the shared checkout, commission and ledger.

- **Sunbeds.** Hourly slots per bed, 1-4 hours, up to 7 days ahead, inside beach-point hours; the
  unique active slot row decides races. Cancellation free until the start.
- **Stays.** One `hotel_room_nights` row per room and night. Tourist cancellation until 60 minutes
  before the snapshotted check-in time; admin later. Cancelling releases nights once and refunds.
- **Tables.** 1-3 whole hours, up to 7 days ahead, `party_size <= seats`, optional deposit;
  tourist cancellation until 60 minutes before the start; check-in from 30 minutes before.
- **Food to a sunbed.** Only to the tourist's own active sunbed booking at the same beach point,
  from an open venue that delivers. `PLACED -> PREPARING -> READY -> DELIVERED`, cancel only from
  `PLACED`. Each status change is a conditional update; illegal moves return `409`.

In v2 kitchen, reservation and check-in actions move from admin-only to the venue's provider
members (and admin).

## 5. Photographers (and other quotes)

Photographers at Bangladeshi spots usually charge per photo (for example Tk 5 per photo) or per
package (for example 20 photos for Tk 100), take the photos on the spot, and the tourist keeps the
photos they want. The flow models that.

### 5.1 Direct package booking

The photographer publishes offerings with `price_unit` `PER_PHOTO`, `PER_PACKAGE` or `PER_HOUR`,
`included_count`, `extra_unit_price_minor`, delivery time and format. The tourist picks a package,
date and time (a `TIME_SLOT` offering), pays the deposit, and a job is created.

### 5.2 Request and bids

```text
Request: OPEN -> ACCEPTED | EXPIRED (no acceptance by bids_close_at + 24 h) | CANCELLED
Bid:     ACTIVE -> COUNTERED -> ACTIVE (revised) | DECLINED
         ACTIVE -> ACCEPTED | WITHDRAWN | CLOSED (another bid accepted, or request ended)
```

1. The tourist posts a request: spot, time window, party size, type, expected photo count,
   optional budget, bidding window (30 minutes to 24 hours, ending before the shoot).
2. Approved photographers in that destination see open requests and bid: unit, unit price,
   included count, extra price, delivery time, message. The API computes `estimated_total` for the
   requested count. One active bid per photographer per request; a photographer may revise their
   own bid while the window is open.
3. Bids are sealed: a photographer never sees other bids or counts.
4. The tourist may counter once per bid with a lower unit or total price. The photographer accepts
   (the bid updates), declines, or revises once.
5. The tourist accepts one bid (allowed until the shoot starts). In one transaction: bid `ACCEPTED`,
   all other bids `CLOSED`, request `ACCEPTED`, booking created in `PENDING_PAYMENT` with
   `deposit = deposit_percent x estimated_total` (setting, default 20 %), and a job linked to it.
   Bidders are notified.

### 5.3 Job and settlement

```text
Job: SCHEDULED -> IN_PROGRESS -> DELIVERED -> SETTLED
     DELIVERED -> DISPUTED -> SETTLED (operator decides)
     SCHEDULED -> CANCELLED
```

1. On the day the provider checks the tourist in (ticket scan) and the job is `IN_PROGRESS`.
2. The photographer delivers: uploads watermarked previews or states a count and a delivery link.
3. Final amount:
   - `PER_PHOTO`: `selected_count x unit_price`, where the tourist selects the photos they keep
     (at least the minimum the bid stated, if any).
   - `PER_PACKAGE`: package price, plus `(selected_count - included_count) x extra_unit_price` when
     the tourist keeps more than included.
   - `PER_HOUR`: hours on the booking, plus agreed extra time if both confirm.
4. The tourist confirms the selection and pays the balance (`final_total - deposit`). If the final
   total is below the deposit, the difference is refunded. The job becomes `SETTLED`, unwatermarked
   delivery is released, and the booking completes.
5. If the tourist does not respond within 48 hours of delivery, the job settles on the included
   count (package) or the delivered count (per photo).
6. Either side may open a dispute before settlement; the operator decides the final count and the
   result is recorded with a reason.

Cancellation: tourist before 12 hours: full deposit refund; later: deposit kept by the provider
(minus commission). Provider cancellation always refunds in full and is recorded against the
provider.

The same flow serves private guides (`PER_HOUR`), boat charters and private rides
(`PER_BOOKING`).

## 6. Payments, commission and ledger

### 6.1 Payment-provider port

```text
createPayment(intent) -> { status: SUCCEEDED | FAILED | PENDING, externalRef }
refund(payment, amount) -> { status, externalRef }
```

The only adapter today is `SANDBOX`. Its gateway screen shows the method and amount with Approve and
Decline and never collects card numbers, PINs or one-time codes. A live adapter (for example a bKash
or SSLCommerz integration) is a separate, reviewed change. Every payment-creating call needs an
`Idempotency-Key`; a retry returns the first result.

### 6.2 Commission

The applicable `commission_rules` row (provider override, else listing type, else the default
setting) is snapshotted on the booking as `commission_bps`. For a charge of `G`:
`commission = round_half_up(G x bps / 10000)`, `provider_net = G - commission`. A refund reverses
commission in proportion to the refunded amount.

### 6.3 Ledger postings

| Event | Debit | Credit |
|---|---|---|
| Charge `G` | `GATEWAY_CLEARING` G | `PROVIDER_PAYABLE` (provider) G - C; `COMMISSION_REVENUE` C |
| Refund `R` with commission share `c` | `PROVIDER_PAYABLE` R - c; `COMMISSION_REVENUE` c | `GATEWAY_CLEARING` R |
| Payout `P` marked paid | `PROVIDER_PAYABLE` (provider) P | `PAYOUTS_CLEARING` P |
| Pay at venue (provider collects `G`) | `PROVIDER_PAYABLE` (provider) C | `COMMISSION_REVENUE` C (commission owed by the provider, netted from the next payout) |

Every entry balances per currency, references its source, and is never edited; mistakes are
reversed with a new entry.

### 6.4 Payouts

The operator creates a payout draft per provider for a period: all succeeded, non-refunded payments
not yet in a payout, net of commissions owed from pay-at-venue bookings. Approve, then mark paid
with a reference. Paid payouts cannot change.

## 7. Lost and found

```text
LOST item:  OPEN -> MATCHED -> RETURNED | CLOSED (owner closes) | EXPIRED
FOUND item: OPEN -> MATCHED -> CLAIM_PENDING -> RETURNED
            OPEN -> EXPIRED -> DISPOSED (after holding period, desk records how)
Claim:      SUBMITTED -> VERIFIED -> HANDED_OVER
            SUBMITTED -> REJECTED | CANCELLED
```

1. **Report lost.** Any tourist: category, spot, time window, title, public description, private
   details, contact. Gets a reference; appears in Trips, Reports.
2. **Log found.** Desk staff or a provider member at that destination: category, spot, time, public
   description, private details, storage location, two or three verification questions with
   answers, optional private photos. A tourist can report "I found something", which creates a
   pending found item asking them to hand it to the named desk; it becomes `OPEN` when desk staff
   confirm receipt.
3. **Match.** On every new item the API scores open items of the other kind in the same destination:
   same category, overlapping time window (with 24 h slack), same or nearby spot, keyword overlap.
   Scores above a threshold create `SUGGESTED` matches and notify the owner and the desk. Desk staff
   confirm or dismiss.
4. **Claim.** The tourist answers the verification questions. Answers are normalised and compared
   to the hashes; at least two correct answers pass. Three failed attempts lock claims on that item
   for that tourist. A passed claim asks the tourist to pick a pickup time at the desk.
5. **Handover.** Desk staff check the claimant's photo ID in person, then record the handover with
   a note. Found and lost items become `RETURNED`; other open claims are rejected.
6. **Expiry.** After the holding period (default 30 days) unclaimed found items become `EXPIRED`,
   and the desk records disposal (donated, destroyed, returned to finder). Lost reports expire after
   the same period unless renewed.
7. **Privacy.** Public reads expose category, spot, date and the public description only. Private
   details, private photos and answers are visible to desk staff and admin only.

## 8. Complaints

```text
OPEN -> ACKNOWLEDGED -> IN_PROGRESS -> RESOLVED -> CLOSED
any open state -> ESCALATED (to admin) -> IN_PROGRESS
```

Desk staff of the destination acknowledge within the service target (operator setting, default 2
hours during desk hours). Notes may be internal or visible to the tourist. A complaint linked to a
booking may lead to a refund through the normal refund command. The tourist can reopen a resolved
complaint once within 7 days.

## 9. Reviews

Allowed for 14 days after a booking completes; one per booking; rating 1-5 and text. Providers reply
once. The operator can hide a review with a reason. Listing and provider ratings are recalculated
in the same transaction.

## 10. Audit

Append an audit event for: destination, spot, alert and emergency-contact changes; provider and
listing decisions; revisions applied; booking cancellation by provider or admin; check-in; bid
acceptance; job settlement and disputes; refunds; payout approval and payment; lost-and-found
logging, claims, handover and disposal; complaint state changes; role and settings changes.
Store actor, action, entity, entity ID, time, reason, request ID and a safe before and after summary.
