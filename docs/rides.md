# Rides Marketplace: Flow and Setup

## Overview

Ride operators (jet ski, speedboat, banana boat, ATV, buggy, horse, boat trips,
jeep tours) publish ride packages and a profile. Tourists either book a ride
directly or post a request that verified operators bid on. Both paths end in the
same booking, so deposit, ride, completion, and settlement are built once and
shared. Bids are sealed, each bid allows one counter-offer, acceptance requires a
deposit, and the final amount is settled on the actual ride time or distance used.

```
Direct book ─────────────┐
                         ├─► Booking ─► Deposit ─► Ride ─► Completion ─► Settlement ─► Review
Request ─► Bids ─► Accept┘
```

## Current Scope

- Planned as a second service type on the same engine as photographers.
- Pricing models: per ride, per person, per hour, per group.
- Package fields: duration, group size, included time, extra-time price,
  safety gear, age and weight limits.
- Settlement rule: actual time or distance used (photographers settle on
  selected photo count).

---

## 1. Operator Setup

1. **Apply as a Provider** (`PROVIDER` role) with `RIDE` / `BOAT` / `TOUR` service types.
2. **Create the profile:** name, photo, bio, destination and operating spots, and ride types offered.
3. **Upload proof and media:** photos or video of the vehicles or boats, plus
   trade license or permit where required.
4. **Submit for verification:** ID, license or permit, and a safety equipment
   check. Until approved, the operator can build packages but cannot bid or be
   booked.
5. **Create ride packages**, each with:
   - Ride type (jet ski, speedboat, banana boat, ATV, buggy, horse, boat trip,
     jeep tour)
   - Pricing model (per ride, per person, per hour, per group)
   - Duration, included time, and extra-time price
   - Group size and age or weight limits
   - Safety gear included (life jacket, helmet)
   - Location, pickup option, and season
   - Booking mode: Instant Book or Request only
6. **Set availability:** days and time slots, with weather and sea-condition
   pause rules.
7. **Publish.** The profile and packages become searchable.

---

## 2. Tourist Flow

### Path A: Direct Booking

1. Browse or search rides by location, date, ride type, group size, and budget.
2. Open an operator profile: vehicles, packages, safety info, reviews, slots.
3. Choose a package, date, and time slot.
4. Review the price breakdown (base price, included time, extra-time rate) and
   the safety and age requirements.
5. Pay the deposit. The booking is confirmed (Instant Book) or sent for
   operator approval (Request only).

### Path B: Request and Bids

1. **Post a request:** location, date and time window, ride type, group size,
   and budget range.
2. The request is published to verified operators covering that location.
3. Operators submit **sealed bids** (price, duration, included time, pickup).
   The tourist sees all bids, but operators cannot see each other's.
4. The tourist compares bids (price, rating, response time, safety record) and
   either:
   - **Accepts** a bid,
   - **Sends one counter-offer** (the operator accepts or declines), or
   - **Closes** the request.
5. On acceptance, the tourist pays the deposit and the booking is confirmed.
   All other bids close automatically.

---

## 3. Shared Flow After Booking

1. **Pre-ride:** chat with the operator, confirm meeting point and time, receive
   reminder notifications and a weather check.
2. **Ride day:** the operator confirms the tourist at the meeting point and
   verifies age, weight, and safety gear. The booking moves to **In progress**.
3. **Ride:** the operator marks the booking **Ride completed** and records the
   actual time or distance used.
4. **Settlement:** the final amount is calculated on actual usage.
   - Final = package price + (extra time or distance × extra rate)
   - The deposit is deducted and the tourist pays the remainder.
5. **Confirmation:** the tourist confirms completion, and payment is released to
   the operator.
6. **Review:** the tourist rates the operator, and the operator rates the
   tourist (only after a completed booking).

---

## 4. Operator Actions While Working

| Moment | Operator actions |
|---|---|
| New request arrives | View details, then Bid or Skip |
| Bid submitted | Wait (bids are sealed); the bid can be withdrawn before acceptance |
| Counter-offer received | Accept or decline (one round only) |
| Booking confirmed | Check details, chat with the tourist |
| Weather turns rough | Pause or reschedule the booking |
| Ride day | Verify safety checks, start the ride |
| After the ride | Mark completed, record actual usage |
| Payment settled | Receive payout, review the tourist |

---

## 5. Booking States

`Requested → Bidding → Accepted → Deposit paid → Confirmed → In progress → Ride completed → Settled → Reviewed`

Side exits:

- **Cancelled:** with a refund tier (free, partial, none) based on days before the date
- **Weather-paused:** rescheduled or refunded when conditions are unsafe
- **Expired:** no bids received, or deposit not paid in time
- **Disputed:** evidence upload and admin resolution

Every screen answers one question: *what state is this booking in, and what can
this user do next?*

---

## 6. Trust and Safety

- Tiered verification: ID, license or permit, safety equipment check, then a
  trial booking, with badges (Verified, Top Rated, Local Expert).
- Mandatory safety gear and age or weight limits shown before payment.
- Weather and sea-condition badge, with automatic pause rules.
- Clear cancellation tiers and a dispute flow with evidence upload.
- Deposit status always visible: held, released, or refunded.

## 7. Communication and Payments

- In-app inbox and notifications tied to the booking or request (in-app only per `AGENTS.md`).
- Sandbox payment methods today (`SANDBOX` adapter): bKash, Nagad, and cards (no real credentials or money movement).

## 8. Roadmap

1. **Now:** ride packages, direct booking, request and sealed bids, counter-offer,
   deposit, settlement on actual usage.
2. **Next:** weather pause and reschedule, safety checklist on ride day,
   reviews tied to completed bookings, bid ranking by value.
3. **Later:** ride combos and route bundles (jet ski + banana boat, Marine
   Drive + Himchari + Inani), median-bid price guidance, group split payments.