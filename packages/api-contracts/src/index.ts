/**
 * Shared transport types for the Coastline beach demonstrator API.
 *
 * Dependency-free so the NestJS API and the Next.js client can both import it.
 * Validation DTOs live in the API; only stable values live here.
 */

export const ROLES = ['TOURIST', 'ADMIN'] as const;
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

export interface PaymentDto {
  id: string;
  type: 'CHARGE' | 'REFUND';
  provider: string;
  status: 'SUCCEEDED';
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
  /** Only the mock provider exists; the server ignores any other value. */
  paymentMethod?: 'MOCK';
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

export interface CreateHotelOrderRequest {
  booking: CreateHotelBookingItem;
  touristName?: string;
  touristEmail?: string;
  touristPhone?: string;
}

export interface HotelAvailabilityQuery {
  checkInDate?: string;
  checkOutDate?: string;
  zone?: HotelZone;
  minPrice?: number;
  maxPrice?: number;
  starRating?: number;
}

/** Dhaka is UTC+6 all year; no daylight saving. */
export const DHAKA_OFFSET_MINUTES = 360;
