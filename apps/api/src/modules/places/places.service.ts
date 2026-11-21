import { Injectable } from '@nestjs/common';
import type {
  DestinationContentDto,
  DestinationDetailDto,
  DestinationSummaryDto,
  EmergencyContactDto,
  ServiceCountsDto,
  SpotAlertDto,
  SpotAlertSeverity,
  SpotContentDto,
  SpotDetailDto,
  SpotSummaryDto,
} from '@coastline/api-contracts';
import type { Destination, Prisma, Spot } from '@coastline/db';
import { notFound } from '../../common/errors/api-errors';
import { PrismaService } from '../../common/prisma/prisma.service';

const SEVERITY_RANK: Record<SpotAlertSeverity, number> = { INFO: 0, CAUTION: 1, DANGER: 2 };

const EMPTY_COUNTS: ServiceCountsDto = { stay: 0, food: 0, sunbeds: 0 };

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

function record(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function destinationContent(value: Prisma.JsonValue): DestinationContentDto {
  const content = record(value);
  return {
    about: text(content.about),
    bestTime: text(content.bestTime),
    gettingThere: text(content.gettingThere),
  };
}

export function resolveDestinationSlug(slug: string): string {
  const normalized = (slug ?? '').trim().toLowerCase();
  if (normalized === 'coxs') {
    return 'coxs-bazar';
  }
  return slug;
}

export function resolveSpotSlug(destSlug: string, spotSlug: string): string {
  const normDest = resolveDestinationSlug(destSlug);
  const normSpot = (spotSlug ?? '').trim().toLowerCase();

  if (normDest === 'coxs-bazar') {
    const coxsAliases: Record<string, string> = {
      inani: 'inani-coral-beach',
      laboni: 'laboni-beach',
      sugandha: 'sugandha-beach',
      kolatoli: 'kolatoli-beach',
      teknaf: 'teknaf-beach',
      saintmartin: 'inani-coral-beach',
      marine: 'himchari',
    };
    if (coxsAliases[normSpot]) {
      return coxsAliases[normSpot];
    }
  }

  if (normDest === 'rangamati') {
    const rangamatiAliases: Record<string, string> = {
      kaptai: 'kaptai-lake',
      hanging: 'hanging-bridge',
      rajban: 'rajban-vihara',
    };
    if (rangamatiAliases[normSpot]) {
      return rangamatiAliases[normSpot];
    }
  }

  return spotSlug;
}

export function spotContent(value: Prisma.JsonValue): SpotContentDto {
  const content = record(value);
  return { rules: strings(content.rules), tips: strings(content.tips) };
}

function openHours(value: Prisma.JsonValue | null): SpotSummaryDto['openHours'] {
  const hours = record(value);
  return typeof hours.open === 'number' && typeof hours.close === 'number'
    ? { open: hours.open, close: hours.close }
    : null;
}

/** Alerts whose window contains `now`. */
function activeAlertWhere(now: Date): Prisma.SpotAlertWhereInput {
  return { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] };
}

type AlertRow = Prisma.SpotAlertGetPayload<{ include: { spot: { select: { slug: true } } } }>;

function serializeAlert(alert: AlertRow): SpotAlertDto {
  return {
    id: alert.id,
    kind: alert.kind,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    spotSlug: alert.spot?.slug ?? null,
    startsAt: alert.startsAt.toISOString(),
    endsAt: alert.endsAt?.toISOString() ?? null,
  };
}

/** Most severe first, then newest. */
function sortAlerts(alerts: SpotAlertDto[]): SpotAlertDto[] {
  return [...alerts].sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.startsAt.localeCompare(a.startsAt),
  );
}

/**
 * Public places: destinations, spots, emergency contacts and alerts (WP-05).
 * Only active destinations and spots are visible; hidden ones answer 404.
 * Service counts are derived from the engines' active rows so a tile appears
 * only when something can be booked there.
 */
