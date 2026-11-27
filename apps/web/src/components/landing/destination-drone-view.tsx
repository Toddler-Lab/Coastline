'use client';

import React, { useState } from 'react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { InventoryResult } from '@/lib/places-server';
import {
  DRONE_DESTINATIONS,
  type DroneDestination,
  type DroneSpot,
} from '@/lib/drone-landing-data';
import { useLanguage } from '@/components/patterns/language';
import { MediaCreditsList } from '@/components/patterns/media-credits';
import { FlyTransitionListener } from './fly-transition';
import { DestinationHero } from './destination-hero';
import { DestinationSpotHub } from './destination-spot-hub';
import { DestinationListings } from './destination-listings';
import { DestinationSupport } from './destination-support';

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
      d.aliases?.includes(slug) ||
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

  const isCoxsBazar =
    destination.slug === 'coxs-bazar' ||
    destination.slug === 'coxs' ||
    slug === 'coxs-bazar' ||
    slug === 'coxs';

  return (
    <div
      className="drone-landing-scope relative w-full bg-bg text-fg"
      style={{ '--accent': destination.accent } as React.CSSProperties}
    >
      <FlyTransitionListener />

      <DestinationHero
        destination={destination}
        droneDest={droneDest}
        lang={lang}
        isCoxsBazar={isCoxsBazar}
      />

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

      <DestinationListings
        destination={destination}
        droneDest={droneDest}
        inventory={inventory}
        selectedFilterSpot={selectedFilterSpot}
        onSelectFilterSpot={setSelectedFilterSpot}
        lang={lang}
      />

      <DestinationSupport destination={destination} nextDest={nextDest} lang={lang} />

      <section className="dl-sec py-8 border-t border-line/50 bg-surface/30">
        <div className="dl-wrap">
          <MediaCreditsList />
        </div>
      </section>
    </div>
  );
}
