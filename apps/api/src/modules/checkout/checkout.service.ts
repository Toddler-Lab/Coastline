import { Injectable } from '@nestjs/common';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import type { CheckoutQuoteDto, CheckoutQuoteLineDto } from '@coastline/api-contracts';
import { MAX_BEDS_PER_ORDER, MAX_HOURS_PER_ITEM } from '@coastline/api-contracts';
import { notFound, unprocessable, validation } from '../../common/errors/api-errors';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isDateKey } from '../../common/time/dhaka';
import { CreateOrderDto } from '../bookings/dto/create-order.dto';
import { CreateFoodOrderDto } from '../dining/delivery/dto/create-food-order.dto';
import { CreateReservationDto } from '../dining/reservations/dto/create-reservation.dto';
import { CreateHotelOrderDto } from '../hotels/dto/create-hotel-order.dto';

export type QuoteKind = 'sunbed' | 'stay' | 'table' | 'food';

function taka(minor: number): string {
  return `Tk ${(minor / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Server price of a booking before payment (design.md 2.4, "price before
 * commitment"). The body is validated with the same DTO the engine's create
 * endpoint uses, prices come from the database, and nothing is written. The
 * create call prices the booking again; checkout compares the two and stops
 * when they differ.
 */
@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(kind: QuoteKind, raw: unknown): Promise<CheckoutQuoteDto> {
    switch (kind) {
      case 'sunbed':
        return this.sunbed(await this.parse(CreateOrderDto, raw));
      case 'stay':
        return this.stay(await this.parse(CreateHotelOrderDto, raw));
      case 'table':
        return this.table(await this.parse(CreateReservationDto, raw));
      case 'food':
        return this.food(await this.parse(CreateFoodOrderDto, raw));
    }
  }

  private async parse<T extends object>(type: ClassConstructor<T>, raw: unknown): Promise<T> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw validation('request must be an object.');
    }
    const instance = plainToInstance(type, raw);
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? { [error.property]: 'is not valid' }),
      );
      throw validation('The booking could not be validated.', messages);
    }
    return instance;
  }

  private async sunbed(dto: CreateOrderDto): Promise<CheckoutQuoteDto> {
    if (dto.items.length === 0 || dto.items.length > MAX_BEDS_PER_ORDER) {
      throw unprocessable(`Choose between 1 and ${MAX_BEDS_PER_ORDER} beds.`);
    }
    const beds = await this.prisma.sunbed.findMany({
      where: { id: { in: dto.items.map((item) => item.sunbedId) } },
      select: {
        id: true,
        code: true,
        hourlyPriceMinor: true,
        currency: true,
        status: true,
        beachPoint: { select: { isActive: true } },
      },
    });
    const byId = new Map(beds.map((bed) => [bed.id, bed]));
    const lines: CheckoutQuoteLineDto[] = dto.items.map((item) => {
      const bed = byId.get(item.sunbedId);
      if (!bed || bed.status !== 'AVAILABLE' || !bed.beachPoint.isActive) {
        throw unprocessable('One of the chosen beds is not available.');
      }
      if (item.hours < 1 || item.hours > MAX_HOURS_PER_ITEM) {
        throw unprocessable(`Book between 1 and ${MAX_HOURS_PER_ITEM} hours.`);
      }
      return {
        label: `Sunbed ${bed.code}`,
        detail: `${taka(bed.hourlyPriceMinor)} × ${plural(item.hours, 'hour')}`,
        amountMinor: bed.hourlyPriceMinor * item.hours,
      };
    });
    return this.total(lines, beds[0]?.currency ?? 'BDT');
  }

  private async stay(dto: CreateHotelOrderDto): Promise<CheckoutQuoteDto> {
    if (
      !isDateKey(dto.checkInDate) ||
      !isDateKey(dto.checkOutDate) ||
      dto.checkOutDate <= dto.checkInDate
    ) {
      throw unprocessable('Check-out must be after check-in.');
    }
    const roomType = await this.prisma.roomType.findFirst({
      where: {
        id: dto.roomTypeId,
        hotelId: dto.hotelId,
        isActive: true,
        hotel: { isActive: true },
      },
      select: { name: true, basePriceMinor: true, currency: true, maxGuests: true },
    });
    if (!roomType) {
      throw notFound('Room type not found.');
    }
    if (dto.guestsCount !== undefined && dto.guestsCount > roomType.maxGuests) {
      throw unprocessable(`${roomType.name} sleeps at most ${roomType.maxGuests} guests.`);
    }
    const nights = Math.round(
      (Date.parse(`${dto.checkOutDate}T00:00:00Z`) - Date.parse(`${dto.checkInDate}T00:00:00Z`)) /
        86_400_000,
    );
    return this.total(
      [
        {
          label: roomType.name,
          detail: `${taka(roomType.basePriceMinor)} × ${plural(nights, 'night')}`,
          amountMinor: roomType.basePriceMinor * nights,
        },
      ],
      roomType.currency.trim(),
    );
  }

  private async table(dto: CreateReservationDto): Promise<CheckoutQuoteDto> {
    const table = await this.prisma.diningTable.findFirst({
      where: {
        id: dto.tableId,
        isActive: true,
        venue: { isActive: true, reservationsEnabled: true },
      },
      select: { venue: { select: { reservationDepositMinor: true, currency: true } } },
    });
    if (!table) {
      throw notFound('Table not found.');
    }
    const deposit = table.venue.reservationDepositMinor;
    const lines =
      deposit > 0
        ? [
            {
              label: 'Table deposit',
              detail: 'Refunded in full if you cancel in time',
              amountMinor: deposit,
            },
          ]
        : [];
    return this.total(lines, table.venue.currency.trim());
  }

  private async food(dto: CreateFoodOrderDto): Promise<CheckoutQuoteDto> {
    const items = await this.prisma.menuItem.findMany({
      where: {
        id: { in: dto.lines.map((line) => line.menuItemId) },
        venueId: dto.venueId,
        isAvailable: true,
        venue: { isActive: true, deliveryEnabled: true },
      },
      select: { id: true, name: true, priceMinor: true, currency: true },
    });
    const byId = new Map(items.map((item) => [item.id, item]));
    const lines = dto.lines.map((line) => {
      const item = byId.get(line.menuItemId);
      if (!item) {
        throw unprocessable('One of the menu items is not available now.');
      }
      return {
        label: `${line.quantity} × ${item.name}`,
        detail: null,
        amountMinor: item.priceMinor * line.quantity,
      };
    });
    return this.total(lines, items[0]?.currency.trim() ?? 'BDT');
  }

  private total(lines: CheckoutQuoteLineDto[], currency: string): CheckoutQuoteDto {
    return {
      lines: lines.map((line) => ({ ...line, detail: line.detail ?? null })),
      totalMinor: lines.reduce((sum, line) => sum + line.amountMinor, 0),
      currency: currency.trim(),
    };
  }
}
