import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../catalogue/testing/test-bootstrap';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TEST_USERS, createTestApp, testDbReady } from '../../common/testing/integration-fixture';
import { reseedTestDatabase } from '../catalogue/testing/test-database';

const describeDb = testDbReady() ? describe : describe.skip;
const TIMEOUT = 30_000;

/** Database-level guarantees the dining streams rely on. */
describeDb('dining foundation (schema guarantees)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  }, TIMEOUT);

  beforeEach(async () => {
    await reseedTestDatabase(prisma);
  }, TIMEOUT);

  afterAll(async () => {
    await app?.close();
  }, TIMEOUT);

  async function createVenue(code: string) {
    return prisma.diningVenue.create({
      data: { code, name: `Venue ${code}`, kind: 'RESTAURANT', openHour: 10, closeHour: 22 },
    });
  }

  async function createReservation(venueId: string, tableId: string, ref: string) {
    return prisma.tableReservation.create({
      data: {
        publicRef: ref,
        touristId: TEST_USERS.tourist,
        venueId,
        tableId,
        venueCode: 'V1',
        venueName: 'Venue V1',
        tableCode: 'V1-T01',
        partySize: 2,
        startAt: new Date('2026-12-01T04:00:00.000Z'),
        endAt: new Date('2026-12-01T05:00:00.000Z'),
      },
    });
  }

  it('rejects a menu item whose category belongs to a different venue', async () => {
    const a = await createVenue('V1');
    const b = await createVenue('V2');
    const category = await prisma.menuCategory.create({ data: { venueId: a.id, name: 'Mains' } });

    await expect(
      prisma.menuItem.create({
        data: { venueId: b.id, categoryId: category.id, name: 'Rice', priceMinor: 4000 },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.menuItem.create({
        data: { venueId: a.id, categoryId: category.id, name: 'Rice', priceMinor: 4000 },
      }),
    ).resolves.toMatchObject({ name: 'Rice' });
  });

  it('rejects non-positive menu prices', async () => {
    const venue = await createVenue('V1');
    const category = await prisma.menuCategory.create({
      data: { venueId: venue.id, name: 'Mains' },
    });
    await expect(
      prisma.menuItem.create({
        data: { venueId: venue.id, categoryId: category.id, name: 'Free', priceMinor: 0 },
      }),
    ).rejects.toThrow();
  });

  it('prevents two active reservations from holding the same table-hour, and frees it on release', async () => {
    const venue = await createVenue('V1');
    const table = await prisma.diningTable.create({
      data: { venueId: venue.id, code: 'V1-T01', seats: 4 },
    });
    const first = await createReservation(venue.id, table.id, 'DR-TEST-0001');
    const second = await createReservation(venue.id, table.id, 'DR-TEST-0002');
    const slotStart = new Date('2026-12-01T04:00:00.000Z');

    await prisma.tableSlot.create({
      data: { reservationId: first.id, tableId: table.id, slotStart },
    });
    await expect(
      prisma.tableSlot.create({ data: { reservationId: second.id, tableId: table.id, slotStart } }),
    ).rejects.toMatchObject({ code: 'P2002' });

    await prisma.tableSlot.updateMany({
      where: { reservationId: first.id },
      data: { isActive: false },
    });
    await expect(
      prisma.tableSlot.create({ data: { reservationId: second.id, tableId: table.id, slotStart } }),
    ).resolves.toMatchObject({ isActive: true });
  });

  it('requires every payment to have exactly one parent', async () => {
    const venue = await createVenue('V1');
    const table = await prisma.diningTable.create({
      data: { venueId: venue.id, code: 'V1-T01', seats: 4 },
    });
    const reservation = await createReservation(venue.id, table.id, 'DR-TEST-0003');
    const order = await prisma.order.create({
      data: {
        publicRef: 'BK-TEST-0001',
        touristId: TEST_USERS.tourist,
        subtotalMinor: 100,
        totalMinor: 100,
      },
    });

    await expect(
      prisma.payment.create({ data: { type: 'CHARGE', amountMinor: 100 } }),
    ).rejects.toThrow();
    await expect(
      prisma.payment.create({
        data: {
          type: 'CHARGE',
          amountMinor: 100,
          orderId: order.id,
          reservationId: reservation.id,
        },
      }),
    ).rejects.toThrow();
    await expect(
      prisma.payment.create({
        data: { type: 'CHARGE', amountMinor: 100, reservationId: reservation.id },
      }),
    ).resolves.toMatchObject({ reservationId: reservation.id, orderId: null });
    await expect(
      prisma.payment.create({ data: { type: 'CHARGE', amountMinor: 100, orderId: order.id } }),
    ).resolves.toMatchObject({ orderId: order.id });
  });
});
