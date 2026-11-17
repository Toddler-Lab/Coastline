import { Injectable } from '@nestjs/common';
import type { ProviderMembershipDto, ProviderMemberRole } from '@coastline/api-contracts';
import type { Actor } from '../../common/auth/actor';
import { forbidden, notFound } from '../../common/errors/api-errors';
import { PrismaService } from '../../common/prisma/prisma.service';

/** `null` means unrestricted (ADMIN). */
export type Scope = string[] | null;

/**
 * Workspace scope (WP-04). A provider member acts only on the venues of the
 * providers they belong to; desk staff act only inside their destinations.
 * Scope always comes from `provider_members` and `desk_assignments`, never from
 * request input. Records outside scope answer 404, like records that do not
 * exist.
 */
@Injectable()
export class WorkspaceScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async memberships(userId: string): Promise<ProviderMembershipDto[]> {
    const rows = await this.prisma.providerMember.findMany({
      where: { userId, provider: { status: 'APPROVED' } },
      include: { provider: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => ({
      providerId: row.provider.id,
      name: row.provider.name,
      role: row.role,
    }));
  }

  async deskDestinationSlugs(userId: string): Promise<string[]> {
    const rows = await this.prisma.deskAssignment.findMany({
      where: { userId, destination: { isActive: true } },
      select: { destination: { select: { slug: true } } },
    });
    return rows.map((row) => row.destination.slug);
  }

  /** Venue ids the actor may manage. */
  async venueScope(actor: Actor): Promise<Scope> {
    if (actor.role === 'ADMIN') return null;
    if (actor.role !== 'PROVIDER') return [];
    const venues = await this.prisma.diningVenue.findMany({
      where: { provider: { status: 'APPROVED', members: { some: { userId: actor.id } } } },
      select: { id: true },
    });
    return venues.map((venue) => venue.id);
  }

  /** The actor's member role at the provider that runs this venue, or ADMIN. */
  async venueRole(actor: Actor, venueId: string): Promise<ProviderMemberRole | 'ADMIN'> {
    if (actor.role === 'ADMIN') {
      return 'ADMIN';
    }
    const venue = await this.prisma.diningVenue.findUnique({
      where: { id: venueId },
      select: {
        provider: {
          select: {
            status: true,
            members: { where: { userId: actor.id }, select: { role: true } },
          },
        },
      },
    });
    const member = venue?.provider?.status === 'APPROVED' ? venue.provider.members[0] : undefined;
    if (actor.role !== 'PROVIDER' || !member) {
      throw notFound('Not found.');
    }
    return member.role;
  }

  /** Throws 404 unless the venue is in scope; 403 when an owner is required and the actor is staff. */
  async assertVenue(
    actor: Actor,
    venueId: string,
    options: { ownerOnly?: string } = {},
  ): Promise<void> {
    const role = await this.venueRole(actor, venueId);
    if (options.ownerOnly && role === 'STAFF') {
      throw forbidden(options.ownerOnly);
    }
  }

  async venueIdByCode(code: string): Promise<string> {
    const venue = await this.prisma.diningVenue.findUnique({
      where: { code: code.toUpperCase() },
      select: { id: true },
    });
    if (!venue) throw notFound('Dining venue not found.');
    return venue.id;
  }

  /** Destination ids the actor may work in at a desk. */
  async deskScope(actor: Actor): Promise<Scope> {
    if (actor.role === 'ADMIN') return null;
    if (actor.role !== 'DESK') return [];
    const rows = await this.prisma.deskAssignment.findMany({
      where: { userId: actor.id },
      select: { destinationId: true },
    });
    return rows.map((row) => row.destinationId);
  }

  /** Destination of a sunbed or hotel booking, from its beach point or hotel. */
  async orderDestinationId(publicRef: string): Promise<string | null> {
    const order = await this.prisma.order.findFirst({
      where: { publicRef: { equals: publicRef, mode: 'insensitive' } },
      select: {
        items: {
          take: 1,
          select: {
            sunbed: {
              select: { beachPoint: { select: { spot: { select: { destinationId: true } } } } },
            },
          },
        },
        hotelBookings: { take: 1, select: { hotel: { select: { destinationId: true } } } },
      },
    });
    if (!order) return null;
    return (
      order.items[0]?.sunbed.beachPoint.spot.destinationId ??
      order.hotelBookings[0]?.hotel.destinationId ??
      null
    );
  }

  async reservationDestinationId(publicRef: string): Promise<string | null> {
    const reservation = await this.prisma.tableReservation.findFirst({
      where: { publicRef: { equals: publicRef, mode: 'insensitive' } },
      select: { venue: { select: { destinationId: true } } },
    });
    return reservation?.venue.destinationId ?? null;
  }

  async venueCodes(scope: Scope): Promise<Set<string> | null> {
    if (scope === null) return null;
    const venues = await this.prisma.diningVenue.findMany({
      where: { id: { in: scope } },
      select: { code: true },
    });
    return new Set(venues.map((venue) => venue.code));
  }

  async reservationVenueId(publicRef: string): Promise<string> {
    const row = await this.prisma.tableReservation.findFirst({
      where: { publicRef: { equals: publicRef, mode: 'insensitive' } },
      select: { venueId: true },
    });
    if (!row) throw notFound(`Reservation ${publicRef} was not found.`);
    return row.venueId;
  }

  async foodOrderVenueId(publicRef: string): Promise<string> {
    const row = await this.prisma.foodOrder.findFirst({
      where: { publicRef: { equals: publicRef, mode: 'insensitive' } },
      select: { venueId: true },
    });
    if (!row) throw notFound(`Food order ${publicRef} was not found.`);
    return row.venueId;
  }

  async menuItemVenueId(id: string): Promise<string> {
    const row = /^[0-9a-f-]{36}$/i.test(id)
      ? await this.prisma.menuItem.findUnique({ where: { id }, select: { venueId: true } })
      : null;
    if (!row) throw notFound('Menu item not found.');
    return row.venueId;
  }

  /** Keeps the orders whose beach point or hotel lies in the scope's destinations. */
  async filterOrders<
    T extends {
      items: Array<{ beachPointCode: string }>;
      hotelBookings?: Array<{ hotelId: string }>;
    },
  >(scope: Scope, orders: T[]): Promise<T[]> {
    if (scope === null) return orders;
    const [points, hotels] = await Promise.all([
      this.prisma.beachPoint.findMany({
        select: { code: true, spot: { select: { destinationId: true } } },
      }),
      this.prisma.hotel.findMany({ where: { destinationId: { in: scope } }, select: { id: true } }),
    ]);
    const pointCodes = new Set(
      points.filter((point) => scope.includes(point.spot.destinationId)).map((point) => point.code),
    );
    const hotelIds = new Set(hotels.map((hotel) => hotel.id));
    return orders.filter(
      (order) =>
        order.items.some((item) => pointCodes.has(item.beachPointCode)) ||
        (order.hotelBookings ?? []).some((booking) => hotelIds.has(booking.hotelId)),
    );
  }

  inScope(scope: Scope, id: string | null): boolean {
    return scope === null || (id !== null && scope.includes(id));
  }
}
