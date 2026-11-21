'use client';

import React from 'react';
import type { DestinationDetailDto, DestinationSummaryDto } from '@coastline/api-contracts';
import type { SearchEntry } from '@/lib/search';
import type { InventoryResult } from '@/lib/places-server';
import { inventoryCounts, servicesPresent } from '@/lib/places';
import { useLanguage } from '@/components/patterns/language';
import { MediaCreditsList } from '@/components/patterns/media-credits';
import { DroneStage } from './drone-stage';
import { PlatformMetricsBar } from './platform-metrics-bar';
import { BangladeshMapSection } from './bangladesh-map';
import { SpotsRailSection } from './spots-rail';
import { ServicesBandSection } from './services-band';
import { PhotographerPromoSection } from './photographer-promo';
import { LandingHelpSection } from './landing-help';
import { FlyTransitionListener } from './fly-transition';

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
  inventory,
}: DroneLandingViewProps) {
  const { lang } = useLanguage();
  const services = inventory ? servicesPresent(inventoryCounts(inventory)) : [];

  return (
    <div
      className="drone-landing-scope relative w-full bg-bg text-fg"
      data-accent={destination?.accent ?? 'NEUTRAL'}
    >
      {/* Global fly-through transition animator */}
      <FlyTransitionListener />

      {/* 1. National hero stage: drone video / stills presenting Bangladesh */}
      <DroneStage lang={lang} destinations={destinations} searchIndex={searchIndex} />

      {/* 2. Platform metrics and environmental standards ribbon */}
      <PlatformMetricsBar lang={lang} />

      {/* 3. Fly the map: interactive territorial zones and pins */}
      <BangladeshMapSection lang={lang} />

      {/* 4. Spots rail: filterable, with nested destination backgrounds */}
      <SpotsRailSection lang={lang} />

      {/* 5. Services band: only types with active listings in the destination */}
      <ServicesBandSection
        lang={lang}
        destinationSlug={destination?.slug ?? 'coxs-bazar'}
        services={services}
      />

      {/* 6. Photographers: the signature service */}
      <PhotographerPromoSection lang={lang} />

      {/* 7. Help: emergency, lost and found, reports, nearby facilities */}
      <LandingHelpSection lang={lang} />

      {/* 8. Media attribution */}
      <section className="dl-sec py-10 border-t border-line/60 bg-surface/40">
        <div className="dl-wrap">
          <MediaCreditsList />
        </div>
      </section>
    </div>
  );
}
