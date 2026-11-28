'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Compass,
  MapPin,
  Navigation,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { DroneDestination } from '@/lib/scenic-places-data';
import { AmbientAudioControl } from './ambient-audio-control';

export interface DestinationHeroProps {
  destination: DestinationDetailDto;
  droneDest: DroneDestination;
  lang: 'en' | 'bn';
  isCoxsBazar: boolean;
  liteMode?: boolean;
  onToggleLite?: () => void;
}

export function DestinationHero({
  destination,
  droneDest,
  lang,
  isCoxsBazar,
  liteMode = false,
  onToggleLite,
}: DestinationHeroProps) {
  const topAlert = destination.topAlert ?? destination.alerts?.[0] ?? null;

  const bestSeason =
    destination.content?.bestTime?.split('.')[0] || droneDest.best;
  const gettingThere =
    destination.content?.gettingThere?.split('.')[0] || droneDest.getThere;
  const spotCount = destination.spots.length || droneDest.spots.length;

  return (
    <>
      <header
        className="dl-dest-masthead dl-dest-masthead-transparent"
        aria-label={`${destination.name} Masthead`}
      >
        <div className="dl-hero-controls">
          <AmbientAudioControl lang={lang} liteMode={liteMode} />
          {onToggleLite ? (
            <button
              type="button"
              className="dl-hero-pause"
              aria-pressed={liteMode}
              aria-label={
                liteMode
                  ? 'Switch to High-Res mode with video and animations'
                  : 'Switch to Lite mode to save data and disable video'
              }
              onClick={onToggleLite}
            >
              {liteMode ? (
                <Sparkles aria-hidden className="size-4 text-sun" />
              ) : (
                <Zap aria-hidden className="size-4 text-sun" />
              )}
              <span>
                {liteMode
                  ? lang === 'bn'
                    ? 'হাই-রেস মোড'
                    : 'HD Video'
                  : lang === 'bn'
                    ? 'লাইট মোড'
                    : 'Lite Mode'}
              </span>
            </button>
          ) : null}
        </div>

        <div className="dl-wrap dl-dest-masthead-body">
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-2 text-xs font-medium text-white/75"
          >
            <Link href="/" className="hover:text-white transition-colors">
              {lang === 'bn' ? 'বাংলাদেশ' : 'Bangladesh'}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white">{destination.name}</span>
          </nav>

          <h1 className="dl-d-title dl-swap">{destination.name}</h1>
          <div className="dl-d-bn">{destination.nameBn || droneDest.bn}</div>
          <p className="dl-d-tag">
            {destination.tagline ||
              (lang === 'bn' && droneDest.tagBn ? droneDest.tagBn : droneDest.tag)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <a
              href="#spots"
              className="inline-flex items-center gap-1.5 rounded-full bg-action-bg px-4 py-2 text-xs font-bold text-action-fg shadow-md transition-transform hover:scale-105"
            >
              <MapPin className="size-3.5" />
              {lang === 'bn' ? `${spotCount}টি স্পট দেখুন` : `Explore ${spotCount} spots`}
            </a>
            <a
              href="#list"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
            >
              {lang === 'bn' ? 'বুকিং ও সেবা' : 'Stays & Dining'}
            </a>
            <a
              href="#help"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/25"
            >
              {lang === 'bn' ? 'সহায়তা ও জরুরি' : 'Help & 999'}
            </a>
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

        <div className="dl-pulse-strip" role="region" aria-label="Destination overview">
          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Calendar className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'সেরা সময়' : 'Best season'}
              </span>
              <span className="dl-pulse-val">{bestSeason}</span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Navigation className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'যাতায়াত' : 'Getting there'}
              </span>
              <span className="dl-pulse-val">{gettingThere}</span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon">
              <Compass className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'সক্রিয় স্পট' : 'Spot hubs'}
              </span>
              <span className="dl-pulse-val">
                {lang === 'bn'
                  ? `${spotCount}টি পর্যটন স্থান`
                  : `${spotCount} destinations inside ${destination.name}`}
              </span>
            </div>
          </div>

          <div className="dl-pulse-cell">
            <div className="dl-pulse-icon text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              <ShieldCheck className="size-5" />
            </div>
            <div className="dl-pulse-meta">
              <span className="dl-pulse-label">
                {lang === 'bn' ? 'নিরাপত্তা ও সহায়তা' : 'On-spot help'}
              </span>
              <span className="dl-pulse-val">
                {isCoxsBazar
                  ? lang === 'bn'
                    ? '৯৯৯ জরুরি সেবা ও বিচ ডেস্ক'
                    : '999 Emergency & Beach Desk'
                  : lang === 'bn'
                    ? '৯৯৯ জাতীয় জরুরি সেবা'
                    : '999 National Emergency'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
