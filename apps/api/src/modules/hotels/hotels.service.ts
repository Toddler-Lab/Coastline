import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type {
  HotelDetailDto,
  HotelSummaryDto,
  OrderDto,
  RoomTypeDto,
} from '@coastline/api-contracts';
import { Prisma } from '@coastline/db';
import type { Actor } from '../../common/auth/actor';
import { conflict, forbidden, notFound, unprocessable } from '../../common/errors/api-errors';
import { PrismaService } from '../../common/prisma/prisma.service';
import { dhakaDateKey, isDateKey } from '../../common/time/dhaka';
import { AuditActions } from '../audit/audit.actions';
import { AuditService } from '../audit/audit.service';
import { serializeOrder } from '../bookings/orders.serializer';
import { TicketService } from '../bookings/ticket.service';
import type { CreateHotelOrderDto } from './dto/create-hotel-order.dto';
import type { HotelQueryDto } from './dto/hotel-query.dto';

function generateHotelRef(dateKey: string): string {
  const cleanDate = dateKey.replace(/-/g, '');
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  return `HTL-${cleanDate}-${suffix}`;
}

function getDateRange(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(`${checkIn}T00:00:00.000Z`);
  const end = new Date(`${checkOut}T00:00:00.000Z`);

  const current = new Date(start);
  while (current < end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function assertDateKey(value: string | undefined, field: string): void {
  if (value !== undefined && !isDateKey(value)) {
    throw unprocessable(`${field} must be a valid calendar date (YYYY-MM-DD).`);
  }
}

@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly ticketService: TicketService,
  ) {}

  async listHotels(query: HotelQueryDto): Promise<HotelSummaryDto[]> {
    assertDateKey(query.checkInDate, 'checkInDate');
    assertDateKey(query.checkOutDate, 'checkOutDate');

    const where: Prisma.HotelWhereInput = { isActive: true };
    if (query.zone) {
      where.zone = query.zone;
    }
    if (query.starRating) {
      where.starRating = { gte: query.starRating };
    }

    const hotels = await this.prisma.hotel.findMany({
      where,
      include: {
        roomTypes: {
          where: { isActive: true },
          include: {
            rooms: {
              where: { status: 'AVAILABLE', isActive: true },
              select: { id: true, roomNumber: true },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { starRating: 'desc' }, { distanceMeters: 'asc' }],
    });

    const checkIn = query.checkInDate || dhakaDateKey();
    const checkOut =
      query.checkOutDate ||
      new Date(Date.parse(`${checkIn}T00:00:00.000Z`) + 86_400_000).toISOString().slice(0, 10);
    const nights = getDateRange(checkIn, checkOut);

    const summaries: HotelSummaryDto[] = [];

    for (const h of hotels) {
      const allRooms = h.roomTypes.flatMap((rt) => rt.rooms);
      const totalRooms = allRooms.length;

      // Check occupied rooms across requested nights
      const occupiedNights = await this.prisma.hotelRoomNight.findMany({
        where: {
          roomId: { in: allRooms.map((r) => r.id) },
          stayDate: { in: nights },
          isActive: true,
        },
        select: { roomId: true },
      });
      const occupiedRoomIds = new Set(occupiedNights.map((n) => n.roomId));
      const availableRoomsCount = allRooms.filter((r) => !occupiedRoomIds.has(r.id)).length;

      const prices = h.roomTypes.map((rt) => rt.basePriceMinor);
      const minPriceMinor = prices.length > 0 ? Math.min(...prices) : 0;

      if (query.minPrice && minPriceMinor < query.minPrice * 100) {
        continue;
      }
      if (query.maxPrice && minPriceMinor > query.maxPrice * 100) {
        continue;
      }

      summaries.push({
        id: h.id,
        slug: h.slug,
        name: h.name,
        banglaName: h.banglaName,
        zone: h.zone,
        address: h.address,
        latitude: h.latitude,
        longitude: h.longitude,
        starRating: h.starRating,
        featuredImage: h.featuredImage,
        description: h.description,
        phone: h.phone,
        email: h.email,
        nearestBeachCode: h.nearestBeachCode,
        distanceMeters: h.distanceMeters,
        isFeatured: h.isFeatured,
        minPriceMinor,
        totalRooms,
        availableRoomsCount,
      });
    }

    return summaries;
  }

  async getHotelBySlug(
    slug: string,
    checkInDate?: string,
    checkOutDate?: string,
  ): Promise<HotelDetailDto> {
    assertDateKey(checkInDate, 'checkInDate');
    assertDateKey(checkOutDate, 'checkOutDate');

    const hotel = await this.prisma.hotel.findUnique({
      where: { slug },
      include: {
        roomTypes: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            rooms: {
              where: { status: 'AVAILABLE', isActive: true },
              select: { id: true, roomNumber: true },
            },
          },
        },
      },
    });

    if (!hotel) {
      throw notFound(`Hotel with slug "${slug}" was not found.`);
    }

    const checkIn = checkInDate || dhakaDateKey();
    const checkOut =
      checkOutDate ||
      new Date(Date.parse(`${checkIn}T00:00:00.000Z`) + 86_400_000).toISOString().slice(0, 10);
    const nights = getDateRange(checkIn, checkOut);

    const allRooms = hotel.roomTypes.flatMap((rt) => rt.rooms);
    const occupiedNights = await this.prisma.hotelRoomNight.findMany({
      where: {
        roomId: { in: allRooms.map((r) => r.id) },
        stayDate: { in: nights },
        isActive: true,
      },
      select: { roomId: true },
    });
    const occupiedRoomIds = new Set(occupiedNights.map((n) => n.roomId));

    const roomTypeDtos: RoomTypeDto[] = hotel.roomTypes.map((rt) => {
      const freeRooms = rt.rooms.filter((r) => !occupiedRoomIds.has(r.id));
      return {
        id: rt.id,
        hotelId: rt.hotelId,
        name: rt.name,
        code: rt.code,
        description: rt.description,
        maxGuests: rt.maxGuests,
        bedConfig: rt.bedConfig,
        basePriceMinor: rt.basePriceMinor,
        currency: rt.currency.trim(),
        amenities: Array.isArray(rt.amenities) ? (rt.amenities as string[]) : [],
        images: Array.isArray(rt.images) ? (rt.images as string[]) : [],
        sortOrder: rt.sortOrder,
        availableRooms: freeRooms.length,
        sampleRoomNumber: freeRooms[0]?.roomNumber,
      };
    });

    const prices = roomTypeDtos.map((rt) => rt.basePriceMinor);
    const minPriceMinor = prices.length > 0 ? Math.min(...prices) : 0;
    const totalRooms = allRooms.length;
    const availableRoomsCount = allRooms.filter((r) => !occupiedRoomIds.has(r.id)).length;

    return {
      id: hotel.id,
      slug: hotel.slug,
      name: hotel.name,
      banglaName: hotel.banglaName,
      zone: hotel.zone,
      address: hotel.address,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      starRating: hotel.starRating,
      featuredImage: hotel.featuredImage,
      galleryImages: Array.isArray(hotel.galleryImages) ? (hotel.galleryImages as string[]) : [],
      description: hotel.description,
      phone: hotel.phone,
      email: hotel.email,
      nearestBeachCode: hotel.nearestBeachCode,
      distanceMeters: hotel.distanceMeters,
      isFeatured: hotel.isFeatured,
      minPriceMinor,
      totalRooms,
      availableRoomsCount,
      amenities: Array.isArray(hotel.amenities) ? (hotel.amenities as string[]) : [],
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      roomTypes: roomTypeDtos,
    };
  }

  async createHotelBooking(
    actor: Actor,
    dto: CreateHotelOrderDto,
    requestId?: string,
  ): Promise<OrderDto> {
    if (actor.role !== 'TOURIST') {
      throw forbidden(
        'Admins cannot place tourist bookings. Switch persona to a tourist in the header.',
      );
    }

    assertDateKey(dto.checkInDate, 'checkInDate');
    assertDateKey(dto.checkOutDate, 'checkOutDate');

    if (dto.checkOutDate <= dto.checkInDate) {
      throw unprocessable('Check-out date must be strictly after check-in date.');
    }

    const today = dhakaDateKey();
    if (dto.checkInDate < today) {
      throw unprocessable('Cannot book hotel stays in the past.');
    }

    const stayNights = getDateRange(dto.checkInDate, dto.checkOutDate);
    if (stayNights.length > 30) {
      throw unprocessable('Maximum stay duration is 30 nights.');
    }

    const roomType = await this.prisma.roomType.findFirst({
      where: { id: dto.roomTypeId, hotelId: dto.hotelId, isActive: true },
      include: {
        hotel: true,
        rooms: {
          where: { status: 'AVAILABLE', isActive: true },
        },
      },
    });

    if (!roomType) {
      throw notFound('Selected room type was not found for this hotel.');
    }

    if (roomType.rooms.length === 0) {
      throw conflict('No active rooms available in this category.');
    }

    const guestsCount = dto.guestsCount ?? Math.min(2, roomType.maxGuests);
    if (guestsCount > roomType.maxGuests) {
      throw unprocessable(`${roomType.name} sleeps at most ${roomType.maxGuests} guests.`);
    }

    // Find occupied rooms for these dates
    const occupiedRows = await this.prisma.hotelRoomNight.findMany({
      where: {
        roomId: { in: roomType.rooms.map((r) => r.id) },
        stayDate: { in: stayNights },
        isActive: true,
      },
      select: { roomId: true },
    });
    const occupiedSet = new Set(occupiedRows.map((r) => r.roomId));
    const candidates = roomType.rooms.filter((r) => !occupiedSet.has(r.id));

    if (candidates.length === 0) {
      throw conflict(
        `All ${roomType.name} rooms are fully booked for ${dto.checkInDate} to ${dto.checkOutDate}.`,
      );
    }

    const totalMinor = roomType.basePriceMinor * stayNights.length;

    // Concurrent guests can win the room we picked. The partial unique index on
    // active room-nights decides the race; on a loss, try the next free room.
    for (const candidateRoom of candidates) {
      const publicRef = generateHotelRef(dto.checkInDate);

      try {
        const createdOrder = await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              publicRef,
              touristId: actor.id,
              status: 'CONFIRMED',
              subtotalMinor: totalMinor,
              totalMinor,
              currency: 'BDT',
              hotelBookings: {
                create: {
                  hotelId: roomType.hotelId,
                  roomTypeId: roomType.id,
                  roomId: candidateRoom.id,
                  hotelName: roomType.hotel.name,
                  hotelSlug: roomType.hotel.slug,
                  roomTypeName: roomType.name,
                  roomNumber: candidateRoom.roomNumber,
                  checkInDate: dto.checkInDate,
                  checkOutDate: dto.checkOutDate,
                  checkInTime: roomType.hotel.checkInTime,
                  nights: stayNights.length,
                  guestsCount,
                  nightlyPriceMinor: roomType.basePriceMinor,
                  totalMinor,
                  currency: 'BDT',
                  status: 'RESERVED',
                  nightsStayed: {
                    create: stayNights.map((date) => ({
                      roomId: candidateRoom.id,
                      stayDate: date,
                      isActive: true,
                    })),
                  },
                },
              },
              payments: {
                create: {
                  type: 'CHARGE',
                  provider: 'MOCK',
                  status: 'SUCCEEDED',
                  amountMinor: totalMinor,
                  currency: 'BDT',
                  externalRef: `MOCK-${publicRef}`,
                },
              },
            },
            include: {
              items: true,
              hotelBookings: true,
              payments: true,
              tourist: true,
            },
          });

          await this.audit.record(
            {
              actorUserId: actor.id,
              action: AuditActions.ORDER_PLACED,
              entityType: 'hotel_order',
              entityId: order.id,
              details: {
                publicRef: order.publicRef,
                hotel: roomType.hotel.name,
                roomType: roomType.name,
                roomNumber: candidateRoom.roomNumber,
                checkIn: dto.checkInDate,
                checkOut: dto.checkOutDate,
                nights: stayNights.length,
                totalMinor,
              },
              requestId,
            },
            tx,
          );

          return order;
        });

        return serializeOrder(createdOrder, this.ticketService);
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          continue;
        }
        throw err;
      }
    }

    throw conflict(
      `All ${roomType.name} rooms were just reserved by other guests for ${dto.checkInDate} to ${dto.checkOutDate}.`,
    );
  }
}
