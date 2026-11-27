# Photographer Marketplace: Flow and Setup

## Overview

Photographers publish packages and a portfolio. Tourists either book a package
directly or post a request that verified photographers bid on. Both paths end in
the same booking, so deposit, shoot, delivery, and settlement are built once and
shared. Bids are sealed, each bid allows one counter-offer, acceptance requires a
deposit, and the final amount is settled on the delivered or selected photo count.

```
Direct book ─────────────┐
                         ├─► Booking ─► Deposit ─► Shoot ─► Delivery ─► Settlement ─► Review
Request ─► Bids ─► Accept┘
```

## Current Scope

- Implemented for photographers only.
- Pricing models: per photo, per package, per hour.
- Package fields: included photo count, extra-photo price, delivery time, format.
- Planned: the same request-and-bid flow for private guides and boat charters,
  using a per-service-type configuration (extra fields and settlement rule).

---

## 1. Photographer Setup

1. **Sign up** and choose the Photographer role.
2. **Create the profile:** name, photo, bio, languages, base locations, and
   shooting styles (couple, family, solo, drone).
3. **Upload the portfolio:** a minimum number of photos, grouped by location or style.
4. **Submit for verification:** ID check, then portfolio check. Until approved,
   the photographer can build packages but cannot bid or be booked.
5. **Create packages**, each with:
   - Pricing model (per photo, per package, per hour)
   - Included photo count and extra-photo price
   - Delivery time and format (edited JPEG, RAW)
   - Location and duration
   - Booking mode: Instant Book or Request only
6. **Set availability:** days and time slots, with golden-hour slots highlighted.
7. **Publish.** The profile and packages become searchable.

---

## 2. Tourist Flow

### Path A: Direct Booking

1. Browse or search photographers by location, date, style, and budget.
2. Open a profile: portfolio, packages, reviews, available slots.
3. Choose a package, date, and time slot.
4. Review the price breakdown (base price, included count, extra-photo rate).
5. Pay the deposit. The booking is confirmed (Instant Book) or sent for
   photographer approval (Request only).

### Path B: Request and Bids

1. **Post a request:** location, date and time window, group size, style, and
   budget range.
2. The request is published to verified photographers covering that location.
3. Photographers submit **sealed bids** (price, included count, delivery time).
   The tourist sees all bids, but photographers cannot see each other's.
4. The tourist compares bids (price, rating, response time, portfolio) and either:
   - **Accepts** a bid,
   - **Sends one counter-offer** (the photographer accepts or declines), or
   - **Closes** the request.
5. On acceptance, the tourist pays the deposit and the booking is confirmed.
   All other bids close automatically.

---

## 3. Shared Flow After Booking

1. **Pre-shoot:** chat with the photographer, confirm meeting point and time,
   receive reminder notifications.
2. **Shoot day:** the photographer marks the booking **Shoot completed**.
3. **Delivery:** the photographer uploads a watermarked preview gallery within
   the promised delivery time.
4. **Selection:** the tourist picks favorites from the gallery.
5. **Settlement:** the final amount is calculated on the selected (or delivered) count.
   - Final = package price + (extra photos × extra-photo price)
   - The deposit is deducted and the tourist pays the remainder.
6. **Final delivery:** watermarks are removed and full-resolution files unlock
   for download.
7. **Review:** the tourist rates the photographer, and the photographer rates
   the tourist (only after a completed booking).

---

## 4. Photographer Actions While Working

| Moment | Photographer actions |
|---|---|
| New request arrives | View details, then Bid or Skip |
| Bid submitted | Wait (bids are sealed); the bid can be withdrawn before acceptance |
| Counter-offer received | Accept or decline (one round only) |
| Booking confirmed | Check booking details, chat with the tourist |
| After the shoot | Mark completed, upload previews |
| Tourist selects photos | Upload final edits, confirm delivery |
| Payment settled | Receive payout, review the tourist |

---

## 5. Booking States

`Requested → Bidding → Accepted → Deposit paid → Confirmed → Shoot completed → Preview delivered → Selection made → Settled → Reviewed`

Side exits:

- **Cancelled:** with a refund tier (free, partial, none) based on days before the date
- **Expired:** no bids received, or deposit not paid in time
- **Disputed:** evidence upload and admin resolution

Every screen answers one question: *what state is this booking in, and what can
this user do next?*

---

## 6. Trust and Safety

- Tiered verification: ID check, portfolio check, then a trial booking, with
  badges (Verified, Top Rated, Local Expert).
- Clear cancellation tiers and a dispute flow with evidence upload.
- Deposit status always visible: held, released, or refunded.

## 7. Communication and Payments

- In-app chat tied to the booking, plus WhatsApp and SMS notifications.
- Local payment methods: bKash, Nagad, and cards.

## 8. Roadmap

1. **Now:** photographer flow (packages, requests, sealed bids, counter-offer,
   deposit, settlement on selected count).
2. **Next:** watermarked preview gallery and selection, reviews tied to
   completed bookings, cancellation tiers, bid ranking by value (price, rating,
   response time).
3. **Later:** service-type configuration for guides and charters, bundles
   (photographer + boat + guide in one request), median-bid price guidance,
   group split payments.