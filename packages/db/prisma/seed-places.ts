/**
 * Places seed (WP-05): destinations, their non-beach spots, emergency contacts
 * and a sample alert, plus the provider and desk accounts of WP-04.
 *
 * Beach spots of Cox's Bazar are created next to their beach points in seed.ts,
 * because a beach point needs its spot. Everything here is synthetic demo data;
 * the only phone number is the national emergency number 999.
 */
import type { PrismaClient } from '../src/index';

export const COXS_BAZAR_ID = '30000000-0000-4000-8000-000000000001';

interface SpotSeed {
  slug: string;
  name: string;
  nameBn: string;
  kind: 'FOREST' | 'RIVER' | 'LAKE' | 'WATERFALL' | 'OTHER';
  description: string;
  latitude: number;
  longitude: number;
}

interface DestinationSeed {
  id: string;
  slug: string;
  name: string;
  nameBn: string;
  tagline: string;
  accent: 'SEA' | 'FOREST' | 'LAKE';
  latitude: number;
  longitude: number;
  mapZoom: number;
  sortOrder: number;
  content: { about: string; bestTime: string; gettingThere: string };
  spots: SpotSeed[];
}

export const DESTINATIONS: DestinationSeed[] = [
  {
    id: COXS_BAZAR_ID,
    slug: 'coxs-bazar',
    name: "Cox's Bazar",
    nameBn: 'কক্সবাজার',
    tagline: 'A long sandy sea beach on the Bay of Bengal',
    accent: 'SEA',
    latitude: 21.385,
    longitude: 91.995,
    mapZoom: 13,
    sortOrder: 1,
    content: {
      about:
        "Cox's Bazar is a coastal town in south-east Bangladesh with an unbroken sandy beach that runs south towards Teknaf. Laboni, Sugandha and Kolatoli are the busy town beaches; Himchari and Inani are quieter and further south.",
      bestTime:
        'November to March is dry and mild and the busiest season. The monsoon months bring rough sea and heavy rain.',
      gettingThere:
        "Flights from Dhaka land at Cox's Bazar airport. Long-distance buses and trains also run from Dhaka and Chattogram.",
    },
    spots: [],
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    slug: 'sylhet',
    name: 'Sylhet',
    nameBn: 'সিলেট',
    tagline: 'Tea gardens, swamp forest and clear hill rivers',
    accent: 'FOREST',
    latitude: 25.05,
    longitude: 91.93,
    mapZoom: 11,
    sortOrder: 2,
    content: {
      about:
        'Sylhet in north-east Bangladesh is known for its tea estates and for the rivers that come down from the hills along the border.',
      bestTime:
        'The swamp forest is flooded and boatable in the monsoon and just after it; the dry months suit tea-garden walks.',
      gettingThere:
        'Flights, trains and buses run from Dhaka to Sylhet town; the spots are a drive from there.',
    },
    spots: [
      {
        slug: 'ratargul',
        name: 'Ratargul Swamp Forest',
        nameBn: 'রাতারগুল জলাবন',
        kind: 'FOREST',
        description: 'A freshwater swamp forest explored by small boat when the water is high.',
        latitude: 25.0097,
        longitude: 91.9311,
      },
      {
        slug: 'jaflong',
        name: 'Jaflong',
        nameBn: 'জাফলং',
        kind: 'RIVER',
        description: 'Stony riverbanks beneath the hills at the border.',
        latitude: 25.1636,
        longitude: 92.0175,
      },
      {
        slug: 'bichanakandi',
        name: 'Bichanakandi',
        nameBn: 'বিছানাকান্দি',
        kind: 'RIVER',
        description: 'A shallow river of stones where the hill streams meet.',
        latitude: 25.1806,
        longitude: 91.8919,
      },
    ],
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    slug: 'rangamati',
    name: 'Rangamati',
    nameBn: 'রাঙামাটি',
    tagline: 'Hills around the wide waters of Kaptai Lake',
    accent: 'LAKE',
    latitude: 22.65,
    longitude: 92.2,
    mapZoom: 11,
    sortOrder: 3,
    content: {
      about: 'Rangamati sits among the Chittagong Hill Tracts on the shores of Kaptai Lake.',
      bestTime:
        'The cooler dry months are the most comfortable; waterfalls run fullest after the monsoon.',
      gettingThere: 'Buses run from Chattogram; boats link places around the lake.',
    },
    spots: [
      {
        slug: 'kaptai-lake',
        name: 'Kaptai Lake',
        nameBn: 'কাপ্তাই হ্রদ',
        kind: 'LAKE',
        description: 'A large reservoir among the hills, explored by boat.',
        latitude: 22.6,
        longitude: 92.21,
      },
      {
        slug: 'hanging-bridge',
        name: 'Hanging Bridge',
        nameBn: 'ঝুলন্ত সেতু',
        kind: 'OTHER',
        description: 'A footbridge over an arm of the lake.',
        latitude: 22.6386,
        longitude: 92.1867,
      },
      {
        slug: 'shuvolong',
        name: 'Shuvolong Waterfall',
        nameBn: 'শুভলং ঝরনা',
        kind: 'WATERFALL',
        description: 'A waterfall reached by boat across the lake.',
        latitude: 22.6847,
        longitude: 92.2683,
      },
    ],
  },
];

