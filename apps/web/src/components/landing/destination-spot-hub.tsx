'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { DroneDestination, DroneSpot } from '@/lib/scenic-places-data';

const SPOT_ZONE_META: Record<
  string,
  { zone: string; zoneBn: string; note: string; noteBn: string; vibe?: string; vibeBn?: string }
> = {
  laboni: {
    zone: 'Town Hub',
    zoneBn: 'শহর কেন্দ্র',
    note: 'Classic beach promenade & shell markets',
    noteBn: 'পুরোনো প্রমোনেড ও ঝিনুক মার্কেট',
    vibe: 'Vibrant & Central',
    vibeBn: 'ব্যস্ত ও প্রাণবন্ত',
  },
  sugandha: {
    zone: 'Prime Dining',
    zoneBn: 'প্রাইম ডাইনিং',
    note: 'Closest to beachfront hotels & sunset dining',
    noteBn: 'হোটেল জোন ও সানসেট ডাইনিং',
    vibe: 'Lively & Convenient',
    vibeBn: 'সহজলভ্য ও জনপ্রিয়',
  },
  kolatoli: {
    zone: 'Resort Zone',
    zoneBn: 'রিসোর্ট জোন',
    note: 'Wide golden sands & luxury beachfront resorts',
    noteBn: 'প্রশস্ত বালুকাবেলা ও বিলাসবহুল রিসোর্ট',
    vibe: 'Modern & Spacious',
    vibeBn: 'আধুনিক ও প্রশস্ত',
  },
  himchari: {
    zone: 'Marine Drive',
    zoneBn: 'মেরিন ড্রাইভ',
    note: 'Where green hills meet the Bay of Bengal',
    noteBn: 'পাহাড়, ঝরনা ও সাগরের মিলনস্থল',
    vibe: 'Scenic & Dramatic',
    vibeBn: 'নৈসর্গিক ও মনোরম',
  },
  inani: {
    zone: 'Coral Shore',
    zoneBn: 'প্রবাল সৈকত',
    note: 'Ancient coral stones & crystal-clear tide pools',
    noteBn: 'প্রাচীন প্রবাল পাথর ও স্বচ্ছ জলরাশি',
    vibe: 'Serene & Pristine',
    vibeBn: 'শান্ত ও নির্মল',
  },
  teknaf: {
    zone: 'Southern Tip',
    zoneBn: 'দক্ষিণ সীমান্ত',
    note: 'Gateway to Saint Martin’s Island & Naf River',
    noteBn: 'সেন্ট মার্টিনের প্রবেশদ্বার ও নাফ নদী',
    vibe: 'Quiet & Untamed',
    vibeBn: 'নিরিবিলি ও শান্ত',
  },
};

export interface DestinationSpotHubProps {
  destination: DestinationDetailDto;
  droneDest: DroneDestination;
  droneSpot: DroneSpot;
  selectedSpotIdx: number;
  onSelectSpot: (idx: number, spotSlug: string) => void;
  onJumpToListings: (spotSlug: string) => void;
  lang: 'en' | 'bn';
}

export function DestinationSpotHub({
  destination,
  droneDest,
  droneSpot,
  selectedSpotIdx,
  onSelectSpot,
  onJumpToListings,
  lang,
}: DestinationSpotHubProps) {
  const spotList = destination.spots.length > 0 ? destination.spots : [];
  const currentSpot = spotList[selectedSpotIdx] || spotList[0] || null;
  const currentSpotKey = currentSpot?.slug || droneSpot.id;
  const spotMeta =
    SPOT_ZONE_META[currentSpotKey] ||
    Object.entries(SPOT_ZONE_META).find(
      ([k]) => currentSpotKey.includes(k) || k.includes(currentSpotKey),
    )?.[1] || {
      zone: currentSpot?.kind || droneSpot.kind || 'Coastal Spot',
      zoneBn: currentSpot?.kind || droneSpot.kind || 'সৈকত স্থান',
      note: 'Prime destination point',
      noteBn: 'জনপ্রিয় দর্শনীয় স্থান',
    };

  const spots = destination.spots.length > 0 ? destination.spots : droneDest.spots;

  return (
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

          <Link
            href={`/d/${destination.slug}/s/${currentSpot?.slug || droneSpot.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-surface border border-line hover:border-primary/50 text-fg transition-all shadow-sm self-start md:self-auto"
          >
            <span>{lang === 'bn' ? 'সম্পূর্ণ স্পট গাইড' : 'Open Full Spot Guide'}</span>
            <ChevronRight className="size-4" />
          </Link>
        </div>

        <div className="dl-spot-nav-strip mb-4" role="tablist" aria-label="Coastal Spots">
          {spots.map((s, idx) => {
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
                onClick={() => onSelectSpot(idx, sSlug)}
                className={`dl-spot-tab ${isSelected ? 'active' : ''}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/places/${imgName}.webp`} alt="" />
                <span>{lang === 'bn' && sBn ? sBn : sName}</span>
              </button>
            );
          })}
        </div>

        <div className="dl-spot-stage" id="spotstage">
          <div className="dl-spot-stage-media">
            {spots.map((s, idx) => {
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
            })}
            <div className="dl-spot-stage-scrim" />
          </div>

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
                  onClick={() => onJumpToListings(currentSpot?.slug || droneSpot.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all"
                >
                  <span>
                    {lang === 'bn'
                      ? 'কাছের হোটেল ও খাবার তালিকা ↓'
                      : 'View Stays & Dining at this spot ↓'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
