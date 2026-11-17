/**
 * Shared transport types for the Coastline API.
 *
 * Dependency-free so the NestJS API and the Next.js client can both import it.
 * Validation DTOs live in the API; only stable values live here.
 */

export const ROLES = ['TOURIST', 'PROVIDER', 'DESK', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const SUNBED_STATUSES = ['AVAILABLE', 'OUT_OF_SERVICE', 'RETIRED'] as const;
export type SunbedStatus = (typeof SUNBED_STATUSES)[number];

export const ORDER_STATUSES = ['CONFIRMED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_ITEM_STATUSES = ['RESERVED', 'CHECKED_IN', 'CANCELLED'] as const;
export type OrderItemStatus = (typeof ORDER_ITEM_STATUSES)[number];

/** Temporal phase, derived from the item window and the current time. */
export const ORDER_PHASES = ['UPCOMING', 'ACTIVE', 'PAST', 'CANCELLED'] as const;
export type OrderPhase = (typeof ORDER_PHASES)[number];

export const MAX_BEDS_PER_ORDER = 6;
export const MAX_HOURS_PER_ITEM = 4;
export const MAX_ADVANCE_DAYS = 7;
export const CANCEL_CUTOFF_MINUTES = 60;
export const MIN_HOUR = 0;
export const MAX_HOUR = 24;

/** Global error body: `{ "error": { code, message, details, requestId } }`. */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  /** HTTP 422: the payment provider declined or failed the charge; nothing was booked. */
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details: unknown;
    requestId: string;
  };
}

/** Success envelope. Errors use {@link ApiErrorBody}. */
export interface ApiEnvelope<T> {
  data: T;
}

export interface MetaEnvelope<T, M> {
  data: T;
  meta: M;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  /** Providers this account belongs to (PROVIDER role). Empty for others. */
  providers?: ProviderMembershipDto[];
  /** Destination slugs this account staffs a desk in (DESK role). */
  deskDestinations?: string[];
}

export interface BeachPointSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  openHour: number;
  closeHour: number;
  defaultHourlyPriceMinor: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  /** Beds bookable in the reference slot (next slot today, first slot otherwise). */
  freeBeds: number;
  /** Non-retired beds at this point. */
  totalBeds: number;
  /** Label of the slot the free count refers to, e.g. "10:00". */
  referenceSlotLabel: string;
  /** Hero photo, an https URL; null until a verified, licensed photo is set. */
  imageUrl: string | null;
  /** Alt text describing the photo; null when there is no photo. */
  imageAlt: string | null;
  /** Attribution the photo's licence requires; null when none is required. */
  imageCredit: string | null;
  /** Destination and spot this sunbed row belongs to. */
  destinationSlug: string;
  spotSlug: string;
}

export interface SlotDto {
  /** UTC instant of the slot start, ISO 8601. */
  startsAt: string;
  hour: number;
  /** Dhaka wall-clock label, e.g. "09:00". */
  label: string;
}

export interface SunbedAvailability {
  id: string;
  code: string;
  seq: number;
  hourlyPriceMinor: number;
  currency: string;
  status: SunbedStatus;
  bookedSlots: string[];
  /** Slots held by the signed-in tourist, for "your booking" highlighting. */
  mineSlots: string[];
  freeSlots: number;
}

export interface BeachPointDetail extends BeachPointSummary {
  /** Dhaka date key the grid refers to (YYYY-MM-DD). */
  date: string;
  slots: SlotDto[];
  sunbeds: SunbedAvailability[];
}

