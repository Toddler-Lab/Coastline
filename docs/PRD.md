# Product Requirements Document (PRD)

**Status:** v2 baseline (multi-destination service platform) · **Audience:** product, design,
engineering, reviewers · **Last revised:** 2026-11-17

## 1. Product summary

Coastline is a digital tourism service platform for Bangladesh. It brings every service a tourist
needs at a destination into one place: stays, food, sunbeds, local rides, boats, tours, entry
tickets, photographers, nearby facilities, safety information, lost and found and complaints.
Destinations (Cox's Bazar, Sylhet, Rangamati and more) and their spots are created by the operator
from the admin console, so the platform grows without code changes.

Coastline is run as an independent business. It earns a commission on bookings made through the
platform. It has no government involvement or endorsement, and provider prices are not official
tariffs.

## 2. Goals and non-goals

### Goals

1. A visitor can choose a destination and spot and see every service available there.
2. A visitor can book any bookable service through one checkout and hold one kind of ticket.
3. Service providers run their own business through a provider portal: listings, prices,
   availability, bookings, bids, earnings.
4. Visitors hire photographers the way it works on the beach today: per photo or per package,
   directly or by posting a request and comparing bids.
5. Visitors get help on the spot: emergency information, lost and found, reporting a problem.
6. The operator manages destinations, approvals, commission, payouts, help operations and audit.
7. Every payment is recorded with its commission split so the business model is visible, while
   no real money moves until a live gateway is approved.

### Non-goals (this release)

Real money movement (live gateway, real payouts); sign-in (built last, see section 7); SMS or email
notifications (in-app inbox only); native Android app; dynamic pricing; government integrations;
emergency dispatch; real-time GPS tracking of rides.

## 3. Personas and roles

| Persona | Role |
|---|---|
| Tourist | `TOURIST` |
| Provider owner or staff (hotel, restaurant, sunbed operator, transport, boat, tour, guide, photographer, ticketed site, shop) | `PROVIDER` (`ProviderMemberRole`: `OWNER`, `STAFF`) |
| Spot desk staff | `DESK` |
| Platform operator | `ADMIN` |

Permissions are in [security.md](security.md).

## 4. Service catalogue

Each listing has a type and a booking mode. The UI and the booking engine follow the mode.

| Group | Listing type | Booking mode | Notes |
|---|---|---|---|
| Stay | `STAY` | `NIGHTS` | Hotels, resorts, cottages, homestays. Existing hotel engine |
| Food | `FOOD` | `TIME_SLOT` (table), `ORDER` (to a sunbed) | Existing dining engine |
| Beach | `SUNBED` | `TIME_SLOT` | Existing sunbed engine and map picker |
| Move | `RIDE` | `DEPARTURE` or `TIME_SLOT` | Tomtom, CNG, jeep, car with driver, bicycle or scooter hire |
| Water | `BOAT` | `DEPARTURE` or `TIME_SLOT` | Lake boats, speedboats, swamp-forest boats, launches |
| Do | `TOUR`, `ACTIVITY` | `DEPARTURE` or `TIME_SLOT` | Guided tours, trekking, parasailing, kayaking |
| Guide | `GUIDE` | `QUOTE` or `TIME_SLOT` | Private local guides |
| Enter | `TICKET` | `ENTRY` | Parks, eco-parks, museums, heritage sites |
| Photo | `PHOTOGRAPHER` | `QUOTE` or package (`TIME_SLOT`) | Per photo, per package, per hour |
| Shop | `SHOP` | `INFO` | Markets and local crafts |
| Facility | `FACILITY` | `INFO` | ATM, pharmacy, hospital, washroom, prayer room, parking, police box, lifeguard post, first aid |

## 5. Functional requirements

- **FR-01 Destinations and spots.** The operator creates, edits, orders, hides and shows destinations
  and spots: name in English and Bangla, photos, accent, coordinates, content sections (about,
  best time, how to get there, rules, safety), entry information, help contacts. Hidden items leave
  public pages; past bookings stay readable.
- **FR-02 Explore and search.** Explore shows destinations, service tiles for the selected
  destination (only types with active listings), spots, popular listings and alerts. Search covers
  destinations, spots, listings and providers with type and destination filters.
- **FR-03 Spot hub.** Shows Book, Nearby, Know and Help sections built from data.
- **FR-04 Listings.** Providers create listings of their approved service types. New listings and
  material changes (price, capacity, photos, description) need operator approval before going
  public. Listings have photos, options, prices with units, capacity, schedule, cancellation rule.
- **FR-05 Booking.** Every bookable mode creates a booking through one shared flow: draft, checkout,
  payment, confirmed ticket. Inventory is protected against overselling. Prices, names and
  cancellation rules are snapshotted.
- **FR-06 Checkout and payments.** One checkout for all services. Payments go through the payment
  provider port; the sandbox gateway approves or declines without moving money and never collects
  credentials. Every charge, refund and commission is recorded.
- **FR-07 Commission and payouts.** The operator sets a commission rate per service type (with an
  optional per-provider override). Each payment records gross, commission and provider net. Payouts
  to providers are recorded in batches and marked paid by the operator.
- **FR-08 Tickets and trips.** Each confirmed booking has a signed QR ticket. Trips shows upcoming,
  past, requests and reports. Tickets open offline.
- **FR-09 Check-in.** Providers and desk staff check in tickets by scan or reference.
- **FR-10 Cancellation and refunds.** Each listing has a cancellation rule (free until N hours
  before, then a percentage). Refunds reverse the payment and the commission.
- **FR-11 Photographers.** Photographers publish packages (per photo, per package, per hour, with
  included count, extra-photo price, delivery time and format) and a portfolio. Tourists book a
  package directly or post a request that verified photographers bid on. Bids are sealed; one
  counter-offer per bid; acceptance takes a deposit; final amount is settled on the delivered or
  selected photo count. The same request-and-bid flow serves private guides and charters.
- **FR-12 Inbox.** Conversations between a tourist and a provider, tied to a booking or request,
  plus system updates. In-app only.
- **FR-13 Lost and found.** Anyone reports a lost item; desk staff and providers log found items;
  the system suggests matches; claims need verification answers and an in-person handover recorded
  by desk staff; items expire after an operator-set holding period.
- **FR-14 Complaints.** Tourists report problems with category, spot, optional booking and photos;
  desk staff and the operator handle them through statuses to resolution.
- **FR-15 Alerts.** Desk staff and the operator post spot or destination alerts (weather, sea,
  closure, event) with severity and a validity window.
- **FR-16 Emergency information.** Operator-entered public numbers and nearest facilities per
  destination. No dispatch.
- **FR-17 Reviews.** Only after a completed booking; one per booking; provider may reply once.
- **FR-18 Saved.** Tourists save listings, spots and providers.
- **FR-19 Provider onboarding.** Applicants submit business details, service types, destination and
  documents; the operator approves, requests changes or rejects.
- **FR-20 Audit.** Every privileged transition appends an audit event.
- **FR-21 Language and theme.** Bangla and English; light, dark and system theme.
- **FR-22 Sign-in (last phase).** Phone number with one-time code, email optional, replacing the
  seeded-account switcher.

## 6. Non-functional requirements

TypeScript end to end; PostgreSQL constraints and transactions for inventory and money; server-side
authorization on every call; mobile-first responsive UI meeting WCAG 2.2 AA; integer minor units
and ISO currency for money; UTC storage and Asia/Dhaka presentation; uploads validated, resized and
stored outside the database; no secrets, credentials or real personal data in logs, fixtures or
seeds.

## 7. Decisions and assumptions

- **Sign-in comes last.** Until then a seeded-account switcher selects tourist, provider, desk and
  admin accounts; it is disabled in production.
- **Payments are sandbox.** The sandbox gateway behaves like a live provider and every payment is
  recorded. Enabling a live gateway is a separate, reviewed decision.
- **Commission** defaults to 10 % for every service type and is configurable.
- **Uploads** are images only (JPEG, PNG, WebP), size-limited, stored in object storage (local disk
  in development).
- **Lost and found** holds items for 30 days by default (operator setting).
- **Photographer deposit** defaults to 20 % of the accepted bid's estimated total.
- Weather data is optional and depends on a provider being configured; alerts are entered by staff.

## 8. Acceptance summary

See [implementation-plan.md](implementation-plan.md) for phase gates and
[delivery-plan.md](delivery-plan.md) for release acceptance. Critical outcomes: no inventory
oversell; immutable booking snapshots; provider isolation; every payment recorded with a balanced
commission split; photographer bidding is sealed and settles on actual count; lost-and-found claims
need verification and a recorded handover; complete audit for privileged transitions.
