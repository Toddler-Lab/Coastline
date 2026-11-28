'use client';

import React, { useEffect, useState } from 'react';
import type { DestinationDetailDto, DestinationSummaryDto } from '@coastline/api-contracts';
import type { SearchEntry } from '@/lib/search';
import type { InventoryResult } from '@/lib/places-server';
import { cn } from '@/lib/cn';
import { useLanguage } from '@/components/patterns/language';
import { MediaCreditsList } from '@/components/patterns/media-credits';
import { DroneStage } from './scenic-hero';
import { FixedVideoBackdrop } from './fixed-video-backdrop';
import { DestinationsSection } from './destinations-section';
import { PlatformMetricsBar } from './platform-metrics-bar';
import { BangladeshMapSection } from './bangladesh-map';
import { SpotsRailSection } from './spots-rail';
import { AboutProjectSection } from './about-project-section';
import { PhotographerPromoSection } from './photographer-promo';
import { LandingHelpSection } from './landing-help';
import { FlyTransitionListener } from './fly-transition';
import { ScrollReveal } from './scroll-reveal';

const LITE_MODE_KEY = 'coastline_lite_mode';

export interface DroneLandingViewProps {
  destinations: DestinationSummaryDto[];
  destination: DestinationDetailDto | null;
  searchIndex: SearchEntry[];
  inventory: InventoryResult | null;
}

export function DroneLandingView({
  destinations,
  destination,
  searchIndex,
}: DroneLandingViewProps) {
  const { lang } = useLanguage();
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

  return (
    <div
      className={cn(
        'drone-landing-scope relative w-full text-fg',
        liteMode && 'dl-lite',
      )}
      data-accent={destination?.accent ?? 'NEUTRAL'}
    >
      {/* Persistent fixed 4K scenic video in background */}
      <FixedVideoBackdrop
        video="bd_cinematic"
        poster="/media/places/bd_cinematic_poster.webp"
        liteMode={liteMode}
        scrimVariant="hero"
      />

      {/* Global fly-through transition animator */}
      {!liteMode ? <FlyTransitionListener /> : null}

      <div className="relative z-10">
        {/* 1. Scenic hero stage */}
        <DroneStage
          lang={lang}
          destinations={destinations}
          searchIndex={searchIndex}
          liteMode={liteMode}
          onToggleLite={toggleLiteMode}
        />

        {/* Glassmorphism scrolling content over persistent background video */}
        <div className="dl-glass-feed">
          {/* 2. Destinations of Bangladesh: seeded regions + Coming soon */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl">
              <DestinationsSection lang={lang} destinations={destinations} />
            </div>
          </ScrollReveal>

          {/* 3. Interactive Bangladesh map covering regions and spots */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl">
              <BangladeshMapSection lang={lang} destinations={destinations} />
            </div>
          </ScrollReveal>

          {/* 4. Spots rail: filterable by region */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl">
              <SpotsRailSection lang={lang} destinations={destinations} />
            </div>
          </ScrollReveal>

          {/* 5. Platform metrics and environmental standards ribbon */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl overflow-hidden">
              <PlatformMetricsBar lang={lang} />
            </div>
          </ScrollReveal>

          {/* 6. About Coastline project: mission, independence, and verified standards */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl">
              <AboutProjectSection lang={lang} />
            </div>
          </ScrollReveal>

          {/* 7. Photographers: the signature service */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl">
              <PhotographerPromoSection lang={lang} />
            </div>
          </ScrollReveal>

          {/* 8. Help: emergency, lost and found, reports, nearby facilities */}
          <ScrollReveal lite={liteMode}>
            <div className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl">
              <LandingHelpSection lang={lang} />
            </div>
          </ScrollReveal>

          {/* 9. Media attribution */}
          <section className="dl-glass-panel mx-auto my-6 max-w-[1280px] rounded-3xl px-6 py-8">
            <MediaCreditsList />
          </section>
        </div>
      </div>
    </div>
  );
}
