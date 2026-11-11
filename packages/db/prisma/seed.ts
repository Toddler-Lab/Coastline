/**
 * Deterministic demo seed: six Cox's Bazar beach points, sunbeds, and a handful
 * of orders around today so the map and admin views are never empty.
 *
 * Catalogue records are upserted by their stable codes. Orders are demo-only and
 * are cleared on every seed run.
 */
import process from 'node:process';
import { PrismaClient } from '../src/index';
import { HOTELS } from './hotels-seed';

const prisma = new PrismaClient();

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function dhakaDateKey(date: Date = new Date()): string {
  return new Date(date.getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 10);
}

function dhakaHourToUtc(dateKey: string, hour: number): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0, 0) - DHAKA_OFFSET_MS);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * HOUR_MS);
}

const USERS = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Coastline Admin',
    email: 'admin@coastline.demo',
    role: 'ADMIN' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    name: 'Rafiq Hasan',
    email: 'rafiq@coastline.demo',
    role: 'TOURIST' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    name: 'Nusrat Jahan',
    email: 'nusrat@coastline.demo',
    role: 'TOURIST' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    name: 'Tanvir Ahmed',
    email: 'tanvir@coastline.demo',
    role: 'TOURIST' as const,
  },
];

interface PointSeed {
  code: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  openHour: number;
  closeHour: number;
  priceMinor: number;
  sortOrder: number;
  beds: number;
}

const POINTS: PointSeed[] = [
  {
    code: 'SUG',
    name: 'Sugandha Beach',
    description: 'The busy town-end stretch, closest to the hotels and the evening food stalls.',
    latitude: 21.4212,
    longitude: 91.9775,
    openHour: 8,
    closeHour: 18,
    priceMinor: 10000,
    sortOrder: 1,
    beds: 18,
  },
  {
    code: 'KOL',
    name: 'Kolatoli Beach',
    description: 'Wide open sand with the main lifeguard tower and the busiest sunbed line.',
    latitude: 21.4150,
    longitude: 91.9835,
    openHour: 8,
    closeHour: 18,
    priceMinor: 10000,
    sortOrder: 2,
    beds: 24,
  },
  {
    code: 'LAB',
    name: 'Laboni Beach',
    description: 'The classic viewpoint: gently sloping sand, shells, and a short walk from town.',
    latitude: 21.4285,
    longitude: 91.9705,
    openHour: 8,
    closeHour: 18,
    priceMinor: 12000,
    sortOrder: 3,
    beds: 20,
  },
  {
    code: 'HIM',
    name: 'Himchari',
    description: 'Cliff-backed beach south of town, where the hills meet the water.',
    latitude: 21.3500,
    longitude: 92.0280,
    openHour: 8,
    closeHour: 17,
    priceMinor: 15000,
    sortOrder: 4,
    beds: 12,
  },
  {
    code: 'INA',
    name: 'Inani Beach',
    description: 'Long, quiet coral-sand stretch on the marine drive; fewer beds, more space.',
    latitude: 21.2135,
    longitude: 92.0480,
    openHour: 8,
    closeHour: 17,
    priceMinor: 15000,
    sortOrder: 5,
    beds: 10,
  },
  {
    code: 'TEK',
    name: 'Teknaf',
    description: 'The far southern tip at the Naf river mouth, looking across to Myanmar.',
    latitude: 20.8462,
    longitude: 92.2720,
    openHour: 8,
    closeHour: 17,
    priceMinor: 12000,
    sortOrder: 6,
    beds: 8,
  },
];

interface SeedOrder {
  ref: string;
  touristId: string;
  dayOffset: number;
  lines: Array<{ code: string; hour: number; hours: number }>;
  paidHoursAgo?: number;
  cancelled?: boolean;
}

const ORDERS: SeedOrder[] = [
  {
    ref: 'SEED-001',
    touristId: USERS[1].id,
    dayOffset: 0,
    lines: [
      { code: 'KOL-001', hour: 9, hours: 2 },
      { code: 'KOL-002', hour: 9, hours: 2 },
    ],
  },
  {
    ref: 'SEED-002',
    touristId: USERS[2].id,
    dayOffset: 0,
    lines: [{ code: 'KOL-003', hour: 11, hours: 2 }],
  },
  {
    ref: 'SEED-003',
    touristId: USERS[1].id,
    dayOffset: 0,
    lines: [
      { code: 'KOL-005', hour: 14, hours: 3 },
      { code: 'KOL-006', hour: 14, hours: 3 },
    ],
  },
  {
    ref: 'SEED-004',
    touristId: USERS[3].id,
    dayOffset: 0,
    lines: [{ code: 'SUG-001', hour: 10, hours: 2 }],
  },
  {
    ref: 'SEED-005',
    touristId: USERS[2].id,
    dayOffset: 1,
    lines: [{ code: 'KOL-001', hour: 10, hours: 3 }],
  },
  {
    ref: 'SEED-006',
    touristId: USERS[1].id,
    dayOffset: 1,
    lines: [
      { code: 'LAB-001', hour: 9, hours: 2 },
      { code: 'LAB-002', hour: 9, hours: 2 },
      { code: 'LAB-003', hour: 9, hours: 2 },
    ],
  },
  {
    ref: 'SEED-007',
    touristId: USERS[3].id,
    dayOffset: 2,
    lines: [{ code: 'HIM-001', hour: 11, hours: 4 }],
  },
  {
    ref: 'SEED-008',
    touristId: USERS[1].id,
    dayOffset: 0,
    lines: [{ code: 'KOL-008', hour: 16, hours: 1 }],
    cancelled: true,
  },
];