@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async listDestinations(now: Date = new Date()): Promise<DestinationSummaryDto[]> {
    const destinations = await this.prisma.destination.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const ids = destinations.map((destination) => destination.id);
    const [counts, spotCounts, alerts] = await Promise.all([
      this.countsByDestination(ids),
      this.prisma.spot.groupBy({
        by: ['destinationId'],
        where: { destinationId: { in: ids }, isActive: true },
        _count: { _all: true },
      }),
      this.prisma.spotAlert.findMany({
        where: {
          destinationId: { in: ids },
          AND: [activeAlertWhere(now), { OR: [{ spotId: null }, { spot: { isActive: true } }] }],
        },
        include: { spot: { select: { slug: true } } },
      }),
    ]);
    const spotsBy = new Map(spotCounts.map((row) => [row.destinationId, row._count._all]));
    return destinations.map((destination) => {
      const own = sortAlerts(
        alerts.filter((alert) => alert.destinationId === destination.id).map(serializeAlert),
      );
      return this.summary(
        destination,
        counts.get(destination.id) ?? EMPTY_COUNTS,
        spotsBy.get(destination.id) ?? 0,
        own[0] ?? null,
      );
    });
  }

  async getDestination(slug: string, now: Date = new Date()): Promise<DestinationDetailDto> {
    const destination = await this.findDestination(slug);
    const [counts, spots, contacts, alerts] = await Promise.all([
      this.countsByDestination([destination.id]),
      this.prisma.spot.findMany({
        where: { destinationId: destination.id, isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { beachPoint: { select: { code: true, isActive: true } } },
      }),
      this.contacts(destination.id),
      this.alerts(destination.id, null, now),
    ]);
    const spotCounts = await this.countsBySpot(spots.map((spot) => spot.id));
    return {
      ...this.summary(
        destination,
        counts.get(destination.id) ?? EMPTY_COUNTS,
        spots.length,
        alerts[0] ?? null,
      ),
      description: destination.description,
      content: destinationContent(destination.content),
      spots: spots.map((spot) => this.spotSummary(spot, spotCounts.get(spot.id) ?? EMPTY_COUNTS)),
      emergencyContacts: contacts,
      alerts,
    };
  }

  async getSpot(
    destinationSlug: string,
    spotSlug: string,
    now: Date = new Date(),
  ): Promise<SpotDetailDto> {
    const destination = await this.findDestination(destinationSlug);
    const resolvedSpotSlug = resolveSpotSlug(destination.slug, spotSlug);
    let spot = await this.prisma.spot.findFirst({
      where: { destinationId: destination.id, slug: resolvedSpotSlug, isActive: true },
      include: { beachPoint: { select: { code: true, isActive: true } } },
    });

    if (!spot && spotSlug !== resolvedSpotSlug) {
      spot = await this.prisma.spot.findFirst({
        where: { destinationId: destination.id, slug: spotSlug, isActive: true },
        include: { beachPoint: { select: { code: true, isActive: true } } },
      });
    }

    if (!spot) {
      const secondaryFallbacks: Record<string, string[]> = {
        'inani-coral-beach': ['inani-beach', 'inani'],
        himchari: ['inani-coral-beach', 'inani-beach'],
      };
      const alternatives = secondaryFallbacks[resolvedSpotSlug] ?? [];
      for (const altSlug of alternatives) {
        spot = await this.prisma.spot.findFirst({
          where: { destinationId: destination.id, slug: altSlug, isActive: true },
          include: { beachPoint: { select: { code: true, isActive: true } } },
        });
        if (spot) break;
      }
    }

    if (!spot && (spotSlug === 'saintmartin' || spotSlug === 'marine')) {
      spot = await this.prisma.spot.findFirst({
        where: {
          destinationId: destination.id,
          isActive: true,
          kind: 'BEACH',
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { beachPoint: { select: { code: true, isActive: true } } },
      });
    }

    if (!spot) {
      throw notFound('Spot not found.');
    }
    const [counts, contacts, alerts] = await Promise.all([
      this.countsBySpot([spot.id]),
      this.contacts(destination.id),
      this.alerts(destination.id, spot.id, now),
    ]);
    return {
      ...this.spotSummary(spot, counts.get(spot.id) ?? EMPTY_COUNTS),
      destination: { slug: destination.slug, name: destination.name, accent: destination.accent },
      content: spotContent(spot.content),
      alerts,
      emergencyContacts: contacts,
    };
  }

  private async findDestination(slug: string): Promise<Destination> {
    const resolvedSlug = resolveDestinationSlug(slug);
    const destination = await this.prisma.destination.findFirst({
      where: { slug: resolvedSlug, isActive: true },
    });
    if (!destination) {
      throw notFound('Destination not found.');
    }
    return destination;
  }

  private summary(
    destination: Destination,
    services: ServiceCountsDto,
    spotCount: number,
    topAlert: SpotAlertDto | null,
  ): DestinationSummaryDto {
    return {
      slug: destination.slug,
      name: destination.name,
      nameBn: destination.nameBn,
      tagline: destination.tagline,
      accent: destination.accent,
      latitude: destination.latitude,
      longitude: destination.longitude,
      mapZoom: destination.mapZoom,
      spotCount,
      services,
      topAlert,
    };
  }

  private spotSummary(
    spot: Spot & { beachPoint: { code: string; isActive: boolean } | null },
    services: ServiceCountsDto,
  ): SpotSummaryDto {
    return {
      slug: spot.slug,
      name: spot.name,
      nameBn: spot.nameBn,
      kind: spot.kind,
      description: spot.description,
      latitude: spot.latitude,
      longitude: spot.longitude,
      openHours: openHours(spot.openHours),
      entryInfo: spot.entryInfo,
      beachPointCode: spot.beachPoint?.isActive ? spot.beachPoint.code : null,
      services,
    };
  }

  private async contacts(destinationId: string): Promise<EmergencyContactDto[]> {
    const rows = await this.prisma.emergencyContact.findMany({
      where: { destinationId },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
    return rows.map((row) => ({
      label: row.label,
      labelBn: row.labelBn,
      phone: row.phone,
      kind: row.kind,
    }));
  }

  /** Destination-wide alerts, plus the spot's own when `spotId` is given. */
  private async alerts(
    destinationId: string,
    spotId: string | null,
    now: Date,
  ): Promise<SpotAlertDto[]> {
    const rows = await this.prisma.spotAlert.findMany({
      where: {
        destinationId,
        AND: [
          activeAlertWhere(now),
          spotId
            ? { OR: [{ spotId: null }, { spotId }] }
            : { OR: [{ spotId: null }, { spot: { isActive: true } }] },
        ],
      },
      include: { spot: { select: { slug: true } } },
    });
    return sortAlerts(rows.map(serializeAlert));
  }

  private async countsByDestination(ids: string[]): Promise<Map<string, ServiceCountsDto>> {
    const [hotels, venues, points] = await Promise.all([
      this.prisma.hotel.groupBy({
        by: ['destinationId'],
        where: { destinationId: { in: ids }, isActive: true },
        _count: { _all: true },
      }),
      this.prisma.diningVenue.groupBy({
        by: ['destinationId'],
        where: { destinationId: { in: ids }, isActive: true },
        _count: { _all: true },
      }),
      this.prisma.beachPoint.findMany({
        where: {
          isActive: true,
          spot: { destinationId: { in: ids }, isActive: true },
          sunbeds: { some: { status: { not: 'RETIRED' } } },
        },
        select: { spot: { select: { destinationId: true } } },
      }),
    ]);
    const result = new Map<string, ServiceCountsDto>();
    const entry = (id: string) => {
      const existing = result.get(id) ?? { ...EMPTY_COUNTS };
      result.set(id, existing);
      return existing;
    };
    for (const row of hotels) entry(row.destinationId).stay = row._count._all;
    for (const row of venues) entry(row.destinationId).food = row._count._all;
    for (const row of points) entry(row.spot.destinationId).sunbeds += 1;
    return result;
  }

  private async countsBySpot(ids: string[]): Promise<Map<string, ServiceCountsDto>> {
    const [hotels, venues, points] = await Promise.all([
      this.prisma.hotel.groupBy({
        by: ['spotId'],
        where: { spotId: { in: ids }, isActive: true },
        _count: { _all: true },
      }),
      this.prisma.diningVenue.groupBy({
        by: ['spotId'],
        where: { spotId: { in: ids }, isActive: true },
        _count: { _all: true },
      }),
      this.prisma.beachPoint.findMany({
        where: {
          spotId: { in: ids },
          isActive: true,
          sunbeds: { some: { status: { not: 'RETIRED' } } },
        },
        select: { spotId: true },
      }),
    ]);
    const result = new Map<string, ServiceCountsDto>();
    const entry = (id: string) => {
      const existing = result.get(id) ?? { ...EMPTY_COUNTS };
      result.set(id, existing);
      return existing;
    };
    for (const row of hotels) if (row.spotId) entry(row.spotId).stay = row._count._all;
    for (const row of venues) if (row.spotId) entry(row.spotId).food = row._count._all;
    for (const row of points) entry(row.spotId).sunbeds = 1;
    return result;
  }
}
