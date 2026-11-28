'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DestinationSummaryDto } from '@coastline/api-contracts';
import {
  BANGLADESH_PATH,
  DRONE_DESTINATIONS,
  REGION_MAP_ZONES,
  type DroneDestination,
  type RegionMapZone,
} from '@/lib/scenic-places-data';

const DEFAULT_SEEDED = new Set(['coxs-bazar', 'sylhet', 'rangamati']);

const KIND_LABELS: Record<string, { en: string; bn: string }> = {
  SEA: { en: 'Coast & Sea', bn: 'সমুদ্র ও উপকূল' },
  FOREST: { en: 'Swamp & Forest', bn: 'জলাবন ও বন' },
  LAKE: { en: 'Lakes & Islands', bn: 'হ্রদ ও দ্বীপ' },
  HILL: { en: 'Cloud & Hills', bn: 'পাহাড় ও মেঘ' },
  MANGROVE: { en: 'Mangrove & Delta', bn: 'ম্যানগ্রোভ ও ব-দ্বীপ' },
};

export function BangladeshMapSection({
  lang = 'en',
  destinations = [],
}: {
  lang?: 'en' | 'bn';
  destinations?: DestinationSummaryDto[];
}) {
  const [selectedId, setSelectedId] = useState('coxs-bazar');
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ tx: 0, ty: 0 });
  const router = useRouter();

  const seededSlugs =
    destinations.length > 0 ? new Set(destinations.map((x) => x.slug)) : DEFAULT_SEEDED;

  const d: DroneDestination =
    DRONE_DESTINATIONS.find((x) => x.id === selectedId || x.aliases?.includes(selectedId)) ||
    DRONE_DESTINATIONS[0];

  const isSeeded = seededSlugs.has(d.id);

  const currentZone: RegionMapZone =
    REGION_MAP_ZONES[selectedId] || REGION_MAP_ZONES[d.id] || REGION_MAP_ZONES['coxs-bazar'];

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const tx = ((e.clientX - r.left) / r.width - 0.5) * 12;
    const ty = (0.5 - (e.clientY - r.top) / r.height) * 10;
    setTilt({ tx, ty });
  };

  const handleCardMouseLeave = () => {
    setTilt({ tx: 0, ty: 0 });
  };

  return (
    <section className="dl-sec" id="map">
      <div className="wrap dl-mapsec">
        <div>
          <div className="dl-eyebrow">
            {lang === 'bn' ? 'আঞ্চলিক মানচিত্র' : 'Regional Territory Map'}
          </div>
          <h2 className="dl-h2">
            <span>{lang === 'bn' ? 'পাঁচটি প্রাকৃতিক অঞ্চল,' : 'Five natural regions,'}</span>{' '}
            <span className="serif">
              {lang === 'bn' ? 'সমগ্র বাংলাদেশ।' : 'one living country.'}
            </span>
          </h2>
          <p className="dl-lead">
            {lang === 'bn'
              ? 'পর্যটন স্পটগুলো বিচ্ছিন্ন কোনো বিন্দু নয় — এগুলো বাংলাদেশের প্রধান ভৌগোলিক অঞ্চলের অন্তর্গত। অঞ্চল নির্বাচন করে এর ভেতরে থাকা সৈকত, জলাবন, হ্রদ আর পাহাড় আবিষ্কার করুন।'
              : 'Tourist spots belong to distinct natural territories across Bangladesh. Tap a colored region to highlight its geographic zone and explore the spots nestled inside.'}
          </p>

          <div className="dl-conservation-banner">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>
              {lang === 'bn'
                ? 'রঙিন ভৌগোলিক অঞ্চলসমূহ এবং সংরক্ষিত পর্যটন হাব'
                : 'Color-coded natural regions & verified local spot hubs'}
            </span>
          </div>

          {/* Quick Region Selector Chips */}
          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Regions">
            {Object.values(REGION_MAP_ZONES).map((zone) => {
              const isSelected = zone.id === selectedId;
              return (
                <button
                  key={zone.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(zone.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'scale-105 shadow-md ring-2'
                      : 'bg-surface/80 text-muted hover:bg-surface hover:text-fg'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: zone.color,
                          color: '#ffffff',
                          boxShadow: `0 4px 14px ${zone.color}55`,
                        }
                      : {}
                  }
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#ffffff' : zone.color }}
                  />
                  {lang === 'bn' ? zone.nameBn : zone.name}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '28px', maxWidth: '420px' }}>
            <div className="dl-mapbox relative" id="mapbox">
              <svg
                viewBox="0 0 420 520"
                role="img"
                className="w-full drop-shadow-xl"
                aria-label="Map of Bangladesh showing colored tourist destination regions"
              >
                <defs>
                  <linearGradient id="bdfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#EAE6DA" />
                    <stop offset="1" stopColor="#DFDACB" />
                  </linearGradient>

                  {/* Regional territory gradient definitions */}
                  {Object.values(REGION_MAP_ZONES).map((z) => (
                    <linearGradient id={`grad-${z.id}`} key={z.id} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={z.gradient[0]} />
                      <stop offset="100%" stopColor={z.gradient[1]} />
                    </linearGradient>
                  ))}
                </defs>

                {/* Base Bangladesh landmass path */}
                <path
                  className="dl-bd transition-colors duration-500"
                  d={BANGLADESH_PATH}
                  fill="url(#bdfill)"
                  stroke="#CEC8B6"
                  strokeWidth="1.2"
                />

                {/* Highlighted Regional Coverage Zones (Territories) */}
                {Object.values(REGION_MAP_ZONES).map((zone) => {
                  const isSelected = zone.id === selectedId;
                  return (
                    <g key={zone.id} className="cursor-pointer">
                      <path
                        d={zone.path}
                        fill={isSelected ? '#3A7D5C' : '#6A9E84'}
                        fillOpacity={isSelected ? 0.94 : 0.45}
                        stroke="#F6F4EC"
                        strokeWidth={isSelected ? 1.8 : 1}
                        className="transition-all duration-300 ease-out hover:fill-opacity-85"
                        onClick={() => setSelectedId(zone.id)}
                        onMouseEnter={() => setSelectedId(zone.id)}
                      >
                        <title>{zone.name}</title>
                      </path>
                    </g>
                  );
                })}

                {/* Tourist spots inside the selected region */}
                {currentZone.spots.map((spot) => {
                  const isHovered = hoveredSpotId === spot.id;
                  const matchedSpot = d.spots.find(
                    (s) =>
                      s.id === spot.id ||
                      s.name.toLowerCase() === spot.name.toLowerCase() ||
                      s.id.includes(spot.id.split('-')[0]),
                  );
                  const openSpot = () => {
                    if (isSeeded && matchedSpot) router.push(`/d/${d.id}/s/${matchedSpot.id}`);
                  };
                  const canOpen = isSeeded && Boolean(matchedSpot);
                  return (
                    <g
                      key={spot.id}
                      className="cursor-pointer transition-all duration-300"
                      role={canOpen ? 'link' : undefined}
                      tabIndex={canOpen ? 0 : undefined}
                      aria-label={canOpen && matchedSpot ? `${spot.name} — open spot` : undefined}
                      onClick={openSpot}
                      onKeyDown={(e) => {
                        if (canOpen && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          openSpot();
                        }
                      }}
                      onMouseEnter={() => setHoveredSpotId(spot.id)}
                      onMouseLeave={() => setHoveredSpotId(null)}
                      style={{ transformOrigin: `${spot.x}px ${spot.y}px` }}
                    >
                      {/* Red/Coral spot marker with crisp white ring */}
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r={isHovered ? 10 : 6}
                        fill="#D94A4A"
                        fillOpacity={isHovered ? 0.3 : 0.18}
                      />
                      <circle
                        cx={spot.x}
                        cy={spot.y}
                        r={isHovered ? 4.5 : 3.5}
                        fill="#D94A4A"
                        stroke="#FFFFFF"
                        strokeWidth={1.6}
                      />
                      {/* Clean spot label */}
                      <g
                        transform={`translate(${spot.x + 7}, ${spot.y - 4})`}
                        className={`transition-opacity duration-200 ${
                          isHovered ? 'opacity-100' : 'opacity-95'
                        }`}
                      >
                        <rect
                          x={-2}
                          y={-10}
                          width={(lang === 'bn' ? spot.nameBn.length : spot.name.length) * 6.5 + 10}
                          height={16}
                          rx={8}
                          fill="#FFFFFF"
                          fillOpacity={0.95}
                          stroke="#D5D0C0"
                          strokeWidth={0.8}
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.14))"
                        />
                        <text
                          x={3}
                          y={2}
                          fontSize={9}
                          fontWeight={700}
                          fill="#121A1C"
                          fontFamily="var(--sans)"
                        >
                          {lang === 'bn' ? spot.nameBn : spot.name}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Region Preview Card */}
        {(() => {
          const cardInner = (
            <>
              <div className="ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={d.id}
                  className="swap-in"
                  alt={d.name}
                  src={`/media/places/${d.card || d.hero}.webp`}
                />
              </div>
              <div className="ov" />
              <div className="ct">
                <div className="dl-swap" key={d.id}>
                  <span className="dl-tag" style={{ background: currentZone.color }}>
                    {isSeeded
                      ? KIND_LABELS[d.kind]?.[lang] || d.kind
                      : lang === 'bn'
                        ? 'শীঘ্রই আসছে'
                        : 'Coming soon'}
                  </span>
                  <h3>
                    {d.name}{' '}
                    <span className="bn" style={{ fontWeight: 500, opacity: 0.85, fontSize: '0.7em' }}>
                      {d.bn}
                    </span>
                  </h3>
                  <div style={{ opacity: 0.9 }}>{lang === 'bn' ? d.tagBn : d.tag}</div>

                  {/* Contained spots inside this regional coverage zone */}
                  <div className="dl-chips">
                    {currentZone.spots.map((s) => (
                      <span
                        className={`dl-chip transition-transform ${
                          hoveredSpotId === s.id ? 'scale-110 font-bold' : ''
                        }`}
                        key={s.id}
                        style={
                          hoveredSpotId === s.id
                            ? { borderColor: currentZone.color, background: 'rgba(255,255,255,0.3)' }
                            : {}
                        }
                      >
                        {lang === 'bn' ? s.nameBn : s.name}
                      </span>
                    ))}
                  </div>

                  <span className="dl-btn dl-btn-light">
                    {isSeeded
                      ? lang === 'bn'
                        ? `${d.bn} অঞ্চল উন্মোচন করুন`
                        : `Explore ${d.name} Region`
                      : lang === 'bn'
                        ? 'শীঘ্রই আসছে'
                        : 'Coming soon'}{' '}
                    {isSeeded ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ width: '18px', height: '18px' }}
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    ) : null}
                  </span>
                </div>
              </div>
            </>
          );

          const cardStyle = {
            '--tx': tilt.tx,
            '--ty': tilt.ty,
            boxShadow: `0 30px 60px -20px ${currentZone.color}66`,
          } as React.CSSProperties;

          if (!isSeeded) {
            return (
              <div
                className="dl-tiltcard cursor-default"
                id="mapcard"
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                style={cardStyle}
              >
                {cardInner}
              </div>
            );
          }

          return (
            <Link
              className="dl-tiltcard"
              id="mapcard"
              href={`/d/${d.id}`}
              data-fly
              data-flyimg={`/media/places/${d.card || d.hero}.webp`}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={cardStyle}
            >
              {cardInner}
            </Link>
          );
        })()}
      </div>
    </section>
  );
}
