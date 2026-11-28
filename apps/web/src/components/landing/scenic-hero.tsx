'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap } from 'lucide-react';
import type { DestinationSummaryDto } from '@coastline/api-contracts';
import type { SearchEntry } from '@/lib/search';
import { DRONE_DESTINATIONS } from '@/lib/scenic-places-data';
import { AmbientAudioControl } from './ambient-audio-control';

const DEFAULT_SEEDED = new Set(['coxs-bazar', 'sylhet', 'rangamati']);

export function DroneStage({
  lang = 'en',
  destinations = [],
  searchIndex: _searchIndex = [],
  liteMode = false,
  onToggleLite,
}: {
  lang?: 'en' | 'bn';
  destinations?: DestinationSummaryDto[];
  searchIndex?: SearchEntry[];
  liteMode?: boolean;
  onToggleLite?: () => void;
}) {
  const router = useRouter();

  const seededSlugs =
    destinations.length > 0 ? new Set(destinations.map((d) => d.slug)) : DEFAULT_SEEDED;

  const destOptions =
    destinations && destinations.length > 0
      ? destinations.map((d) => ({
          id: d.slug,
          name: d.name,
          bn: d.nameBn,
        }))
      : DRONE_DESTINATIONS.filter((d) => seededSlugs.has(d.id)).map((d) => ({
          id: d.id,
          name: d.name,
          bn: d.bn,
        }));

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const where =
      (form.elements.namedItem('where') as HTMLSelectElement)?.value ||
      destOptions[0]?.id ||
      'coxs-bazar';
    const when = (form.elements.namedItem('when') as HTMLInputElement)?.value;
    const guests = (form.elements.namedItem('guests') as HTMLSelectElement)?.value;
    const params = new URLSearchParams();
    if (when) params.set('when', when);
    if (guests) params.set('guests', guests);
    const qs = params.toString();
    router.push(`/d/${where}${qs ? `?${qs}` : ''}`);
  };

  return (
    <section
      id="hero"
      className="dl-stage dl-stage-transparent"
      aria-label="Scenic views of Bangladesh"
    >

      {/* Minimal, crisp left hero copy + glass search */}
      <div className="dl-hero-copy">
        <div className="dl-kicker">
          {lang === 'bn' ? 'কোস্টলাইন · বাংলাদেশ' : 'Coastline · Bangladesh'}
        </div>
        <h1 className="dl-hero-title">
          <span>{lang === 'bn' ? 'বাংলাদেশ,' : 'Bangladesh,'}</span>
          <br />
          <span className="serif">{lang === 'bn' ? 'নতুন চোখে।' : 'from above.'}</span>
        </h1>

        <p className="dl-hero-sub">
          {lang === 'bn'
            ? 'থাকা, খাবার, সানবেড, নৌকা ও স্থানীয় গাইড — বাংলাদেশের সব পর্যটন সেবা এক জায়গায়।'
            : 'Stays, dining, beach sunbeds, boats & local guides across Bangladesh — in one place.'}
        </p>

        <form className="dl-search" id="search" role="search" onSubmit={handleSearchSubmit}>
          <div className="dl-field">
            <label htmlFor="q-where">{lang === 'bn' ? 'কোথায়' : 'Where'}</label>
            <select id="q-where" name="where" defaultValue={destOptions[0]?.id || 'coxs-bazar'}>
              {destOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.bn ? `(${d.bn})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="dl-field">
            <label htmlFor="q-when">{lang === 'bn' ? 'কবে' : 'When'}</label>
            <input
              id="q-when"
              name="when"
              type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="dl-field">
            <label htmlFor="q-who">{lang === 'bn' ? 'অতিথি' : 'Guests'}</label>
            <select id="q-who" name="guests" defaultValue="2">
              <option value="1">{lang === 'bn' ? '১ জন অতিথি' : '1 guest'}</option>
              <option value="2">{lang === 'bn' ? '২ জন অতিথি' : '2 guests'}</option>
              <option value="3">{lang === 'bn' ? '৩ জন অতিথি' : '3 guests'}</option>
              <option value="4+">{lang === 'bn' ? '৪+ জন অতিথি' : '4+ guests'}</option>
            </select>
          </div>
          <button className="dl-btn dl-btn-primary" type="submit">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ width: '18px', height: '18px' }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span>{lang === 'bn' ? 'খুঁজুন' : 'Search'}</span>
          </button>
        </form>
      </div>

      {/* Ambient Sound + High-Res / Lite Mode Switcher */}
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

      {/* Scroll cue */}
      <div className="dl-scroll-cue">Scroll</div>
    </section>
  );
}