export interface OrderItemDto {
  id: string;
  sunbedId: string;
  sunbedCode: string;
  beachPointCode: string;
  beachPointName: string;
  startAt: string;
  endAt: string;
  unitPriceMinor: number;
  totalMinor: number;
  status: OrderItemStatus;
  phase: OrderPhase;
  checkedInAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Payments                                                                   */
/* -------------------------------------------------------------------------- */

/** Methods checkout may offer. `GET /payments/methods` returns them with labels. */
export const PAYMENT_METHODS = ['BKASH', 'NAGAD', 'CARD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Value accepted on create requests. `'MOCK'` and an absent method are the
 * legacy forms (stored with `method: null`); they are removed in WP-23.
 */
export type PaymentMethodInput = PaymentMethod | 'MOCK';

/** One entry of `GET /payments/methods`. A method name only; never a credential. */
export interface PaymentMethodDto {
  code: PaymentMethod;
  label: string;
}

export const PAYMENT_STATUSES = ['SUCCEEDED', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Message of the `PAYMENT_FAILED` (HTTP 422) error. */
export const PAYMENT_FAILED_MESSAGE = 'Payment was not completed. You have not been charged.';

/**
 * Optional request header on `POST /orders`, `POST /hotels/bookings`,
 * `POST /dining/reservations` and `POST /dining/food-orders`:
 * 8-128 characters of `[A-Za-z0-9_-]`, unique per attempt.
 */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
/** Response header set to `true` when a stored response is replayed. */
export const IDEMPOTENT_REPLAYED_HEADER = 'Idempotent-Replayed';

export interface PaymentDto {
  id: string;
  type: 'CHARGE' | 'REFUND';
  /** Server-chosen adapter, e.g. `SANDBOX`. A data field, never a label. */
  provider: string;
  /** Checkout method; null for records without one. */
  method: PaymentMethod | null;
  status: PaymentStatus;
  amountMinor: number;
  currency: string;
  externalRef: string | null;
  createdAt: string;
}

export interface TicketDto {
  /** Value to render as a QR code. */
  payload: string;
  /** Short human-readable form for manual check-in. */
  code: string;
}

export interface OrderDto {
  id: string;
  publicRef: string;
  status: OrderStatus;
  subtotalMinor: number;
  totalMinor: number;
  currency: string;
  placedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItemDto[];
  hotelBookings?: HotelBookingDto[];
  payments: PaymentDto[];
  ticket: TicketDto | null;
  canCancel: boolean;
}

export interface AdminOrderDto extends OrderDto {
  tourist: { id: string; name: string; email: string | null };
}

export interface OrderListDto {
  orders: OrderDto[];
}

export interface AdminOrderListDto {
  orders: AdminOrderDto[];
  date: string;
}

export interface CreateOrderItemRequest {
  sunbedId: string;
  /** ISO instant, must be on the hour. */
  startsAt: string;
  hours: number;
}

export interface CreateOrderRequest {
  items: CreateOrderItemRequest[];
  /** Checkout method. `'MOCK'` or absent is the legacy form (stored as null). */
  paymentMethod?: PaymentMethodInput;
}

/**
 * `details` of the 409 returned by `POST /orders` when a chosen bed is taken
 * (lost race, already booked, or out of service). Names every lost bed so the
 * client can keep the rest of the selection.
 */
export interface SunbedConflictDetails {
  sunbedIds: string[];
  sunbedCodes: string[];
  /** Per-bed taken hours, when the conflict is about booked hours. */
  conflicts?: Array<{ sunbedCode: string; slotStarts: string[] }>;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface CheckInRequest {
  /** Omit to check in every reserved bed in the order. */
  itemIds?: string[];
}

export interface CreateBeachPointRequest {
  code: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  openHour: number;
  closeHour: number;
  defaultHourlyPriceMinor: number;
  sortOrder?: number;
}

export interface UpdateBeachPointRequest {
  name?: string;
  description?: string | null;
  latitude?: number;
  longitude?: number;
  openHour?: number;
  closeHour?: number;
  defaultHourlyPriceMinor?: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateSunbedsRequest {
  count: number;
  hourlyPriceMinor?: number;
  note?: string;
}

export interface UpdateSunbedRequest {
  hourlyPriceMinor?: number;
  status?: SunbedStatus;
  note?: string | null;
}

export interface AdminOverviewDto {
  date: string;
  totalBeds: number;
  availableBeds: number;
  outOfServiceBeds: number;
  bedsOnLoan: number;
  bookedSlots: number;
  capacitySlots: number;
  revenueMinor: number;
  currency: string;
  points: BeachPointSummary[];
}

export interface AuditEventDto {
  id: string;
  actor: { id: string; name: string } | null;
  action: string;
  entityType: string;
  entityId: string;
  details: unknown;
  createdAt: string;
}

export interface AdminOrderQuery {
  date?: string;
  pointCode?: string;
  status?: OrderStatus;
  /** Exact booking reference, used by the check-in desk. */
  ref?: string;
}

export interface ValidateTicketRequest {
  /** QR payload: `COASTLINE:<publicRef>:<signature>`. */
  payload: string;
}

export interface AvailabilityQuery {
  date?: string;
}

export const HOTEL_ZONES = [
  'KOLATOLI',
  'SUGANDHA',
  'LABONI',
  'HIMCHARI',
  'PECHARDWIP',
  'INANI',
] as const;
export type HotelZone = (typeof HOTEL_ZONES)[number];

export const HOTEL_ROOM_STATUSES = ['AVAILABLE', 'MAINTENANCE', 'RETIRED'] as const;
export type HotelRoomStatus = (typeof HOTEL_ROOM_STATUSES)[number];

export interface RoomTypeDto {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  description: string | null;
  maxGuests: number;
  bedConfig: string;
  basePriceMinor: number;
  currency: string;
  amenities: string[];
  images: string[];
  sortOrder: number;
  availableRooms: number;
  sampleRoomNumber?: string;
}

export interface HotelSummaryDto {
  id: string;
  slug: string;
  name: string;
  banglaName: string | null;
  zone: HotelZone;
  address: string;
  latitude: number;
  longitude: number;
  starRating: number;
  featuredImage: string;
  description: string;
  phone: string;
  email: string | null;
  nearestBeachCode: string;
  distanceMeters: number;
  /** Destination and, when the hotel sits at a spot, its spot. */
  destinationSlug: string;
  spotSlug: string | null;
  /** Free-text neighbourhood. */
  area: string | null;
  isFeatured: boolean;
  minPriceMinor: number;
  totalRooms: number;
  availableRoomsCount: number;
}

export interface HotelDetailDto extends HotelSummaryDto {
  galleryImages: string[];
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  roomTypes: RoomTypeDto[];
}

export interface HotelBookingDto {
  id: string;
  orderId: string;
  hotelId: string;
  hotelName: string;
  hotelSlug: string;
  roomTypeId: string;
  roomTypeName: string;
  roomId: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  /** Dhaka wall-clock check-in time snapshotted from the hotel, "HH:mm". */
  checkInTime: string;
  nights: number;
  guestsCount: number;
  nightlyPriceMinor: number;
  totalMinor: number;
  currency: string;
  status: OrderItemStatus;
  checkedInAt: string | null;
}

export interface CreateHotelBookingItem {
  hotelId: string;
  roomTypeId: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount?: number;
}

/** Body of `POST /hotels/bookings`. The booking fields are sent flat, not nested. */
export interface CreateHotelOrderRequest extends CreateHotelBookingItem {
  touristName?: string;
  touristEmail?: string;
  touristPhone?: string;
  /** Checkout method. `'MOCK'` or absent is the legacy form (stored as null). */
  paymentMethod?: PaymentMethodInput;
}

export interface HotelAvailabilityQuery {
  destination?: string;
  spot?: string;
  checkInDate?: string;
  checkOutDate?: string;
  zone?: HotelZone;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number;
}

/** Dhaka is UTC+6 all year; no daylight saving. */
export const DHAKA_OFFSET_MINUTES = 360;

/* -------------------------------------------------------------------------- */
/* Dining                                                                     */
/*                                                                            */
/* Shared sections are frozen by the dining foundation. Each stream owns one  */
/* section below and may extend it; do not edit another stream's section.     */
/* -------------------------------------------------------------------------- */

// ---- Shared dining constants ----------------------------------------------

export const DINING_VENUE_KINDS = ['RESTAURANT', 'SEAFOOD_KITCHEN', 'BEACH_STALL'] as const;
export type DiningVenueKind = (typeof DINING_VENUE_KINDS)[number];

export const RESERVATION_STATUSES = ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const FOOD_ORDER_STATUSES = [
  'PLACED',
  'PREPARING',
  'READY',
  'DELIVERED',
  'CANCELLED',
] as const;
export type FoodOrderStatus = (typeof FOOD_ORDER_STATUSES)[number];

/** Allowed forward moves for kitchen staff. A tourist may cancel only from PLACED. */
export const FOOD_ORDER_TRANSITIONS: Record<FoodOrderStatus, readonly FoodOrderStatus[]> = {
  PLACED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const MAX_RESERVATION_HOURS = 3;
export const MAX_RESERVATION_ADVANCE_DAYS = 7;
export const MAX_FOOD_ORDER_LINES = 12;
export const MAX_FOOD_ITEM_QUANTITY = 10;

export interface DiningPaymentRefs {
  /** Charges and refunds; present when a deposit or charge was taken. */
  payments: PaymentDto[];
}

// ---- Stream A: venue and menu catalogue ------------------------------------

export interface MenuItemDto {
  id: string;
  categoryId: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  priceMinor: number;
  currency: string;
  isAvailable: boolean;
  imageUrl: string | null;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  nameBn: string | null;
  sortOrder: number;
  items: MenuItemDto[];
}

export interface DiningVenueSummary {
  id: string;
  code: string;
  name: string;
  nameBn: string | null;
  kind: DiningVenueKind;
  description: string | null;
  imageUrl: string | null;
  cuisineTags: string[];
  /** Beach point the venue sits at or delivers to; null for town venues. */
  beachPointCode: string | null;
  beachPointName: string | null;
  openHour: number;
  closeHour: number;
  reservationsEnabled: boolean;
  deliveryEnabled: boolean;
  /** Cheapest available menu item, null when the menu is empty. */
  priceFromMinor: number | null;
  currency: string;
  destinationSlug: string;
  spotSlug: string | null;
}

export interface DiningVenueDetail extends DiningVenueSummary {
  address: string | null;
  contactPhone: string | null;
  reservationDepositMinor: number;
  menu: MenuCategoryDto[];
}

export interface DiningVenueQuery {
  destination?: string;
  spot?: string;
  kind?: DiningVenueKind;
  beachPointCode?: string;
  reservable?: boolean;
  delivers?: boolean;
}

// ---- Stream B: table reservations -------------------------------------------

export interface TableSlotAvailability {
  startsAt: string;
  hour: number;
  label: string;
  available: boolean;
}

export interface TableAvailability {
  id: string;
  code: string;
  seats: number;
  slots: TableSlotAvailability[];
}

export interface TableAvailabilityDto {
  venueCode: string;
  date: string;
  openHour: number;
  closeHour: number;
  depositMinor: number;
  currency: string;
  tables: TableAvailability[];
}

export interface CreateReservationRequest {
  tableId: string;
  /** ISO instant, must be on the hour. */
  startsAt: string;
  hours: number;
  partySize: number;
  note?: string;
  /**
   * Checkout method for the deposit; ignored when the deposit is zero.
   * `'MOCK'` or absent is the legacy form (stored as null).
   */
  paymentMethod?: PaymentMethodInput;
}

export interface CancelReservationRequest {
  reason?: string;
}

export interface ReservationDto extends DiningPaymentRefs {
  id: string;
  publicRef: string;
  status: ReservationStatus;
  venue: { code: string; name: string };
  table: { code: string };
  partySize: number;
  startAt: string;
  endAt: string;
  phase: OrderPhase;
  depositMinor: number;
  currency: string;
  note: string | null;
  placedAt: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  checkedInAt: string | null;
  ticket: TicketDto | null;
  canCancel: boolean;
}

export interface AdminReservationDto extends ReservationDto {
  tourist: { id: string; name: string; email: string | null };
}

export interface ReservationListDto {
  reservations: ReservationDto[];
}

export interface AdminReservationQuery {
  /** Dhaka date key (YYYY-MM-DD) the reservation starts on. */
  date?: string;
  venueCode?: string;
  status?: ReservationStatus;
}

/** Tourist cancellation closes this many minutes before the reserved start. */
export const RESERVATION_CANCEL_CUTOFF_MINUTES = 60;
/** Admin check-in opens this many minutes before the start and closes at the end. */
export const RESERVATION_CHECK_IN_EARLY_MINUTES = 30;

// ---- Stream C: sunbed food delivery ----------------------------------------

/** A sunbed booking the tourist may currently order food to. */
export interface DeliverableBedDto {
  orderItemId: string;
  sunbedCode: string;
  beachPointCode: string;
  beachPointName: string;
  startAt: string;
  endAt: string;
  status: OrderItemStatus;
}

export interface CreateFoodOrderLine {
  menuItemId: string;
  quantity: number;
}

export interface CreateFoodOrderRequest {
  /** The tourist's own sunbed booking line (`OrderItemDto.id`). */
  orderItemId: string;
  venueId: string;
  lines: CreateFoodOrderLine[];
  note?: string;
  /** Checkout method. `'MOCK'` or absent is the legacy form (stored as null). */
  paymentMethod?: PaymentMethodInput;
}

export interface CancelFoodOrderRequest {
  reason?: string;
}

export interface FoodOrderLineDto {
  id: string;
  menuItemId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  totalMinor: number;
}

export interface FoodOrderDto extends DiningPaymentRefs {
  id: string;
  publicRef: string;
  status: FoodOrderStatus;
  venue: { code: string; name: string };
  delivery: { sunbedCode: string; beachPointCode: string; beachPointName: string };
  lines: FoodOrderLineDto[];
  subtotalMinor: number;
  totalMinor: number;
  currency: string;
  note: string | null;
  placedAt: string;
  preparingAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  canCancel: boolean;
}

export interface AdminFoodOrderDto extends FoodOrderDto {
  tourist: { id: string; name: string; email: string | null };
}

export interface FoodOrderListDto {
  orders: FoodOrderDto[];
}

/** Kitchen board filters for `GET /admin/dining/food-orders`. */
export interface AdminFoodOrderQuery {
  venueCode?: string;
  status?: FoodOrderStatus;
  /** Asia/Dhaka calendar date (YYYY-MM-DD) the order was placed on. */
  date?: string;
}

// ---- Stream D: dining administration ---------------------------------------

export interface UpdateMenuItemRequest {
  name?: string;
  nameBn?: string | null;
  description?: string | null;
  priceMinor?: number;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface UpdateDiningVenueRequest {
  description?: string | null;
  openHour?: number;
  closeHour?: number;
  reservationsEnabled?: boolean;
  deliveryEnabled?: boolean;
  reservationDepositMinor?: number;
  isActive?: boolean;
}

export interface UpdateFoodOrderStatusRequest {
  status: Exclude<FoodOrderStatus, 'PLACED'>;
  reason?: string;
}

export interface DiningAdminOverviewDto {
  date: string;
  venueCount: number;
  reservationsToday: number;
  openFoodOrders: number;
  foodRevenueMinor: number;
  currency: string;
}

/** Menu item as the admin editor sees it: adds the sort key the public menu only implies. */
export interface AdminMenuItemDto extends MenuItemDto {
  sortOrder: number;
}

export interface AdminMenuCategoryDto extends MenuCategoryDto {
  items: AdminMenuItemDto[];
}

/**
 * `DiningVenueDetail` plus admin-only fields. Includes inactive venues and
 * unavailable menu items; still assignable to `DiningVenueDetail`.
 */
export interface DiningAdminVenueDto extends DiningVenueDetail {
  isActive: boolean;
  sortOrder: number;
  menu: AdminMenuCategoryDto[];
}

/** Server-side bounds for the admin editors (the web form mirrors them). */
export const DINING_ADMIN_LIMITS = {
  descriptionMaxLength: 1000,
  menuItemNameMaxLength: 120,
  menuItemDescriptionMaxLength: 500,
  maxDepositMinor: 10_000_000,
  maxMenuPriceMinor: 10_000_000,
  maxSortOrder: 10_000,
} as const;

/* -------------------------------------------------------------------------- */
/* Places (WP-05)                                                             */
/* -------------------------------------------------------------------------- */

export const DESTINATION_ACCENTS = [
  'SEA',
  'FOREST',
  'LAKE',
  'HILL',
  'HERITAGE',
  'NEUTRAL',
] as const;
export type DestinationAccent = (typeof DESTINATION_ACCENTS)[number];

export const SPOT_KINDS = [
  'BEACH',
  'HILL',
  'LAKE',
  'RIVER',
  'WATERFALL',
  'FOREST',
  'TEA_GARDEN',
  'ISLAND',
  'HERITAGE',
  'PARK',
  'MARKET',
  'OTHER',
] as const;
export type SpotKind = (typeof SPOT_KINDS)[number];

export const EMERGENCY_CONTACT_KINDS = [
  'NATIONAL',
  'POLICE',
  'FIRE',
  'HOSPITAL',
  'COAST_GUARD',
  'DESK',
  'OTHER',
] as const;
export type EmergencyContactKind = (typeof EMERGENCY_CONTACT_KINDS)[number];

export const SPOT_ALERT_KINDS = ['WEATHER', 'SEA', 'CLOSURE', 'EVENT', 'NOTICE'] as const;
export type SpotAlertKind = (typeof SPOT_ALERT_KINDS)[number];
export const SPOT_ALERT_SEVERITIES = ['INFO', 'CAUTION', 'DANGER'] as const;
export type SpotAlertSeverity = (typeof SPOT_ALERT_SEVERITIES)[number];

/** Number of active listings per service type; tiles show only non-zero ones. */
export interface ServiceCountsDto {
  stay: number;
  food: number;
  /** Beach spots with bookable sunbeds. */
  sunbeds: number;
}

export interface DestinationContentDto {
  about: string | null;
  bestTime: string | null;
  gettingThere: string | null;
}

export interface SpotContentDto {
  rules: string[];
  tips: string[];
}

export interface SpotAlertDto {
  id: string;
  kind: SpotAlertKind;
  severity: SpotAlertSeverity;
  title: string;
  body: string | null;
  /** Null when the alert covers the whole destination. */
  spotSlug: string | null;
  startsAt: string;
  endsAt: string | null;
}

/** A public number entered by the operator. Coastline does not dispatch help. */
export interface EmergencyContactDto {
  label: string;
  labelBn: string | null;
  phone: string;
  kind: EmergencyContactKind;
}

export interface DestinationSummaryDto {
  slug: string;
  name: string;
  nameBn: string | null;
  tagline: string;
  accent: DestinationAccent;
  latitude: number;
  longitude: number;
  mapZoom: number;
  spotCount: number;
  services: ServiceCountsDto;
  /** The highest-severity alert active now, if any. */
  topAlert: SpotAlertDto | null;
}

export interface SpotSummaryDto {
  slug: string;
  name: string;
  nameBn: string | null;
  kind: SpotKind;
  description: string | null;
  latitude: number;
  longitude: number;
  /** Asia/Dhaka hours; null when the spot is always open. */
  openHours: { open: number; close: number } | null;
  entryInfo: string | null;
  /** Code of the spot's sunbed row, when it has one. */
  beachPointCode: string | null;
  services: ServiceCountsDto;
}

export interface DestinationDetailDto extends DestinationSummaryDto {
  description: string | null;
  content: DestinationContentDto;
  spots: SpotSummaryDto[];
  emergencyContacts: EmergencyContactDto[];
  alerts: SpotAlertDto[];
}

export interface SpotDetailDto extends SpotSummaryDto {
  destination: { slug: string; name: string; accent: DestinationAccent };
  content: SpotContentDto;
  /** Alerts for this spot and for the whole destination, active now. */
  alerts: SpotAlertDto[];
  emergencyContacts: EmergencyContactDto[];
}

/* -------------------------------------------------------------------------- */
/* Workspaces (WP-04)                                                         */
/* -------------------------------------------------------------------------- */

export const PROVIDER_MEMBER_ROLES = ['OWNER', 'STAFF'] as const;
export type ProviderMemberRole = (typeof PROVIDER_MEMBER_ROLES)[number];

export interface ProviderMembershipDto {
  providerId: string;
  name: string;
  role: ProviderMemberRole;
}

/* -------------------------------------------------------------------------- */
/* Saved items (WP-25)                                                        */
/* -------------------------------------------------------------------------- */

export const SAVED_ITEM_TYPES = ['HOTEL', 'VENUE', 'SPOT'] as const;
export type SavedItemType = (typeof SAVED_ITEM_TYPES)[number];

/** `key`: hotel slug, venue code, or `"<destination>/<spot>"`. */
export interface SaveItemRequest {
  type: SavedItemType;
  key: string;
}

export interface SavedItemDto {
  type: SavedItemType;
  key: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  /** Web path of the saved thing. */
  href: string;
  savedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Checkout quote                                                             */
/* -------------------------------------------------------------------------- */

/**
 * `POST /checkout/quote`: the server's price for a booking before payment.
 * The body is the create request of that engine; nothing is booked.
 */
export type CheckoutQuoteRequest =
  | { kind: 'sunbed'; request: CreateOrderRequest }
  | { kind: 'stay'; request: CreateHotelBookingItem }
  | { kind: 'table'; request: CreateReservationRequest }
  | { kind: 'food'; request: CreateFoodOrderRequest };

export interface CheckoutQuoteLineDto {
  label: string;
  detail: string | null;
  amountMinor: number;
}

export interface CheckoutQuoteDto {
  lines: CheckoutQuoteLineDto[];
  /** What is charged now (the full total, or a table deposit). */
  totalMinor: number;
  currency: string;
}

/* -------------------------------------------------------------------------- */
/* Desk (WP-23, first part)                                                   */
/* -------------------------------------------------------------------------- */

/** `POST /desk/lookup`: a scanned ticket payload or a typed reference. */
export interface DeskLookupRequest {
  query: string;
}

/** A booking found at the desk: sunbeds and rooms, or a table reservation. */
export type DeskLookupDto =
  | { kind: 'order'; order: AdminOrderDto }
  | { kind: 'reservation'; reservation: AdminReservationDto };
