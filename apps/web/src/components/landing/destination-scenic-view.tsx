'use client';

import React, { useEffect, useState } from 'react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { InventoryResult } from '@/lib/places-server';
import { cn } from '@/lib/cn';
import {
  DRONE_DESTINATIONS,
  type DroneDestination,
  type DroneSpot,
} from '@/lib/scenic-places-data';
import { useLanguage } from '@/components/patterns/language';
import { MediaCreditsList } from '@/components/patterns/media-credits';
import { FlyTransitionListener } from './fly-transition';
import { FixedVideoBackdrop } from './fixed-video-backdrop';
import { DestinationHero } from './destination-hero';
import { DestinationSpotHub } from './destination-spot-hub';
import { DestinationListings } from './destination-listings';
import { DestinationSupport } from './destination-support';
import { ScrollReveal } from './scroll-reveal';

const LITE_MODE_KEY = 'coastline_lite_mode';

export interface DestinationDroneViewProps {
  destination: DestinationDetailDto;
  inventory: InventoryResult;
  slug: string;
}

export function DestinationDroneView({ destination, inventory, slug }: DestinationDroneViewProps) {
  const { lang } = useLanguage();
  const [selectedSpotIdx, setSelectedSpotIdx] = useState(0);
  const [selectedFilterSpot, setSelectedFilterSpot] = useState<string>('all');
  const [liteMode, setLiteMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LITE_MODE_KEY);
      if (saved === 'true' || saved === 'false') {
        setLiteMode(saved === 'true');
        return;
      }
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      if (conn?.saveData || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setLiteMode(true);
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const toggleLiteMode = () => {
    setLiteMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LITE_MODE_KEY, String(next));
      } catch {
        // Ignore storage access errors
      }
      return next;
    });
  };

  const destIndex = DRONE_DESTINATIONS.findIndex(
    (d) =>
      d.id === slug ||
      d.id === destination.slug ||
      d.aliases?.includes(slug) ||
      destination.slug.startsWith(d.id) ||
      d.id.startsWith(destination.slug),
  );
  const droneDest: DroneDestination =
    destIndex !== -1 ? DRONE_DESTINATIONS[destIndex] : DRONE_DESTINATIONS[0];
  const seededList = DRONE_DESTINATIONS.filter((d) =>
    ['coxs-bazar', 'sylhet', 'rangamati'].includes(d.id),
  );
  const seededIdx = seededList.findIndex((d) => d.id === droneDest.id);
  const nextDest =
    seededList[(seededIdx >= 0 ? seededIdx + 1 : 0) % seededList.length] ?? DRONE_DESTINATIONS[0];

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

  const isCoxsBazar =
    destination.slug === 'coxs-bazar' ||
    destination.slug === 'coxs' ||
    slug === 'coxs-bazar' ||
    slug === 'coxs';

  const posterPath = droneDest.video
    ? `/media/places/${droneDest.video}_poster.webp`
    : `/media/places/${droneDest.hero}.webp`;

  return (
    <div
      className={cn(
        'drone-landing-scope relative w-full text-fg',
        liteMode && 'dl-lite',
      )}
      style={{ '--accent': destination.accent } as React.CSSProperties}
    >
      <FixedVideoBackdrop
        video={droneDest.video}
        poster={posterPath}
        liteMode={liteMode}
        scrimVariant="destination"
      />

      {!liteMode ? <FlyTransitionListener /> : null}

      <div className="relative z-10 pb-8">
        <DestinationHero
          destination={destination}
          droneDest={droneDest}
          lang={lang}
          isCoxsBazar={isCoxsBazar}
          liteMode={liteMode}
          onToggleLite={toggleLiteMode}
        />

        <div className="dl-glass-feed space-y-5">
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto max-w-[1280px] rounded-3xl">
              <DestinationSpotHub
                destination={destination}
                droneDest={droneDest}
                droneSpot={droneSpot}
                selectedSpotIdx={selectedSpotIdx}
                onSelectSpot={(idx, spotSlug) => {
                  setSelectedSpotIdx(idx);
                  setSelectedFilterSpot(spotSlug);
                }}
                onJumpToListings={(spotSlug) => {
                  setSelectedFilterSpot(spotSlug);
                  document.getElementById('list')?.scrollIntoView({ behavior: 'smooth' });
                }}
                lang={lang}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto max-w-[1280px] rounded-3xl">
              <DestinationListings
                destination={destination}
                droneDest={droneDest}
                inventory={inventory}
                selectedFilterSpot={selectedFilterSpot}
                onSelectFilterSpot={setSelectedFilterSpot}
                lang={lang}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto max-w-[1280px] rounded-3xl overflow-hidden">
              <DestinationSupport destination={destination} nextDest={nextDest} lang={lang} />
            </div>
          </ScrollReveal>

          <section className="dl-glass-panel mx-auto max-w-[1280px] rounded-3xl px-6 py-6">
            <MediaCreditsList />
          </section>
        </div>
      </div>
    </div>
  );
}
