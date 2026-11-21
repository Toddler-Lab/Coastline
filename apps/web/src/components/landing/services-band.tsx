'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BedDouble,
  Camera,
  Car,
  Compass,
  Sailboat,
  Ticket,
  Umbrella,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { SERVICES_CATALOG } from '@/lib/drone-landing-data';

const SERVICE_ICONS: Record<string, LucideIcon> = {
  stay: BedDouble,
  food: UtensilsCrossed,
  sunbed: Umbrella,
  ride: Car,
  boat: Sailboat,
  tour: Compass,
  ticket: Ticket,
  guide: UserRound,
  camera: Camera,
};

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

/** Keys in `servicesPresent` output mapped to the catalogue keys used here. */
const INVENTORY_TO_CATALOG: Record<string, string> = {
  stay: 'stay',
  food: 'food',
  sunbeds: 'sunbed',
};

export function ServicesBandSection({
  lang = 'en',
  destinationSlug = 'coxs-bazar',
  services,
}: {
  lang?: 'en' | 'bn';
  destinationSlug?: string;
  /** Service keys that have active listings. When omitted, all catalogue services show. */
  services?: string[];
}) {
  const bandRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      if (!bandRef.current) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const r = bandRef.current.getBoundingClientRect();
      const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -0.18;
      setParallaxY(offset);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const keys = services
    ? Object.keys(SERVICES_CATALOG).filter(
        (key) =>
          services.includes(key) ||
          services.includes(CANONICAL_SERVICE_KEYS[key] ?? '') ||
          services.some((s) => INVENTORY_TO_CATALOG[s] === key),
      )
    : Object.keys(SERVICES_CATALOG);
  // Photographers are a signature service and have their own section, but stay on the band.

  return (
    <section className="dl-band dl-sec" id="services" ref={bandRef}>
      <div className="bgp" style={{ transform: `translate3d(0, ${parallaxY}px, 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/places/bd_wooden_boats.webp" alt="" loading="lazy" />
      </div>
      <div className="veil" />
      <div className="wrap">
        <div style={{ maxWidth: '640px' }}>
          <div className="dl-eyebrow" style={{ color: 'var(--cream)' }}>
            {lang === 'bn' ? 'এক চেকআউট, এক টিকিট' : 'One checkout, one ticket'}
          </div>
          <h2 className="dl-h2">
            <span>{lang === 'bn' ? 'স্পটের সবকিছু,' : 'Everything at the spot,'}</span>{' '}
            <span className="serif">{lang === 'bn' ? 'এক জায়গায়।' : 'in one place.'}</span>
          </h2>
          <p className="dl-lead">
            {lang === 'bn'
              ? 'পেমেন্টের আগেই পুরো দাম, প্ল্যাটফর্ম ফি আর বাতিলের নিয়ম দেখুন। আপনার টিকিট অফলাইনেও খোলে — QR কোড আর মুখে বলা যায় এমন ছোট রেফারেন্সসহ।'
              : 'See the full price, platform fee and cancellation rule before you pay. Your ticket opens offline, with a QR code and a short reference you can read aloud.'}
          </p>
        </div>
        <div className="dl-svc">
          {keys.map((key) => {
            const item = SERVICES_CATALOG[key];
            const isSignature = key === 'camera';
            const Icon = SERVICE_ICONS[key] ?? Compass;
            const targetHref =
              key === 'camera'
                ? `/d/${destinationSlug}/photographers`
                : key === 'sunbed'
                  ? `/d/${destinationSlug}/sunbeds`
                  : `/d/${destinationSlug}/${CANONICAL_SERVICE_KEYS[key] || key}`;

            return (
              <Link key={key} href={targetHref} data-fly className={isSignature ? 'sig' : ''}>
                <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                <b>{lang === 'bn' ? item.bn : item.en}</b>
                <small>{lang === 'bn' ? item.dBn : item.d}</small>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