/** Tips for every Cox's Bazar beach spot. Plain guidance, not rules or authority. */
export const BEACH_SPOT_CONTENT = {
  rules: [],
  tips: [
    'Late afternoon and sunset are the busiest hours.',
    'Book sunbeds in the app and show the QR ticket at the bed.',
    'Bring water and sun protection; shade is mostly under the beach umbrellas.',
  ],
};

export const STAFF_USERS = [
  {
    id: '00000000-0000-4000-8000-000000000005',
    name: 'Karim Uddin',
    email: 'karim@coastline.demo',
    role: 'PROVIDER' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    name: 'Shila Akter',
    email: 'shila@coastline.demo',
    role: 'PROVIDER' as const,
  },
  {
    id: '00000000-0000-4000-8000-000000000007',
    name: 'Rana Desk',
    email: 'rana@coastline.demo',
    role: 'DESK' as const,
  },
];

export const PROVIDERS = [
  {
    id: '50000000-0000-4000-8000-000000000001',
    name: 'Sea Breeze Dining',
    destinationId: COXS_BAZAR_ID,
    members: [
      { userId: '00000000-0000-4000-8000-000000000005', role: 'OWNER' as const },
      { userId: '00000000-0000-4000-8000-000000000006', role: 'STAFF' as const },
    ],
    venueCodes: ['SUG-SEAFOOD', 'KOL-KITKOT'],
  },
];

export const DESK_ASSIGNMENTS = [
  { userId: '00000000-0000-4000-8000-000000000007', destinationId: COXS_BAZAR_ID },
];

/** Destinations, non-beach spots, the national emergency number and a sample alert. */
export async function seedPlaces(prisma: PrismaClient): Promise<void> {
  for (const destination of DESTINATIONS) {
    const data = {
      slug: destination.slug,
      name: destination.name,
      nameBn: destination.nameBn,
      tagline: destination.tagline,
      accent: destination.accent,
      latitude: destination.latitude,
      longitude: destination.longitude,
      mapZoom: destination.mapZoom,
      sortOrder: destination.sortOrder,
      content: destination.content,
      isActive: true,
    };
    await prisma.destination.upsert({
      where: { id: destination.id },
      update: data,
      create: { id: destination.id, ...data },
    });

    for (const [index, spot] of destination.spots.entries()) {
      const spotData = {
        name: spot.name,
        nameBn: spot.nameBn,
        kind: spot.kind,
        description: spot.description,
        latitude: spot.latitude,
        longitude: spot.longitude,
        sortOrder: index + 1,
        isActive: true,
      };
      await prisma.spot.upsert({
        where: { destinationId_slug: { destinationId: destination.id, slug: spot.slug } },
        update: spotData,
        create: { destinationId: destination.id, slug: spot.slug, ...spotData },
      });
    }

    // One national number per destination; local numbers are entered by the operator.
    await prisma.emergencyContact.deleteMany({
      where: { destinationId: destination.id, kind: 'NATIONAL' },
    });
    await prisma.emergencyContact.create({
      data: {
        destinationId: destination.id,
        label: 'National emergency service',
        labelBn: 'জাতীয় জরুরি সেবা',
        phone: '999',
        kind: 'NATIONAL',
        sortOrder: 0,
      },
    });
  }

  // A sample notice so the alert banner has something to show in the demo.
  await prisma.spotAlert.deleteMany({ where: { destinationId: COXS_BAZAR_ID, kind: 'NOTICE' } });
  await prisma.spotAlert.create({
    data: {
      destinationId: COXS_BAZAR_ID,
      kind: 'NOTICE',
      severity: 'INFO',
      title: 'Busy season: sunbeds fill up by midday on weekends',
      body: 'Book ahead in the app to be sure of a bed.',
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });
}

/** Provider and desk accounts, membership and assignments (WP-04). */
export async function seedWorkspaces(prisma: PrismaClient): Promise<void> {
  for (const user of STAFF_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, email: user.email, role: user.role, isActive: true },
      create: user,
    });
  }
  for (const provider of PROVIDERS) {
    await prisma.provider.upsert({
      where: { id: provider.id },
      update: { name: provider.name, destinationId: provider.destinationId, status: 'APPROVED' },
      create: {
        id: provider.id,
        name: provider.name,
        destinationId: provider.destinationId,
        status: 'APPROVED',
      },
    });
    for (const member of provider.members) {
      await prisma.providerMember.upsert({
        where: { providerId_userId: { providerId: provider.id, userId: member.userId } },
        update: { role: member.role },
        create: { providerId: provider.id, userId: member.userId, role: member.role },
      });
    }
    await prisma.diningVenue.updateMany({
      where: { code: { in: provider.venueCodes } },
      data: { providerId: provider.id },
    });
  }
  for (const assignment of DESK_ASSIGNMENTS) {
    await prisma.deskAssignment.upsert({
      where: { userId_destinationId: assignment },
      update: {},
      create: assignment,
    });
  }
}
