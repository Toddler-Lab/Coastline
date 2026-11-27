'use client';

import React from 'react';
import { AlertTriangle, Compass, ShieldCheck, Sunset, Waves } from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { DroneDestination } from '@/lib/drone-landing-data';

export interface DestinationHeroProps {
  destination: DestinationDetailDto;
  droneDest: DroneDestination;
  lang: 'en' | 'bn';
  isCoxsBazar: boolean;
}

export function DestinationHero({
  destination,
  droneDest,
  lang,
  isCoxsBazar,
}: DestinationHeroProps) {
  const topAlert = destination.topAlert ?? destination.alerts?.[0] ?? null;

  return (
    <>
      <header className="dl-dest-masthead" aria-label={`${destination.name} Masthead`}>
        <div className="dl-masthead-media">
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

        <div className="dl-masthead-scrim" />

        <div className="dl-wrap dl-dest-masthead-body">
          <div className="mb-3">
            <span className="dl-dest-badge">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {lang === 'bn'
                  ? isCoxsBazar
                    ? 'চট্টগ্রাম বিভাগ · বঙ্গোপসাগর উপকূল'
                    : 'পর্যটন অঞ্চল'
                  : isCoxsBazar
                    ? 'Chattogram Division · Bay of Bengal Coast'
                    : 'Travel Territory'}
              </span>
            </span>
          </div>

          <h1 className="dl-d-title dl-swap">{destination.name}</h1>
          <div className="dl-d-bn">{destination.nameBn || droneDest.bn}</div>
          <p className="dl-d-tag">
            {destination.tagline ||
              (lang === 'bn' && droneDest.tagBn ? droneDest.tagBn : droneDest.tag)}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white">
              <span className="text-white/60">{lang === 'bn' ? 'মৌসুম:' : 'Season:'}</span>
              <span>{destination.content?.bestTime?.split('.')[0] || droneDest.best}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white">
              <span className="text-white/60">{lang === 'bn' ? 'যাতায়াত:' : 'Transit:'}</span>
              <span>{lang === 'bn' ? 'বিমান বা বাস' : 'Fly or bus'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium text-white">
              <span className="text-white/60">{lang === 'bn' ? 'স্পট:' : 'Spots:'}</span>
              <span>
                {lang === 'bn'
                  ? `${destination.spots.length || droneDest.spots.length}টি স্থান`
                  : `${destination.spots.length || droneDest.spots.length} spots`}
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="dl-wrap">
        {topAlert ? (
          <div className="dl-dest-alert" role={topAlert.severity === 'DANGER' ? 'alert' : 'status'}>
            <AlertTriangle aria-hidden="true" className="size-5 shrink-0" />
            <div>
              <b>
                {topAlert.title}{' '}
                <span className="dl-sample">{topAlert.severity.toLowerCase()}</span>
              </b>
              {topAlert.body ? <div className="mt-1 text-sm">{topAlert.body}</div> : null}
            </div>
          </div>
        ) : null}

        <div className="dl-pulse-strip" role="region" aria-label="Current field conditions">
          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Waves className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'জোয়ার-ভাটার সময়' : 'Tide schedule'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn'
                  ? isCoxsBazar
                    ? 'জোয়ার: ২:৪৫ PM (+১.৮ মি) · ভাটা: ৮:৩০ PM'
                    : 'স্বাভাবিক প্রবাহ'
                  : isCoxsBazar
                    ? 'High: 2:45 PM (+1.8m) · Low: 8:30 PM'
                    : 'Normal waters'}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              <ShieldCheck className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'সৈকত সংকেত ও সতর্কতা' : 'Sea safety flag'}
              </span>
              <span className="dl-pulse-val text-emerald-700 dark:text-emerald-300">
                {lang === 'bn'
                  ? 'সবুজ পতাকা · লাইফগার্ড পোস্টের কাছে নিরাপদ'
                  : 'Green flag · Safe near lifeguard towers'}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon text-amber-600 dark:text-amber-400 bg-amber-500/10">
              <Sunset className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'আজকের সূর্যাস্ত' : 'Sunset today'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn' ? 'বিকাল ৫:১৮ (কলাতলী ও সুগন্ধা)' : '5:18 PM at Kolatoli & Sugandha'}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Compass className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'আবহাওয়া ও বাতাস' : 'Conditions'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn'
                  ? '২৮°সে · মৃদু দক্ষিণ-পশ্চিম বাতাস (১২ নট)'
                  : '28°C · Gentle SW breeze (12 kt)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