async function main(): Promise<void> {
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, email: user.email, role: user.role, isActive: true },
      create: user,
    });
  }

  const pointIds = new Map<string, string>();
  for (const point of POINTS) {
    const record = await prisma.beachPoint.upsert({
      where: { code: point.code },
      update: {
        name: point.name,
        description: point.description,
        latitude: point.latitude,
        longitude: point.longitude,
        openHour: point.openHour,
        closeHour: point.closeHour,
        defaultHourlyPriceMinor: point.priceMinor,
        sortOrder: point.sortOrder,
        isActive: true,
      },
      create: {
        code: point.code,
        name: point.name,
        description: point.description,
        latitude: point.latitude,
        longitude: point.longitude,
        openHour: point.openHour,
        closeHour: point.closeHour,
        defaultHourlyPriceMinor: point.priceMinor,
        sortOrder: point.sortOrder,
      },
    });
    pointIds.set(point.code, record.id);

    for (let seq = 1; seq <= point.beds; seq += 1) {
      const code = `${point.code}-${String(seq).padStart(3, '0')}`;
      await prisma.sunbed.upsert({
        where: { code },
        update: {
          beachPointId: record.id,
          seq,
          hourlyPriceMinor: point.priceMinor + (seq % 5 === 0 ? 2000 : 0),
        },
        create: {
          beachPointId: record.id,
          seq,
          code,
          hourlyPriceMinor: point.priceMinor + (seq % 5 === 0 ? 2000 : 0),
        },
      });
    }
  }

  // Seed hotels, room types, and rooms
  for (const hotel of HOTELS) {
    const hotelRecord = await prisma.hotel.upsert({
      where: { slug: hotel.slug },
      update: {
        name: hotel.name,
        banglaName: hotel.banglaName,
        zone: hotel.zone,
        address: hotel.address,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        starRating: hotel.starRating,
        featuredImage: hotel.featuredImage,
        galleryImages: hotel.galleryImages,
        description: hotel.description,
        phone: hotel.phone,
        email: hotel.email,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        amenities: hotel.amenities,
        nearestBeachCode: hotel.nearestBeachCode,
        distanceMeters: hotel.distanceMeters,
        isFeatured: hotel.isFeatured,
        isActive: true,
      },
      create: {
        slug: hotel.slug,
        name: hotel.name,
        banglaName: hotel.banglaName,
        zone: hotel.zone,
        address: hotel.address,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        starRating: hotel.starRating,
        featuredImage: hotel.featuredImage,
        galleryImages: hotel.galleryImages,
        description: hotel.description,
        phone: hotel.phone,
        email: hotel.email,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        amenities: hotel.amenities,
        nearestBeachCode: hotel.nearestBeachCode,
        distanceMeters: hotel.distanceMeters,
        isFeatured: hotel.isFeatured,
      },
    });

    for (let i = 0; i < hotel.roomTypes.length; i++) {
      const rt = hotel.roomTypes[i];
      const roomTypeRecord = await prisma.roomType.upsert({
        where: {
          hotelId_code: {
            hotelId: hotelRecord.id,
            code: rt.code,
          },
        },
        update: {
          name: rt.name,
          description: rt.description,
          maxGuests: rt.maxGuests,
          bedConfig: rt.bedConfig,
          basePriceMinor: rt.basePriceMinor,
          amenities: rt.amenities,
          images: rt.images,
          sortOrder: i,
          isActive: true,
        },
        create: {
          hotelId: hotelRecord.id,
          code: rt.code,
          name: rt.name,
          description: rt.description,
          maxGuests: rt.maxGuests,
          bedConfig: rt.bedConfig,
          basePriceMinor: rt.basePriceMinor,
          amenities: rt.amenities,
          images: rt.images,
          sortOrder: i,
        },
      });

      for (const roomNum of rt.rooms) {
        await prisma.hotelRoom.upsert({
          where: {
            hotelId_roomNumber: {
              hotelId: hotelRecord.id,
              roomNumber: roomNum,
            },
          },
          update: {
            roomTypeId: roomTypeRecord.id,
            status: 'AVAILABLE',
            isActive: true,
          },
          create: {
            hotelId: hotelRecord.id,
            roomTypeId: roomTypeRecord.id,
            roomNumber: roomNum,
            status: 'AVAILABLE',
          },
        });
      }
    }
  }

  // Demo bookings are disposable; catalogue rows above are preserved.
  await prisma.order.deleteMany();

  const beds = await prisma.sunbed.findMany({
    select: { id: true, code: true, hourlyPriceMinor: true },
  });
  const bedByCode = new Map(beds.map((bed) => [bed.code, bed]));
  const today = dhakaDateKey();

  for (const order of ORDERS) {
    const orderDate = new Date(Date.parse(`${today}T00:00:00.000Z`) + order.dayOffset * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const lines = order.lines.map((line) => {
      const bed = bedByCode.get(line.code);
      if (!bed) {
        throw new Error(`Seed bed not found: ${line.code}`);
      }
      return { ...line, bed };
    });

    const totalMinor = lines.reduce((sum, line) => sum + line.bed.hourlyPriceMinor * line.hours, 0);
    const status = order.cancelled ? 'CANCELLED' : 'CONFIRMED';

    const created = await prisma.order.create({
      data: {
        publicRef: order.ref,
        touristId: order.touristId,
        status,
        subtotalMinor: totalMinor,
        totalMinor,
        placedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        cancelledAt: order.cancelled ? new Date(Date.now() - 60 * 60 * 1000) : null,
        cancelReason: order.cancelled ? 'Demo cancellation' : null,
        payments: {
          create: {
            type: 'CHARGE',
            amountMinor: totalMinor,
            externalRef: `MOCK-${order.ref}`,
          },
        },
        items: {
          create: lines.map((line) => {
            const startAt = dhakaHourToUtc(orderDate, line.hour);
            const endAt = addHours(startAt, line.hours);
            const slots = Array.from({ length: line.hours }, (_, index) =>
              addHours(startAt, index),
            );

            return {
              sunbedId: line.bed.id,
              beachPointCode: line.code.split('-')[0],
              beachPointName:
                POINTS.find((point) => point.code === line.code.split('-')[0])?.name ?? '',
              sunbedCode: line.code,
              startAt,
              endAt,
              unitPriceMinor: line.bed.hourlyPriceMinor,
              totalMinor: line.bed.hourlyPriceMinor * line.hours,
              status: order.cancelled ? 'CANCELLED' : 'RESERVED',
              slots: {
                create: slots.map((slotStart) => ({
                  sunbedId: line.bed.id,
                  slotStart,
                  isActive: !order.cancelled,
                })),
              },
            };
          }),
        },
      },
      include: { items: true },
    });

    if (order.cancelled) {
      await prisma.payment.create({
        data: {
          orderId: created.id,
          type: 'REFUND',
          amountMinor: totalMinor,
          externalRef: `MOCK-REFUND-${order.ref}`,
        },
      });
    }
  }

  // Demo hotel bookings
  const sayeman = await prisma.hotel.findUnique({
    where: { slug: 'sayeman-beach-resort' },
    include: {
      roomTypes: {
        where: { code: 'SAY-DLX-SEA' },
        include: { rooms: { where: { roomNumber: '301' } } },
      },
    },
  });

  if (sayeman && sayeman.roomTypes[0] && sayeman.roomTypes[0].rooms[0]) {
    const rt = sayeman.roomTypes[0];
    const room = rt.rooms[0];
    const checkIn = today;
    const checkOut = new Date(Date.parse(`${today}T00:00:00.000Z`) + 2 * 86_400_000).toISOString().slice(0, 10);
    const nights = 2;
    const totalMinor = rt.basePriceMinor * nights;

    const hotelOrder = await prisma.order.create({
      data: {
        publicRef: 'HOTEL-001',
        touristId: USERS[1].id,
        status: 'CONFIRMED',
        subtotalMinor: totalMinor,
        totalMinor: totalMinor,
        placedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        payments: {
          create: {
            type: 'CHARGE',
            amountMinor: totalMinor,
            externalRef: 'MOCK-HOTEL-001',
          },
        },
        hotelBookings: {
          create: {
            hotelId: sayeman.id,
            roomTypeId: rt.id,
            roomId: room.id,
            hotelName: sayeman.name,
            hotelSlug: sayeman.slug,
            roomTypeName: rt.name,
            roomNumber: room.roomNumber,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            nights,
            guestsCount: 2,
            nightlyPriceMinor: rt.basePriceMinor,
            totalMinor,
            status: 'RESERVED',
            nightsStayed: {
              create: [
                {
                  roomId: room.id,
                  stayDate: checkIn,
                },
                {
                  roomId: room.id,
                  stayDate: new Date(Date.parse(`${today}T00:00:00.000Z`) + 1 * 86_400_000).toISOString().slice(0, 10),
                },
              ],
            },
          },
        },
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    points: await prisma.beachPoint.count(),
    sunbeds: await prisma.sunbed.count(),
    hotels: await prisma.hotel.count(),
    roomTypes: await prisma.roomType.count(),
    hotelRooms: await prisma.hotelRoom.count(),
    orders: await prisma.order.count(),
    hotelBookings: await prisma.hotelBooking.count(),
  };
  console.log(
    `Seeded ${counts.points} beach points, ${counts.sunbeds} sunbeds, ${counts.hotels} hotels, ${counts.roomTypes} room types, ${counts.hotelRooms} rooms, ${counts.orders} orders (${counts.hotelBookings} hotel stays).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
