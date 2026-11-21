'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { InventoryResult } from '@/lib/places-server';
import { CardRow, CardRowItem } from '@/components/patterns/hub';
import { HotelCard, VenueCard } from '@/components/patterns/cards';
import {
  DRONE_DESTINATIONS,
  SERVICES_CATALOG,
  type DroneDestination,
  type DroneSpot,
} from '@/lib/drone-landing-data';
import { useLanguage } from '@/components/patterns/language';
import { LandingNav } from './landing-nav';
import { FlyTransitionListener } from './fly-transition';
import { MediaCreditsList } from '@/components/patterns/media-credits';
import { HelpSheet } from '@/components/patterns/help';

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

const NEARBY_FACILITIES = [
  { key: 'atm', name: 'ATM', nameBn: 'এটিএম', dist: '3 min walk', distBn: '৩ মিনিট হাঁটা' },
  {
    key: 'pharmacy',
    name: 'Pharmacy',
    nameBn: 'ফার্মেসি',
    dist: '5 min walk',
    distBn: '৫ মিনিট হাঁটা',
  },
  {
    key: 'wc',
    name: 'Washroom',
    nameBn: 'টয়লেট / ওয়াশরুম',
    dist: '2 min walk',
    distBn: '২ মিনিট হাঁটা',
  },
  {
    key: 'prayer',
    name: 'Prayer room',
    nameBn: 'নামাজের ঘর',
    dist: '6 min walk',
    distBn: '৬ মিনিট হাঁটা',
  },
  {
    key: 'hospital',
    name: 'Hospital',
    nameBn: 'হাসপাতাল',
    dist: '10 min by ride',
    distBn: '১০ মিনিট গাড়িতে',
  },
];

const CANONICAL_SERVICE_KEYS: Record<string, string> = {
  stay: 'stay',
  food: 'food',
  sunbed: 'sunbeds',
  ride: 'rides',
  boat: 'boats',
  tour: 'tours',
  ticket: 'tickets',
  camera: 'photographers',
  guide: 'tours',
};

export interface DestinationDroneViewProps {
  destination: DestinationDetailDto;
  inventory: InventoryResult;
  slug: string;
}

