'use client';

import React, { useState } from 'react';

/**
 * Persistent full-viewport background video (fixed in viewport) with an instant
 * WebP poster fallback. In Lite mode, only the poster is rendered (zero video fetch).
 */
export function FixedVideoBackdrop({
  video,
  poster,
  liteMode = false,
  scrimVariant = 'hero',
}: {
  video?: string;
  poster: string;
  liteMode?: boolean;
  scrimVariant?: 'hero' | 'destination';
}) {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#06100f]"
      aria-hidden="true"
    >
      {/* Instant LCP WebP poster */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        loading="eager"
        fetchPriority="high"
        className="h-full w-full object-cover"
      />

      {/* High-res looping video fades in smoothly once buffered; skipped in Lite mode */}
      {!liteMode && video ? (
        <video
          key={video}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          poster={poster}
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            videoReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <source src={`/media/video/${video}.mp4`} type="video/mp4" />
        </video>
      ) : null}

      {/* Subtle atmospheric vignette so footage stays bright and luminous glass refracts cleanly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            scrimVariant === 'destination'
              ? 'linear-gradient(180deg, rgba(6,16,15,0.18) 0%, rgba(6,16,15,0.06) 45%, rgba(6,16,15,0.34) 100%)'
              : 'linear-gradient(105deg, rgba(6,16,15,0.34) 0%, rgba(6,16,15,0.12) 45%, rgba(6,16,15,0.04) 100%), linear-gradient(180deg, rgba(6,16,15,0.14) 0%, rgba(6,16,15,0) 32%, rgba(6,16,15,0.36) 100%)',
        }}
      />
    </div>
  );
}
