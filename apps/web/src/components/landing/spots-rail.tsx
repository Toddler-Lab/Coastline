'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { DestinationSummaryDto } from '@coastline/api-contracts';
import {
  DRONE_DESTINATIONS,
  type DroneSpot,
  type DroneDestination,
} from '@/lib/scenic-places-data';

const DEFAULT_SEEDED = new Set(['coxs-bazar', 'sylhet', 'rangamati']);

const SPOT_KINDS: Record<string, { en: string; bn: string }> = {
  BEACH: { en: 'Beach', bn: 'সৈকত' },
  ISLAND: { en: 'Island', bn: 'দ্বীপ' },
  HILL: { en: 'Hill', bn: 'পাহাড়' },
  FOREST: { en: 'Forest', bn: 'জলাবন' },
  TEA_GARDEN: { en: 'Tea Garden', bn: 'চা-বাগান' },
  RIVER: { en: 'River', bn: 'নদী' },
  LAKE: { en: 'Lake', bn: 'হ্রদ' },
};

interface SpotItem {
  destination: DroneDestination;
  spot: DroneSpot;
  index: number;
}

export function SpotsRailSection({
  lang = 'en',
  destinations = [],
}: {
  lang?: 'en' | 'bn';
  destinations?: DestinationSummaryDto[];
}) {
  const [activeDestination, setActiveDestination] = useState<string>('all');
  const seededSlugs =
    destinations.length > 0 ? new Set(destinations.map((d) => d.slug)) : DEFAULT_SEEDED;

  const filteredDestinations =
    activeDestination === 'all'
      ? DRONE_DESTINATIONS
      : DRONE_DESTINATIONS.filter((d) => d.id === activeDestination || d.aliases?.includes(activeDestination));

  const spotsList: SpotItem[] = filteredDestinations.flatMap((destination) =>
    destination.spots.map((spot) => ({ destination, spot })),
  ).map((item, index) => ({ ...item, index }));

  return (
    <section id="explore" style={{ paddingBottom: 'clamp(60px, 8vw, 110px)' }}>
      <div
        className="wrap"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="dl-eyebrow">{lang === 'bn' ? 'অঞ্চলভিত্তিক স্পট' : 'Spots by Destination'}</div>
          <h2 className="dl-h2" style={{ marginBottom: 0 }}>
            <span>{lang === 'bn' ? 'অঞ্চল বেছে নিন,' : 'Select region,'}</span>{' '}
            <span className="serif">{lang === 'bn' ? 'স্পটে নামুন।' : 'land at the spot.'}</span>
          </h2>
        </div>
        <p className="dl-lead" style={{ maxWidth: '420px' }}>
          {lang === 'bn'
            ? 'প্রতিটি স্পট বাংলাদেশের নির্দিষ্ট একটি গন্তব্য অঞ্চলের অন্তর্গত। অঞ্চল ফিল্টার করে ওই অঞ্চলের পর্যটন স্পটগুলো একনজরে দেখুন।'
            : 'Every spot belongs to a regional destination. Filter by destination to see only the spots in that territory with their bookable services.'}
        </p>
      </div>

      {/* Destination Region Tabs */}
      <div className="wrap mt-6">
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Destination filter">
          <button
            type="button"
            role="tab"
            aria-selected={activeDestination === 'all'}
            onClick={() => setActiveDestination('all')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeDestination === 'all'
                ? 'bg-fg text-bg shadow-sm'
                : 'glass-card text-muted hover:text-fg'
            }`}
          >
            {lang === 'bn' ? 'সকল অঞ্চল' : 'All Regions'}
          </button>
          {DRONE_DESTINATIONS.map((dest) => {
            const isSelected = activeDestination === dest.id;
            return (
              <button
                key={dest.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveDestination(dest.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isSelected
                    ? 'scale-105 shadow-md'
                    : 'glass-card text-muted hover:text-fg'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: dest.accent,
                        color: '#ffffff',
                        boxShadow: `0 4px 14px ${dest.accent}66`,
                      }
                    : {}
                }
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#ffffff' : dest.accent }}
                />
                {lang === 'bn' ? dest.bn : dest.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dl-spots" id="spots" style={{ marginTop: '24px' }}>
        {spotsList.map(({ destination, spot, index }) => (
          <SpotRailCard
            key={`${destination.id}-${spot.id}`}
            destination={destination}
            spot={spot}
            index={index}
            lang={lang}
            isSeeded={seededSlugs.has(destination.id)}
          />
        ))}
      </div>
    </section>
  );
}

function SpotRailCard({
  destination,
  spot,
  index,
  lang,
  isSeeded,
}: {
  destination: DroneDestination;
  spot: DroneSpot;
  index: number;
  lang: 'en' | 'bn';
  isSeeded: boolean;
}) {
  const [tilt, setTilt] = useState({ tx: 0, ty: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const ty = (0.5 - (e.clientY - r.top) / r.height) * 8;
    setTilt({ tx, ty });
  };

  const handleMouseLeave = () => {
    setTilt({ tx: 0, ty: 0 });
  };

  const kindLabel = SPOT_KINDS[spot.kind]?.[lang] || spot.kind.replace('_', ' ');
  const cardStyle = {
    '--tag': destination.accent,
    '--tx': tilt.tx,
    '--ty': tilt.ty,
  } as React.CSSProperties;

  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/media/places/${spot.img}.webp`} alt="" loading="lazy" />
      <span className="num">{String(index + 1).padStart(2, '0')}</span>
      <div className="in">
        <span className="dl-tag">
          {isSeeded ? kindLabel : lang === 'bn' ? 'শীঘ্রই আসছে' : 'Coming soon'}
        </span>
        <h3>{lang === 'bn' ? spot.bn : spot.name}</h3>
        <p>
          <span className="bn">{lang === 'bn' ? spot.name : spot.bn}</span> ·{' '}
          {lang === 'bn' ? destination.bn : destination.name}
        </p>
      </div>
    </>
  );

  if (!isSeeded) {
    return (
      <div className="dl-spot cursor-default opacity-90" style={cardStyle}>
        {content}
      </div>
    );
  }

  return (
    <Link
      className="dl-spot"
      href={`/d/${destination.id}/s/${spot.id}`}
      data-fly
      data-flyimg={`/media/places/${spot.img}.webp`}
      data-spot={spot.id}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
    >
      {content}
    </Link>
  );
}
