'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Waves,
  Sunset,
  Compass,
  ShieldCheck,
  Hotel,
  Utensils,
  Camera,
  Umbrella,
  ChevronRight,
  Phone,
  MapPin,
  Car,
  AlertTriangle,
  Info,
  Clock,
  Bus,
  Plane,
  LifeBuoy,
} from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { InventoryResult } from '@/lib/places-server';
import { CardRow, CardRowItem } from '@/components/patterns/hub';
import { HotelCard, VenueCard } from '@/components/patterns/cards';
import {
  DRONE_DESTINATIONS,
  type DroneDestination,
  type DroneSpot,
} from '@/lib/drone-landing-data';
import { useLanguage } from '@/components/patterns/language';
import { FlyTransitionListener } from './fly-transition';
import { MediaCreditsList } from '@/components/patterns/media-credits';

const SVG_ICONS: Record<string, React.ReactNode> = {
  stay: (
    <>
      <path d="M3 20V8l9-5 9 5v12" />
      <path d="M3 14h18M8 20v-6M16 20v-6" />
    </>
  ),
  food: (
    <>
      <path d="M7 3v8a3 3 0 0 0 3 3v7M10 3v6M4 3v6a3 3 0 0 0 3 3" />
      <path d="M17 21V3c-2 1-3 3.5-3 7s1 4 3 4" />
    </>
  ),
  sunbed: (
    <>
      <path d="M12 3a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9zM12 12v9M8 21h8" />
    </>
  ),
  ride: (
    <>
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M6 9l2-4h8l2 4" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>
  ),
  boat: (
    <>
      <path d="M3 15l2 5h14l2-5H3zM12 3v12M12 4l6 8h-6" />
    </>
  ),
  tour: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M13 6v12" strokeDasharray="2 2" />
    </>
  ),
  guide: (
    <>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  camera: (
    <>
      <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  atm: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  pharmacy: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  wc: (
    <>
      <circle cx="8" cy="5" r="2" />
      <circle cx="16" cy="5" r="2" />
      <path d="M8 8v13M5 10h6M16 8l-3 8h6l-3-8v13" />
    </>
  ),
  prayer: (
    <>
      <path d="M4 21V11l8-7 8 7v10z" />
      <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
    </>
  ),
  hospital: (
    <>
      <path d="M3 21V7l9-4 9 4v14z" />
      <path d="M12 9v6M9 12h6" />
    </>
  ),
  phone: (
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  ),
  lost: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M11 8v3M11 14h.01" />
    </>
  ),
  report: <path d="M4 21V4h12l-2 4 2 4H4" />,
  alert: <path d="M12 3 2 21h20zM12 10v5M12 18h.01" />,
  pin: (
    <>
      <path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

function renderSvg(name: string, extra = '') {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={extra}
    >
      {SVG_ICONS[name] || <circle cx="12" cy="12" r="10" />}
    </svg>
  );
}

// Spot character and zone groupings for Cox's Bazar coastline
const SPOT_ZONE_META: Record<
  string,
  { zone: string; zoneBn: string; note: string; noteBn: string; vibe: string; vibeBn: string }
> = {
  'laboni-beach': {
    zone: 'Town Beach · North',
    zoneBn: 'শহরের সৈকত · উত্তর',
    note: 'Historic shell market, calm shoreline & morning sunrise walks',
    noteBn: 'ঐতিহ্যবাহী ঝিনুক মার্কেট, শান্ত সৈকত ও সকালের সূর্যোদয় হাঁটাচলা',
    vibe: 'Historic & Calm',
    vibeBn: 'ঐতিহ্যবাহী ও শান্ত',
  },
  'sugandha-beach': {
    zone: 'Town Beach · Central Hub',
    zoneBn: 'শহরের সৈকত · কেন্দ্রস্থল',
    note: 'Evening seafood street food, certified lifeguards & direct road access',
    noteBn: 'সন্ধ্যার তাজা সিফুড স্টল, সার্টিফাইড লাইফগার্ড ও প্রধান সড়ক সংযোগ',
    vibe: 'Lively Seafood Hub',
    vibeBn: 'কোলাহলপূর্ণ সিফুড কেন্দ্র',
  },
  'kolatoli-beach': {
    zone: 'Town Beach · Hotel Strip',
    zoneBn: 'শহরের সৈকত · হোটেল এলাকা',
    note: 'Main lifeguard tower, prime front-row sunbed strip & sunset vantage',
    noteBn: 'প্রধান লাইফগার্ড টাওয়ার, দীর্ঘ সানবেড লাইন ও সেরা সূর্যাস্ত দর্শন',
    vibe: 'Sunset & Sunbeds',
    vibeBn: 'সূর্যাস্ত ও সানবেড',
  },
  himchari: {
    zone: 'Marine Drive · 8 km South',
    zoneBn: 'মেরিন ড্রাইভ · ৮ কিমি দক্ষিণ',
    note: 'Hilltop sea viewpoint, seasonal waterfall & parasailing adventures',
    noteBn: 'পাহাড়চূড়া থেকে সাগর দর্শন, মৌসুমি ঝরনা ও প্যারাসেইলিং অ্যাডভেঞ্চার',
    vibe: 'Hills & Adventure',
    vibeBn: 'পাহাড় ও রোমাঞ্চ',
  },
  'inani-beach': {
    zone: 'South Coast · 24 km South',
    zoneBn: 'দক্ষিণ উপকূল · ২৪ কিমি দক্ষিণ',
    note: 'Unique coral stone shoreline, crystal clear waters & quiet luxury resorts',
    noteBn: 'প্রবাল পাথুরে সৈকত, স্ফটিক স্বচ্ছ জল ও শান্ত প্রকৃতির রিসোর্ট',
    vibe: 'Coral & Serenity',
    vibeBn: 'প্রবাল পাথর ও নির্জনতা',
  },
};

export interface DestinationDroneViewProps {
  destination: DestinationDetailDto;
  inventory: InventoryResult;
  slug: string;
}

export function DestinationDroneView({ destination, inventory, slug }: DestinationDroneViewProps) {
  const { lang } = useLanguage();
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(0);
  const [selectedFilterSpot, setSelectedFilterSpot] = useState<string>('all');

  const destIndex = DRONE_DESTINATIONS.findIndex(
    (d) =>
      d.id === slug ||
      d.id === destination.slug ||
      (d as any).aliases?.includes(slug) ||
      destination.slug.startsWith(d.id) ||
      d.id.startsWith(destination.slug),
  );
  const droneDest: DroneDestination =
    destIndex !== -1 ? DRONE_DESTINATIONS[destIndex] : DRONE_DESTINATIONS[0];
  const nextDest =
    DRONE_DESTINATIONS[(destIndex >= 0 ? destIndex + 1 : 1) % DRONE_DESTINATIONS.length];

  const spotList = destination.spots.length > 0 ? destination.spots : [];
  const currentSpot = spotList[selectedSpotIdx] || spotList[0] || null;
  const droneSpot: DroneSpot =
    droneDest.spots.find(
      (ds) =>
        currentSpot &&
        (currentSpot.slug.includes(ds.id) ||
          ds.id.includes(currentSpot.slug) ||
          (currentSpot.beachPointCode &&
            ds.id.toLowerCase().includes(currentSpot.beachPointCode.toLowerCase()))),
    ) ||
    droneDest.spots[selectedSpotIdx % droneDest.spots.length] ||
    droneDest.spots[0];

  const spotName = (spotSlug: string | null) =>
    destination.spots.find((spot) => spot.slug === spotSlug)?.name;

  const topAlert = destination.topAlert ?? destination.alerts?.[0] ?? null;
  const contacts =
    destination.emergencyContacts && destination.emergencyContacts.length > 0
      ? destination.emergencyContacts
      : [
          {
            label: 'National emergency',
            labelBn: 'জাতীয় জরুরি সেবা',
            phone: '999',
            kind: 'NATIONAL' as const,
          },
        ];

  const isCoxsBazar =
    destination.slug === 'coxs-bazar' ||
    destination.slug === 'coxs' ||
    slug === 'coxs-bazar' ||
    slug === 'coxs';


  // Filter stays and dining based on user selection
  const filteredHotels =
    selectedFilterSpot === 'all'
      ? inventory.hotels
      : inventory.hotels.filter(
          (h) =>
            h.spotSlug &&
            (h.spotSlug === selectedFilterSpot ||
              h.spotSlug.includes(selectedFilterSpot) ||
              selectedFilterSpot.includes(h.spotSlug)),
        );

  const filteredVenues =
    selectedFilterSpot === 'all'
      ? inventory.venues
      : inventory.venues.filter((v) => {
          if (!v.beachPointCode) return false;
          const code = v.beachPointCode.toLowerCase();
          return selectedFilterSpot.toLowerCase().includes(code);
        });

  const spotsWithInventory = (
    destination.spots.length > 0 ? destination.spots : droneDest.spots
  ).map((s) => ('slug' in s ? s.slug : s.id));

  // Current spot metadata
  const currentSpotKey = currentSpot?.slug || droneSpot.id;
  const spotMeta =
    SPOT_ZONE_META[currentSpotKey] ||
    Object.entries(SPOT_ZONE_META).find(([k]) => currentSpotKey.includes(k) || k.includes(currentSpotKey))?.[1] || {
      zone: currentSpot?.kind || droneSpot.kind || 'Coastal Spot',
      zoneBn: currentSpot?.kind || droneSpot.kind || 'সৈকত স্থান',
      note: 'Prime destination point',
      noteBn: 'জনপ্রিয় দর্শনীয় স্থান',
    };

  return (
    <div
      className="drone-landing-scope relative w-full bg-bg text-fg"
      style={{ '--accent': destination.accent } as React.CSSProperties}
    >
      <FlyTransitionListener />

      {/* 1. Dedicated Destination Masthead: Grounded child-view of Bangladesh (NOT 100vh drone cockpit) */}
      <header className="dl-dest-masthead" aria-label={`${destination.name} Masthead`}>
        <div className="dl-masthead-media">
          {droneDest.video ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={`/media/places/${droneDest.video}_poster.webp`}
              aria-hidden="true"
            >
              <source src={`/media/video/${droneDest.video}.mp4`} type="video/mp4" />
            </video>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/media/places/${droneDest.hero}.webp`} alt="" fetchPriority="high" />
          )}
        </div>

        <div className="dl-masthead-scrim" />

        <div className="dl-wrap dl-dest-masthead-body">
          <div className="mb-3">
            <span className="dl-dest-badge">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {lang === 'bn'
                  ? isCoxsBazar
                    ? 'চট্টগ্রাম বিভাগ · বঙ্গোপসাগর উপকূল'
                    : 'পর্যটন অঞ্চল'
                  : isCoxsBazar
                    ? 'Chattogram Division · Bay of Bengal Coast'
                    : 'Travel Territory'}
              </span>
            </span>
          </div>

          <h1 className="dl-d-title dl-swap">{destination.name}</h1>
          <div className="dl-d-bn">{destination.nameBn || droneDest.bn}</div>
          <p className="dl-d-tag">
            {destination.tagline ||
              (lang === 'bn' && droneDest.tagBn ? droneDest.tagBn : droneDest.tag)}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white">
              <span className="text-white/60">{lang === 'bn' ? 'মৌসুম:' : 'Season:'}</span>
              <span>{destination.content?.bestTime?.split('.')[0] || droneDest.best}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white">
              <span className="text-white/60">{lang === 'bn' ? 'যাতায়াত:' : 'Transit:'}</span>
              <span>{lang === 'bn' ? 'বিমান বা বাস' : 'Fly or bus'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white">
              <span className="text-white/60">{lang === 'bn' ? 'স্পট:' : 'Spots:'}</span>
              <span>{lang === 'bn' ? `${destination.spots.length || droneDest.spots.length}টি স্থান` : `${destination.spots.length || droneDest.spots.length} spots`}</span>
            </span>
          </div>
        </div>
      </header>

      {/* 2. Territory Live Pulse Strip & Alert Banner */}
      <div className="dl-wrap">
        {/* Top Active Alert */}
        {topAlert ? (
          <div className="dl-dest-alert" role={topAlert.severity === 'DANGER' ? 'alert' : 'status'}>
            {renderSvg('alert')}
            <div>
              <b>
                {topAlert.title}{' '}
                <span className="dl-sample">{topAlert.severity.toLowerCase()}</span>
              </b>
              {topAlert.body ? <div className="mt-1 text-sm">{topAlert.body}</div> : null}
            </div>
          </div>
        ) : null}

        {/* Real-time Coastal Pulse: High-value daily operational intel */}
        <div className="dl-pulse-strip" role="region" aria-label="Current field conditions">
          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Waves className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'জোয়ার-ভাটার সময়' : 'Tide schedule'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn'
                  ? isCoxsBazar
                    ? 'জোয়ার: ২:৪৫ PM (+১.৮ মি) · ভাটা: ৮:৩০ PM'
                    : 'স্বাভাবিক প্রবাহ'
                  : isCoxsBazar
                    ? 'High: 2:45 PM (+1.8m) · Low: 8:30 PM'
                    : 'Normal waters'}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              <ShieldCheck className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'সৈকত সংকেত ও সতর্কতা' : 'Sea safety flag'}
              </span>
              <span className="dl-pulse-val text-emerald-700 dark:text-emerald-300">
                {lang === 'bn'
                  ? 'সবুজ পতাকা · লাইফগার্ড পোস্টের কাছে নিরাপদ'
                  : 'Green flag · Safe near lifeguard towers'}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon text-amber-600 dark:text-amber-400 bg-amber-500/10">
              <Sunset className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'আজকের সূর্যাস্ত' : 'Sunset today'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn' ? 'বিকাল ৫:১৮ (কলাতলী ও সুগন্ধা)' : '5:18 PM at Kolatoli & Sugandha'}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Compass className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'আবহাওয়া ও বাতাস' : 'Conditions'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn'
                  ? '২৮°সে · মৃদু দক্ষিণ-পশ্চিম বাতাস (১২ নট)'
                  : '28°C · Gentle SW breeze (12 kt)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coastal Strip & Spot Hub Section */}
      <section className="dl-sec" id="hub" style={{ paddingTop: '36px' }}>
        <div className="dl-wrap">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'উপকূলীয় স্পট নির্দেশিকা' : 'Coastal Spot Directory'}
              </div>
              <h2 className="dl-h2" style={{ marginBottom: '6px' }}>
                {lang === 'bn' ? 'কক্সবাজারের' : 'Explore the'}{' '}
                <span className="serif" style={{ color: 'var(--accent)' }}>
                  {lang === 'bn' ? 'সৈকতসমূহ' : 'coastal spots.'}
                </span>
              </h2>
              <p className="text-sm text-muted max-w-2xl">
                {lang === 'bn'
                  ? 'শহরের প্রাণকেন্দ্র থেকে শুরু করে মেরিন ড্রাইভ ও ইনানীর প্রবাল সৈকত পর্যন্ত প্রতিটি স্পটের বৈশিষ্ট্য জানুন।'
                  : "Select a beach point along Cox's Bazar coastline to see its unique character, safety zones, and field guidance."}
              </p>
            </div>

            {/* Quick action to dedicated spot page */}
            <Link
              href={`/d/${destination.slug}/s/${currentSpot?.slug || droneSpot.id}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-surface border border-line hover:border-primary/50 text-fg transition-all shadow-sm self-start md:self-auto"
            >
              <span>{lang === 'bn' ? 'সম্পূর্ণ স্পট গাইড' : 'Open Full Spot Guide'}</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Spot Picker Tabs */}
          <div className="dl-spot-nav-strip mb-4" role="tablist" aria-label="Coastal Spots">
            {(destination.spots.length > 0 ? destination.spots : droneDest.spots).map(
              (s, idx) => {
                const sSlug = 'slug' in s ? s.slug : s.id;
                const sName = s.name;
                const sBn = 'nameBn' in s ? s.nameBn : s.bn;
                const ds =
                  'slug' in s
                    ? (droneDest.spots.find(
                        (d) =>
                          s.slug.includes(d.id) ||
                          d.id.includes(s.slug) ||
                          (s.beachPointCode &&
                            d.id.toLowerCase().includes(s.beachPointCode.toLowerCase())),
                      ) ??
                      droneDest.spots[idx % droneDest.spots.length] ??
                      droneDest.spots[0])
                    : s;
                const imgName = ds?.img ?? 'coxs_laboni';
                const isSelected = idx === selectedSpotIdx;
                return (
                  <button
                    key={sSlug}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedSpotIdx(idx);
                      setSelectedFilterSpot(sSlug);
                    }}
                    className={`dl-spot-tab ${isSelected ? 'active' : ''}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/media/places/${imgName}.webp`} alt="" />
                    <span>{lang === 'bn' && sBn ? sBn : sName}</span>
                  </button>
                );
              },
            )}
          </div>

          {/* Featured Spot Cinematic Card */}
          <div className="dl-spot-stage" id="spotstage">
            {/* Background Images Crossfade */}
            <div className="dl-spot-stage-media">
              {(destination.spots.length > 0 ? destination.spots : droneDest.spots).map(
                (s, idx) => {
                  const sSlug = 'slug' in s ? s.slug : s.id;
                  const ds =
                    'slug' in s
                      ? (droneDest.spots.find(
                          (d) =>
                            s.slug.includes(d.id) ||
                            d.id.includes(s.slug) ||
                            (s.beachPointCode &&
                              d.id.toLowerCase().includes(s.beachPointCode.toLowerCase())),
                        ) ??
                        droneDest.spots[idx % droneDest.spots.length] ??
                        droneDest.spots[0])
                      : s;
                  const imgName = ds?.img ?? 'coxs_laboni';
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={sSlug}
                      src={`/media/places/${imgName}.webp`}
                      alt=""
                      className={idx === selectedSpotIdx ? 'on' : ''}
                    />
                  );
                },
              )}
              <div className="dl-spot-stage-scrim" />
            </div>

            {/* Stage Info Content Over Scenic View */}
            <div className="dl-spot-stage-content">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="dl-dest-badge" style={{ marginBottom: 0 }}>
                    {lang === 'bn' ? spotMeta.zoneBn : spotMeta.zone}
                  </span>
                  {currentSpot?.beachPointCode ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 text-xs font-mono font-bold tracking-wider text-white backdrop-blur-md">
                      POINT {currentSpot.beachPointCode.toUpperCase()}
                    </span>
                  ) : null}
                  {spotMeta.vibe ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-xs font-semibold text-emerald-200 backdrop-blur-md">
                      {lang === 'bn' ? spotMeta.vibeBn : spotMeta.vibe}
                    </span>
                  ) : null}
                </div>

                <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-1">
                  {lang === 'bn'
                    ? currentSpot?.nameBn || currentSpot?.name || droneSpot.bn
                    : currentSpot?.name || droneSpot.name}
                </h3>
                <p className="text-white/85 text-base md:text-lg font-medium mb-4">
                  {lang === 'bn' ? spotMeta.noteBn : spotMeta.note}
                </p>

                {/* Spot Field Guidance Notes */}
                {droneSpot.know && droneSpot.know.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                    {droneSpot.know.slice(0, 2).map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/15 text-xs text-white/90"
                      >
                        <Info className="size-4 shrink-0 text-amber-300 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Primary Action Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/d/${destination.slug}/s/${currentSpot?.slug || droneSpot.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-white text-zinc-900 hover:bg-white/90 transition-all shadow-lg"
                  >
                    <span>
                      {lang === 'bn'
                        ? `${currentSpot?.nameBn || currentSpot?.name || droneSpot.bn} বিস্তারিত গাইড দেখুন`
                        : `Explore ${currentSpot?.name || droneSpot.name} Guide`}
                    </span>
                    <ChevronRight className="size-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFilterSpot(currentSpot?.slug || droneSpot.id);
                      const el = document.getElementById('list');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all"
                  >
                    <span>{lang === 'bn' ? 'কাছের হোটেল ও খাবার তালিকা ↓' : 'View Stays & Dining at this spot ↓'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Listings in Destination with Spot Filtering */}
      <section className="dl-sec" id="list" style={{ paddingTop: '10px' }}>
        <div className="dl-wrap">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
                {lang === 'bn'
                  ? `${destination.nameBn || destination.name}-এ জনপ্রিয় লিস্টিং`
                  : `Book in ${destination.name}`}
              </div>
              <h2 className="dl-h2" style={{ marginBottom: 0 }}>
                {lang === 'bn' ? 'হোটেল ও' : 'Stays &'}{' '}
                <span className="serif" style={{ color: 'var(--accent)' }}>
                  {lang === 'bn' ? 'খাবার স্থান।' : 'dining.'}
                </span>
              </h2>
            </div>

            {/* Spot Filter Chip Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted mr-1">
                {lang === 'bn' ? 'স্পট অনুযায়ী ফিল্টার:' : 'Filter by spot:'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedFilterSpot('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedFilterSpot === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface border border-line text-muted hover:border-primary/50'
                }`}
              >
                {lang === 'bn' ? 'সকল স্পট' : 'All Spots'}
              </button>
              {spotsWithInventory.map((sSlug) => {
                const sName =
                  destination.spots.find((s) => s.slug === sSlug)?.name ||
                  droneDest.spots.find((s) => s.id === sSlug)?.name ||
                  sSlug;
                return (
                  <button
                    key={sSlug}
                    type="button"
                    onClick={() => setSelectedFilterSpot(sSlug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedFilterSpot === sSlug
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface border border-line text-muted hover:border-primary/50'
                    }`}
                  >
                    {sName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stays Row */}
          <div id="stays" style={{ marginTop: '28px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title font-bold text-fg flex items-center gap-2">
                <Hotel className="size-5 text-primary" />
                <span>{lang === 'bn' ? 'হোটেল ও বিচভিউ রিসোর্ট' : 'Popular stays & resorts'}</span>
                <span className="text-xs font-normal text-muted">
                  ({filteredHotels.length} {lang === 'bn' ? 'উপলব্ধ' : 'available'})
                </span>
              </h3>
              <Link
                href={`/d/${destination.slug}/stay`}
                className="text-label text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{lang === 'bn' ? 'সবগুলো হোটেল দেখুন' : 'See all stays'}</span>
                <ChevronRight className="size-4" />
              </Link>
            </div>
            {filteredHotels.length > 0 ? (
              <CardRow label="Popular stays">
                {filteredHotels.slice(0, 6).map((hotel) => (
                  <CardRowItem key={hotel.id}>
                    <HotelCard hotel={hotel} spotName={spotName(hotel.spotSlug)} />
                  </CardRowItem>
                ))}
              </CardRow>
            ) : (
              <p className="text-sm text-muted py-6">
                {lang === 'bn'
                  ? 'নির্বাচিত স্পটে এই মুহূর্তে কোনো হোটেল পাওয়া যায়নি।'
                  : 'No hotels found for the selected spot filter.'}
              </p>
            )}
          </div>

          {/* Dining Row */}
          <div id="dining" style={{ marginTop: '40px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title font-bold text-fg flex items-center gap-2">
                <Utensils className="size-5 text-amber-600" />
                <span>{lang === 'bn' ? 'সিফুড ও খাবার রেস্তোরাঁ' : 'Places to eat & seafood'}</span>
                <span className="text-xs font-normal text-muted">
                  ({filteredVenues.length} {lang === 'bn' ? 'উপলব্ধ' : 'places'})
                </span>
              </h3>
              <Link
                href={`/d/${destination.slug}/food`}
                className="text-label text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{lang === 'bn' ? 'সবগুলো খাবার স্থান দেখুন' : 'See all dining'}</span>
                <ChevronRight className="size-4" />
              </Link>
            </div>
            {filteredVenues.length > 0 ? (
              <CardRow label="Places to eat">
                {filteredVenues.slice(0, 6).map((venue) => (
                  <CardRowItem key={venue.id}>
                    <VenueCard venue={venue} />
                  </CardRowItem>
                ))}
              </CardRow>
            ) : (
              <p className="text-sm text-muted py-6">
                {lang === 'bn'
                  ? 'নির্বাচিত স্পটে এই মুহূর্তে কোনো খাবার স্থান পাওয়া যায়নি।'
                  : 'No dining venues found for the selected spot filter.'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 7. Logistics & Getting Around Guide: Practical Field Intel */}
      <section className="dl-sec" id="transit" style={{ background: 'var(--surface-alt)' }}>
        <div className="dl-wrap">
          <div>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn' ? 'ভ্রমণ সহায়িকা ও যাতায়াত' : "Traveler's Field Guide"}
            </div>
            <h2 className="dl-h2" style={{ marginBottom: '6px' }}>
              {lang === 'bn' ? 'কক্সবাজারে সহজে' : 'Getting around'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'চলাচল করুন।' : "Cox's Bazar."}
              </span>
            </h2>
            <p className="text-sm text-muted">
              {lang === 'bn'
                ? 'স্থানীয় যাতায়াত, সঠিক বাহন ও বিচ নিরাপত্তার অপরিহার্য তথ্য।'
                : 'Essential transit options, local fare guidance, and beach navigation advice.'}
            </p>
          </div>

          <div className="dl-guide-grid">
            <div className="dl-guide-card">
              <div className="dl-guide-icon text-emerald-600 bg-emerald-500/10">
                <Car className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'টমটম (ইজিবাইক)' : 'Town Auto-Rickshaw (TomTom)'}</h4>
              <p>
                {lang === 'bn'
                  ? 'লাবণী, সুগন্ধা ও কলাতলীর মধ্যে যাতায়াতের সবচেয়ে জনপ্রিয় ও সহজ মাধ্যম ব্যাটারিচালিত টমটম। প্রধান সড়কে শেয়ার্ড ভাড়া প্রতিজন ২০ থেকে ৪০ টাকা।'
                  : 'Battery-operated TomToms are the primary hop-on transit between Laboni, Sugandha, and Kolatoli. Shared rides cost Tk 20–40 per passenger.'}
              </p>
            </div>

            <div className="dl-guide-card">
              <div className="dl-guide-icon text-sky-600 bg-sky-500/10">
                <Bus className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'চান্দের গাড়ি (মেরিন ড্রাইভ)' : 'Chander Gari (Marine Drive)'}</h4>
              <p>
                {lang === 'bn'
                  ? 'মেরিন ড্রাইভ ধরে হিমছড়ি ও ইনানী সমুদ্রসৈকত দর্শনে খোলা জিপ বা চান্দের গাড়ি আদর্শ। যাত্রার শুরুতেই রাউন্ড-ট্রিপ ও অপেক্ষার সময় ঠিক করে নিন।'
                  : 'Iconic open-roof 4x4s for scenic day-trips along the 80km Marine Drive down to Himchari and Inani. Always agree on round-trip waiting times.'}
              </p>
            </div>

            <div className="dl-guide-card">
              <div className="dl-guide-icon text-indigo-600 bg-indigo-500/10">
                <Plane className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'বিমানবন্দর ও বাস টার্মিনাল' : 'Airport & Terminal Arrival'}</h4>
              <p>
                {lang === 'bn'
                  ? 'কক্সবাজার বিমানবন্দর (CXB) ও কলাতলী কেন্দ্রীয় বাস টার্মিনাল থেকে প্রধান হোটেল এলাকা মাত্র ১০-১৫ মিনিটের ড্রাইভ। গেটে সিএনজি ও অটোরিকশা সহজলভ্য।'
                  : 'Cox’s Bazar Airport (CXB) and Kolatoli Central Bus Station sit 10–15 minutes from the main beachfront hotel zone. CNGs wait at gates.'}
              </p>
            </div>

            <div className="dl-guide-card">
              <div className="dl-guide-icon text-amber-600 bg-amber-500/10">
                <ShieldCheck className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'সৈকত নিরাপত্তা প্রোটোকল' : 'Beach Safety Rules'}</h4>
              <p>
                {lang === 'bn'
                  ? 'সর্বদা লাইফগার্ড চিহ্নিত সীমানার ভেতর সাঁতার কাটুন। লাল পতাকা উড়লে সমুদ্রে নামা থেকে বিরত থাকুন এবং ভাটার সময় গভীর পানিতে যাবেন না।'
                  : 'Always swim within lifeguard-marked flag boundaries. Never swim past marked safety buoys or enter the water after sunset.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Destination Help & Physical Coastline Desk */}
      <section
        className="dl-sec"
        id="dhelp"
        style={{ background: 'var(--card-bg, var(--surface))', borderTop: '1px solid var(--line)' }}
      >
        <div className="dl-wrap">
          <div>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn'
                ? `${destination.nameBn || destination.name}-এ সরাসরি সহায়তা`
                : `Assistance in ${destination.name}`}
            </div>
            <h2 className="dl-h2">
              {lang === 'bn' ? 'নিরাপদ ভ্রমণ' : 'Safe trips'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'শুরু হোক এখান থেকেই।' : 'start with real support.'}
              </span>
            </h2>
            <p className="text-sm text-muted">
              {lang === 'bn'
                ? 'সৈকতে কোনো সমস্যা, অভিযোগ বা হারানো জিনিসের জন্য কোস্টলাইন ডেস্ক কর্মী ও জরুরি নম্বরসমূহ প্রস্তুত।'
                : 'On-ground assistance, desk locations, and verified emergency helplines for peace of mind.'}
            </p>
          </div>

          <div className="dl-help-grid mt-6">
            {/* Coastline Physical Desk Card */}
            <div className="dl-help-card" style={{ borderColor: 'var(--primary)' }}>
              <div className="flex items-center gap-2 text-primary mb-2">
                <MapPin className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'অন-গ্রাউন্ড ডেস্ক' : 'On-Ground Presence'}
                </span>
              </div>
              <b style={{ fontSize: '20px' }}>
                {lang === 'bn' ? 'কোস্টলাইন বিচ ডেস্ক' : 'Coastline Beach Desks'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'সুগন্ধা পয়েন্ট ও লাবণী বিচ প্রবেশমুখে আমাদের ফিজিক্যাল ডেস্ক কর্মী রয়েছে। টিকিট যাচাই, হারানো জিনিস জমা ও তাৎক্ষণিক তথ্যের জন্য যোগাযোগ করুন।'
                  : 'Staffed physical kiosks located at Sugandha Point beach entrance and Laboni Pavilion for ticket verification, complaints, and immediate help.'}
              </p>
            </div>

            {/* Tourist Police Contact */}
            <a
              href="tel:01769690732"
              className="dl-help-card em"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <Phone className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'ট্যুরিস্ট পুলিশ' : 'Tourist Police'}
                </span>
              </div>
              <div className="big text-rose-600">01769-690732</div>
              <b>{lang === 'bn' ? 'কক্সবাজার ট্যুরিস্ট পুলিশ কন্ট্রোল রুম' : "Cox's Bazar Tourist Police"}</b>
              <p>
                {lang === 'bn'
                  ? 'সৈকতে নিরাপত্তা বিঘ্নিত হলে বা অতিরিক্ত ভাড়ার সমস্যায় সরাসরি কল করুন।'
                  : 'Direct 24/7 hotline for on-beach security, overcharging issues, and tourist protection.'}
              </p>
            </a>

            {/* National Emergency */}
            <a href="tel:999" className="dl-help-card" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2 text-muted mb-2">
                <Phone className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'জাতীয় জরুরি সেবা' : 'National Emergency'}
                </span>
              </div>
              <div className="big">999</div>
              <b>{lang === 'bn' ? 'পুলিশ · ফায়ার সার্ভিস · অ্যাম্বুলেন্স' : 'Police · Fire · Ambulance'}</b>
              <p>
                {lang === 'bn'
                  ? 'কোস্টলাইন কেবল জরুরি নম্বর প্রদর্শন করে; এটি উদ্ধারকারী দল পাঠায় না।'
                  : 'Coastline displays verified emergency helplines; it does not dispatch emergency services.'}
              </p>
            </a>

            {/* Lost and Found Action */}
            <Link
              href="/help/lost-found"
              className="dl-help-card"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-2 text-primary mb-2">
                {renderSvg('lost')}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'হারানো জিনিস' : 'Lost & Found'}
                </span>
              </div>
              <b style={{ fontSize: '20px' }}>
                {lang === 'bn' ? 'কিছু হারিয়েছেন বা পেয়েছেন?' : 'Lost something on the sand?'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'সৈকতে পাওয়া যেকোনো আইটেম ডেস্ক কর্মীরা লগ করে রাখেন। আপনার দাবিকৃত জিনিসের সাথে মেলাতে রিপোর্ট করুন।'
                  : 'Items turned in to beach desks are logged in real-time. File a quick report to cross-check matches.'}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Next Destination Teaser */}
      <section style={{ padding: '0 0 clamp(60px, 8vw, 110px)' }}>
        <div className="dl-wrap">
          <Link
            className="dl-next"
            href={`/d/${nextDest.id}`}
            data-fly
            data-flyimg={`/media/places/${nextDest.hero}.webp`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/places/${nextDest.hero}.webp`} alt="" loading="lazy" />
            <div>
              <small>{lang === 'bn' ? 'পরবর্তী গন্তব্য দেখুন' : 'Explore neighboring destination'}</small>
              <h3>{lang === 'bn' ? `${nextDest.bn} →` : `${nextDest.name} →`}</h3>
              <p className="dl-bn" style={{ fontSize: '22px', margin: '8px 0 0' }}>
                {lang === 'bn' ? nextDest.name : nextDest.bn}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 10. Media Attribution */}
      <section className="dl-sec py-8 border-t border-line/50 bg-surface/30">
        <div className="dl-wrap">
          <MediaCreditsList />
        </div>
      </section>
    </div>
  );
}