export function DestinationDroneView({ destination, inventory, slug }: DestinationDroneViewProps) {
  const { lang } = useLanguage();
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState<'book' | 'near' | 'know' | 'help'>('book');
  const [timecode, setTimecode] = useState('00:00:00');
  const [activeTab, setActiveTab] = useState('Overview');

  const stageRef = useRef<HTMLElement>(null);

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

  // Timecode counter for HUD
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      setTimecode(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pointer tilt on hero stage
  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!stageRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = stageRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    stageRef.current.style.setProperty('--px', px.toFixed(3));
    stageRef.current.style.setProperty('--py', py.toFixed(3));
  };

  const handlePointerLeave = () => {
    if (!stageRef.current) return;
    stageRef.current.style.setProperty('--px', '0');
    stageRef.current.style.setProperty('--py', '0');
  };

  const scrollTo = (id: string, tabName: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tabName);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div
      className="drone-landing-scope relative w-full bg-bg text-fg"
      style={{ '--accent': destination.accent } as React.CSSProperties}
    >
      <FlyTransitionListener />

      {/* Hero Stage: exact classes from drone-landing.css */}
      <section
        ref={stageRef}
        id="dhero"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="dl-stage"
        aria-label={`${destination.name} from above`}
      >
        <div className="dl-layer on">
          <div className="dl-cam">
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
        </div>

        <div className="dl-mist" />
        <div className="dl-shade" />

        {/* HUD Telemetry Overlay */}
        <div className="dl-hud" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <div className="tl">
            <span className="dl-rec">REC</span>
            <span>{timecode}</span>
            <span>4K · 30FPS</span>
          </div>
          <div className="tr">
            <span>{droneDest.coord}</span>
            <span>
              ALT <b>{droneDest.alt}</b> M
            </span>
            <span>GIMBAL −45°</span>
            <span>LIVE CONDITIONS · OPTIMAL</span>
          </div>
          <div className="dl-cross" />
          <div className="dl-horizon" />
        </div>

        {/* Destination Header block */}
        <div className="dl-d-head">
          <div className="dl-crumb">
            <Link href="/">{lang === 'bn' ? 'হোম' : 'Explore'}</Link>
            <span>/</span>
            <span>{lang === 'bn' ? destination.nameBn || destination.name : destination.name}</span>
          </div>
          <h1 className="dl-d-title dl-swap">{destination.name}</h1>
          <div className="dl-d-bn">{destination.nameBn || droneDest.bn}</div>
          <p className="dl-d-tag">
            {destination.tagline ||
              (lang === 'bn' && droneDest.tagBn ? droneDest.tagBn : droneDest.tag)}
          </p>
          <div className="dl-facts">
            <div className="dl-fact">
              <small>{lang === 'bn' ? 'সেরা সময়' : 'Best time'}</small>
              {destination.content?.bestTime || droneDest.best}
            </div>
            <div className="dl-fact">
              <small>{lang === 'bn' ? 'কীভাবে যাবেন' : 'Getting there'}</small>
              {destination.content?.gettingThere || droneDest.getThere}
            </div>
            <div className="dl-fact">
              <small>{lang === 'bn' ? 'স্পট' : 'Spots'}</small>
              {lang === 'bn'
                ? `${destination.spots.length || droneDest.spots.length}টি স্থান`
                : `${destination.spots.length || droneDest.spots.length} places to land`}
            </div>
          </div>
        </div>
      </section>

      {/* Alert Banner & Sticky Section Tabs */}
      <div className="dl-wrap">
        {topAlert ? (
          <div className="dl-alert" role={topAlert.severity === 'DANGER' ? 'alert' : 'status'}>
            {renderSvg('alert')}
            <div>
              <b>
                {topAlert.title}{' '}
                <span className="dl-sample">{topAlert.severity.toLowerCase()}</span>
              </b>
              {topAlert.body ? <div>{topAlert.body}</div> : null}
            </div>
          </div>
        ) : null}

        <nav className="dl-tabs" aria-label={`${destination.name} sections`}>
          {[
            { name: lang === 'bn' ? 'ওভারভিউ' : 'Overview', target: 'hub' },
            { name: lang === 'bn' ? 'স্পট' : 'Spots', target: 'hub' },
            { name: lang === 'bn' ? 'থাকা' : 'Stay', target: 'list' },
            { name: lang === 'bn' ? 'খাবার' : 'Food', target: 'list' },
            { name: lang === 'bn' ? 'যাতায়াত' : 'Move', target: 'list' },
            { name: lang === 'bn' ? 'অ্যাক্টিভিটি' : 'Do', target: 'list' },
            { name: lang === 'bn' ? 'সহায়তা' : 'Help', target: 'dhelp' },
          ].map((tab) => (
            <a
              key={tab.target + tab.name}
              href={`#${tab.target}`}
              onClick={scrollTo(tab.target, tab.name)}
              className={activeTab === tab.name ? 'on' : ''}
            >
              {tab.name}
            </a>
          ))}
        </nav>
      </div>

      {/* Spot Hub Section */}
      <section className="dl-sec" id="hub" style={{ paddingTop: '48px' }}>
        <div className="dl-wrap">
          <div style={{ marginBottom: '26px' }}>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn' ? 'স্পট হাব' : 'Spot hub'}
            </div>
            <h2 className="dl-h2" style={{ marginBottom: 0 }}>
              {lang === 'bn' ? 'যেখানে নামবেন' : 'Choose where'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'বেছে নিন।' : 'you land.'}
              </span>
            </h2>
          </div>

          <div className="dl-hub" id="hubbox">
            {/* Hub Background Image Crossfade */}
            <div className="dl-hub-bg">
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
            </div>

            {/* Hub Left: Spot Picker & Spot Name */}
            <div className="dl-hub-left">
              <div className="dl-spot-picker" role="group" aria-label="Spots">
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
                    return (
                      <button
                        key={sSlug}
                        type="button"
                        aria-pressed={idx === selectedSpotIdx}
                        onClick={() => setSelectedSpotIdx(idx)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/media/places/${imgName}.webp`} alt="" />
                        <span>{lang === 'bn' && sBn ? sBn : sName}</span>
                      </button>
                    );
                  },
                )}
              </div>

              <div key={currentSpot ? currentSpot.slug : droneSpot.id} className="dl-swap">
                <span className="dl-tag">
                  {(currentSpot?.kind || droneSpot.kind).toLowerCase().replace(/_/g, ' ')}
                </span>
                <h3 className="dl-hub-name">
                  {lang === 'bn'
                    ? currentSpot?.nameBn || currentSpot?.name || droneSpot.bn
                    : currentSpot?.name || droneSpot.name}
                </h3>
                <p>
                  {lang === 'bn'
                    ? currentSpot?.name || droneSpot.name
                    : currentSpot?.nameBn || droneSpot.bn}
                </p>
              </div>
            </div>

            {/* Hub Right Panel: Segments */}
            <div className="dl-hub-panel">
              <div className="dl-seg" role="tablist">
                {[
                  { id: 'book', label: lang === 'bn' ? 'বুকিং' : 'Book' },
                  { id: 'near', label: lang === 'bn' ? 'কাছেপিঠে' : 'Nearby' },
                  { id: 'know', label: lang === 'bn' ? 'জরুরি তথ্য' : 'Know' },
                  { id: 'help', label: lang === 'bn' ? 'সহায়তা' : 'Help' },
                ].map((seg) => (
                  <button
                    key={seg.id}
                    role="tab"
                    type="button"
                    aria-selected={selectedSegment === seg.id}
                    onClick={() => setSelectedSegment(seg.id as any)}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>

              <div
                className="dl-seg-body"
                key={`${currentSpot ? currentSpot.slug : droneSpot.id}-${selectedSegment}`}
              >
                {selectedSegment === 'book' && (
                  <>
                    <div className="dl-rows">
                      {droneSpot.svc.map((key) => {
                        const svc = SERVICES_CATALOG[key] || {
                          en: key,
                          bn: key,
                          d: 'Service available',
                          dBn: 'সেবা উপলব্ধ',
                          price: 'Tk 500',
                          priceBn: '৫০০ ৳',
                          unit: '/ booking',
                          unitBn: '/ বুকিং',
                        };
                        const canonicalKey = CANONICAL_SERVICE_KEYS[key] || key;
                        const bookHref =
                          key === 'sunbed'
                            ? `/sunbeds/${currentSpot?.beachPointCode?.toLowerCase() || 'lab'}`
                            : `/d/${destination.slug}/${canonicalKey}`;

                        return (
                          <div key={key} className="dl-row">
                            <span className="ic">{renderSvg(key)}</span>
                            <span>
                              <b>{lang === 'bn' ? svc.bn : svc.en}</b>
                              <small>{lang === 'bn' ? svc.dBn : svc.d}</small>
                            </span>
                            <span className="pr">
                              {lang === 'bn' ? `শুরু ${svc.priceBn}` : `from ${svc.price}`}
                              <small>{lang === 'bn' ? svc.unitBn : svc.unit}</small>
                            </span>
                            <Link
                              href={bookHref}
                              className="dl-lcard-btn"
                              style={{ marginLeft: '12px' }}
                            >
                              {lang === 'bn' ? 'বুক' : 'Book'}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                    <p className="dl-note" style={{ margin: 0 }}>
                      {lang === 'bn'
                        ? 'নমুনা মূল্য। পেমেন্টের আগেই মোট খরচ, প্ল্যাটফর্ম ফি ও বাতিলের নিয়ম দেখানো হয়।'
                        : 'Sample prices. Total, platform fee and cancellation rule are shown before you pay.'}
                    </p>
                  </>
                )}

                {selectedSegment === 'near' && (
                  <>
                    <div className="dl-rows">
                      {NEARBY_FACILITIES.map((facility) => (
                        <div key={facility.name} className="dl-row">
                          <span className="ic">{renderSvg(facility.key)}</span>
                          <span>
                            <b>{lang === 'bn' ? facility.nameBn : facility.name}</b>
                            <small>{lang === 'bn' ? facility.distBn : facility.dist}</small>
                          </span>
                          <span className="pr" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                            {lang === 'bn' ? 'মানচিত্র' : 'Map'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="dl-note" style={{ margin: 0 }}>
                      {lang === 'bn'
                        ? 'নমুনা দূরত্ব। আপনার অবস্থান কেবল দূরত্ব পরিমাপে ব্যবহৃত হয় এবং কোথাও সংরক্ষিত হয় না।'
                        : 'Sample distances. Your location is used only to sort and is never stored.'}
                    </p>
                  </>
                )}

                {selectedSegment === 'know' && (
                  <ul className="dl-know">
                    {droneSpot.know.map((tip, idx) => (
                      <li key={idx}>
                        <b>
                          {lang === 'bn'
                            ? ['পরিকল্পনা', 'নিরাপত্তা', 'পরামর্শ'][idx] || 'পরামর্শ'
                            : ['Plan', 'Safety', 'Tip'][idx] || 'Tip'}
                        </b>
                        {tip}
                      </li>
                    ))}
                    <li>
                      <b>{lang === 'bn' ? 'সেরা সময়' : 'Best time'}</b>
                      {destination.content?.bestTime || droneDest.best}
                    </li>
                  </ul>
                )}

                {selectedSegment === 'help' && (
                  <div className="dl-rows">
                    {contacts.map((contact) => (
                      <a
                        key={`hub-${contact.kind}-${contact.phone}`}
                        href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                        className="dl-row"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="ic">{renderSvg('phone')}</span>
                        <span>
                          <b>
                            {lang === 'bn' && contact.labelBn ? contact.labelBn : contact.label}
                          </b>
                          <small>
                            {lang === 'bn' ? 'সরাসরি কল করতে ট্যাপ করুন' : 'Tap to call'}
                          </small>
                        </span>
                        <span className="pr" style={{ fontSize: '20px' }}>
                          {contact.phone}
                        </span>
                      </a>
                    ))}
                    <Link
                      href="/help/lost-found"
                      className="dl-row"
                      style={{ textDecoration: 'none' }}
                    >
                      <span className="ic">{renderSvg('lost')}</span>
                      <span>
                        <b>{lang === 'bn' ? 'লস্ট অ্যান্ড ফাউন্ড' : 'Lost and found'}</b>
                        <small>
                          {lang === 'bn' ? 'হারানো জিনিস রিপোর্ট করুন' : 'Report a lost item'}
                        </small>
                      </span>
                      <span className="pr">
                        {renderSvg('arrow', 'style="width:20px;height:20px"')}
                      </span>
                    </Link>
                    <Link href="/help/report" className="dl-row" style={{ textDecoration: 'none' }}>
                      <span className="ic">{renderSvg('report')}</span>
                      <span>
                        <b>{lang === 'bn' ? 'সমস্যার অভিযোগ' : 'Report a problem'}</b>
                        <small>
                          {lang === 'bn'
                            ? 'অতিরিক্ত ভাড়া, নিরাপত্তা, লিস্টিং'
                            : 'Overcharging, safety, listing'}
                        </small>
                      </span>
                      <span className="pr">
                        {renderSvg('arrow', 'style="width:20px;height:20px"')}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Listings in Destination */}
      <section className="dl-sec" id="list" style={{ paddingTop: 0 }}>
        <div className="dl-wrap">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'end',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
                {lang === 'bn'
                  ? `${destination.nameBn || destination.name}-এ জনপ্রিয়`
                  : `Popular in ${destination.name}`}
              </div>
              <h2 className="dl-h2" style={{ marginBottom: 0 }}>
                {lang === 'bn' ? 'বুক করুন' : 'Book'}{' '}
                <span className="serif" style={{ color: 'var(--accent)' }}>
                  {lang === 'bn' ? 'সেরা সেবাগুলো।' : 'the good stuff.'}
                </span>
              </h2>
            </div>
            <p className="dl-lead" style={{ maxWidth: '380px' }}>
              {lang === 'bn'
                ? 'লিস্টিং, মূল্য ও প্রাপ্যতা অনুমোদিত প্রোভাইডারদের থেকে সরবরাহ করা হয়।'
                : 'Listings, prices and availability are provided by approved providers.'}
            </p>
          </div>

          {inventory.hotels.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3 className="text-title font-bold text-fg">
                  {lang === 'bn' ? 'জনপ্রিয় হোটেল ও রিসোর্ট' : 'Popular stays'}
                </h3>
                <Link
                  href={`/d/${destination.slug}/stay`}
                  className="text-label text-primary hover:underline"
                >
                  {lang === 'bn' ? 'সবগুলো দেখুন →' : 'See all stays →'}
                </Link>
              </div>
              <CardRow label="Popular stays">
                {inventory.hotels.slice(0, 6).map((hotel) => (
                  <CardRowItem key={hotel.id}>
                    <HotelCard hotel={hotel} spotName={spotName(hotel.spotSlug)} />
                  </CardRowItem>
                ))}
              </CardRow>
            </div>
          )}

          {inventory.venues.length > 0 && (
            <div style={{ marginTop: '36px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h3 className="text-title font-bold text-fg">
                  {lang === 'bn' ? 'খাবার ও রেস্তোরাঁ' : 'Places to eat'}
                </h3>
                <Link
                  href={`/d/${destination.slug}/food`}
                  className="text-label text-primary hover:underline"
                >
                  {lang === 'bn' ? 'সবগুলো দেখুন →' : 'See all dining →'}
                </Link>
              </div>
              <CardRow label="Places to eat">
                {inventory.venues.slice(0, 6).map((venue) => (
                  <CardRowItem key={venue.id}>
                    <VenueCard venue={venue} />
                  </CardRowItem>
                ))}
              </CardRow>
            </div>
          )}

          {inventory.hotels.length === 0 && inventory.venues.length === 0 && (
            <p className="dl-lead" style={{ marginTop: '32px' }}>
              {lang === 'bn'
                ? 'এই গন্তব্যে এখনো কোনো সেবা তালিকাভুক্ত হয়নি। শীঘ্রই আরও সেবা যুক্ত হবে।'
                : 'No listings have been posted for this destination yet. More services will be available soon.'}
            </p>
          )}
        </div>
      </section>

      {/* Destination Help */}
      <section
        className="dl-sec"
        id="dhelp"
        style={{ background: 'var(--card-bg, var(--surface))', borderTop: '1px solid var(--line)' }}
      >
        <div className="dl-wrap">
          <div>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn'
                ? `${destination.nameBn || destination.name}-এ সহায়তা`
                : `Help in ${destination.name}`}
            </div>
            <h2 className="dl-h2">
              {lang === 'bn' ? 'নিরাপদ ভ্রমণ' : 'Safe trips'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'শুরু হোক এখান থেকেই।' : 'start here.'}
              </span>
            </h2>
          </div>

          <div className="dl-help-grid">
            {contacts.map((contact) => (
              <a
                key={`${contact.kind}-${contact.phone}`}
                href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                className={`dl-help-card ${contact.kind === 'NATIONAL' ? 'em' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                {renderSvg('phone')}
                <div className="big">{contact.phone}</div>
                <b>{lang === 'bn' && contact.labelBn ? contact.labelBn : contact.label}</b>
                <p>
                  {contact.kind === 'NATIONAL'
                    ? lang === 'bn'
                      ? 'কোস্টলাইন কেবল জরুরি নম্বর প্রদর্শন করে; এটি উদ্ধারকারী দল পাঠায় না।'
                      : 'Coastline shows helpline numbers; it does not dispatch emergency help.'
                    : lang === 'bn'
                      ? 'সরাসরি কল করতে ট্যাপ করুন।'
                      : 'Tap to call directly.'}
                </p>
              </a>
            ))}

            <div className="dl-help-card">
              {renderSvg('pin')}
              <b style={{ fontSize: '20px' }}>
                {lang === 'bn' ? 'কোস্টলাইন ডেস্ক' : 'Coastline desk'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'প্রধান স্পটগুলোতে ডেস্ক কর্মীরা টিকিট, হারানো জিনিস ও অভিযোগ গ্রহণ করেন।'
                  : 'Desk staff at main spots handle tickets, lost items and complaints.'}
              </p>
            </div>

            <Link
              href="/help/lost-found"
              className="dl-help-card"
              style={{ textDecoration: 'none' }}
            >
              {renderSvg('lost')}
              <b style={{ fontSize: '20px' }}>
                {lang === 'bn' ? 'কিছু হারিয়েছেন?' : 'Lost something?'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'রিপোর্ট করুন, ডেস্ক থেকে লগ করা পাওয়া জিনিসের তালিকার সাথে মেলানো হবে।'
                  : 'Report it and we will match it against items logged by the desk.'}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Next Destination Teaser Card */}
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
              <small>{lang === 'bn' ? 'পরবর্তী গন্তব্য' : 'Next destination'}</small>
              <h3>{lang === 'bn' ? `${nextDest.bn} →` : `${nextDest.name} →`}</h3>
              <p className="dl-bn" style={{ fontSize: '22px', margin: '8px 0 0' }}>
                {lang === 'bn' ? nextDest.name : nextDest.bn}
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Media Attribution */}
      <section className="dl-sec py-8 border-t border-line/50 bg-surface/30">
        <div className="dl-wrap">
          <MediaCreditsList />
        </div>
      </section>

      {/* Floating Help Button */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label="Help and emergency"
        className="dl-fab"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="m4.9 4.9 4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M4.9 19.1l4.3-4.3" />
        </svg>
        <span>{lang === 'bn' ? 'সহায়তা' : 'Help'}</span>
      </button>

      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
