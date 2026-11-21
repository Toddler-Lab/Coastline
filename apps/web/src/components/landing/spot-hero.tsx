'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/patterns/language';
import { FlyTransitionListener } from './fly-transition';

export interface SpotHeroSpot {
  slug: string;
  name: string;
  nameBn?: string | null;
  kind: string;
  img: string;
}

export interface SpotHeroProps {
  destinationSlug: string;
  destinationName: string;
  destinationNameBn?: string | null;
  spots: SpotHeroSpot[];
  currentSlug: string;
  nameBn?: string | null;
  kindLabel: string;
  description?: string | null;
  coords: string;
  alt: string;
  bestTime?: string | null;
}

/** Immersive spot hero: every spot in the destination is a nested background layer. */
export function SpotHero({
  destinationSlug,
  destinationName,
  destinationNameBn,
  spots,
  currentSlug,
  nameBn,
  kindLabel,
  description,
  coords,
  alt,
  bestTime,
}: SpotHeroProps) {
  const { lang } = useLanguage();
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const currentIdx = Math.max(
    0,
    spots.findIndex((spot) => spot.slug === currentSlug),
  );
  const activeIdx = previewIdx ?? currentIdx;

  return (
    <>
      <FlyTransitionListener />
      <section
        className="dl-spot-stage"
        aria-label={`${lang === 'bn' ? destinationNameBn || destinationName : destinationName} spot hero`}
      >
        {/* Nested backgrounds: the selected spot sits above the others and crossfades. */}
        <div className="dl-layer on" aria-hidden="true">
          <div className="dl-cam">
            {spots.map((spot, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={spot.slug}
                src={`/media/places/${spot.img}.webp`}
                alt=""
                loading={idx === currentIdx ? 'eager' : 'lazy'}
                className="dl-spot-layer"
                style={{ opacity: idx === activeIdx ? 1 : 0 }}
              />
            ))}
          </div>
        </div>
        <div className="dl-shade" aria-hidden="true" />

        <div className="dl-spot-copy dl-wrap">
          <div className="dl-spot-meta">
            <span className="kind">{kindLabel}</span>
            <span>{coords}</span>
            <span>ALT {alt} M</span>
            {bestTime ? (
              <span>
                {lang === 'bn' ? 'সেরা সময়' : 'Best time'}: {bestTime}
              </span>
            ) : null}
          </div>

          <h1 className="dl-spot-title">
            {lang === 'bn' && nameBn ? nameBn : spots[currentIdx]?.name}
          </h1>
          {lang === 'bn' && nameBn ? (
            <p style={{ color: 'var(--on-media-muted)', margin: '0 0 4px' }}>
              {spots[currentIdx]?.name}
            </p>
          ) : nameBn ? (
            <p lang="bn" style={{ color: 'var(--on-media-muted)', margin: '0 0 4px' }}>
              {nameBn}
            </p>
          ) : null}
          {description ? (
            <p
              style={{
                maxWidth: '680px',
                color: 'var(--on-media-muted)',
                margin: '0 0 18px',
              }}
            >
              {description}
            </p>
          ) : null}

          {/* Spot picker: deep links to each spot with the fly-through transition. */}
          <div className="dl-spot-picker" role="group" aria-label="Spots in this destination">
            {spots.map((spot, idx) => (
              <Link
                key={spot.slug}
                href={`/d/${destinationSlug}/s/${spot.slug}`}
                data-fly
                data-flyimg={`/media/places/${spot.img}.webp`}
                aria-current={idx === currentIdx ? 'page' : undefined}
                onMouseEnter={() => setPreviewIdx(idx)}
                onMouseLeave={() => setPreviewIdx(null)}
                onFocus={() => setPreviewIdx(idx)}
                onBlur={() => setPreviewIdx(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/places/${spot.img}.webp`} alt="" loading="lazy" />
                <b>{lang === 'bn' && spot.nameBn ? spot.nameBn : spot.name}</b>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
