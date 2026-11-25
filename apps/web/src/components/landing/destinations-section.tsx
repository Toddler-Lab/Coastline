'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { DRONE_DESTINATIONS, type DroneDestination } from '@/lib/drone-landing-data';

const KIND_BADGES: Record<string, { en: string; bn: string; color: string }> = {
  SEA: { en: 'Coast & Sea', bn: 'সমুদ্র ও উপকূল', color: '#0B7A8F' },
  FOREST: { en: 'Swamp & Tea Hills', bn: 'জলাবন ও চা-বাগান', color: '#2F7D32' },
  LAKE: { en: 'Lakes & Islands', bn: 'হ্রদ ও দ্বীপ', color: '#2457A6' },
  HILL: { en: 'Cloud & Highlands', bn: 'পাহাড় ও মেঘ', color: '#8A5A1F' },
  MANGROVE: { en: 'Mangrove & Delta', bn: 'ম্যানগ্রোভ ও ব-দ্বীপ', color: '#3E6B4A' },
};

export function DestinationsSection({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  return (
    <section className="dl-sec py-16 md:py-24" id="destinations">
      <div className="dl-wrap">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-line/60">
          <div>
            <div className="dl-eyebrow">
              {lang === 'bn' ? 'বাংলাদেশের গন্তব্য অঞ্চল' : 'Destinations of Bangladesh'}
            </div>
            <h2 className="dl-h2 mb-0">
              <span>{lang === 'bn' ? 'পাঁচটি প্রাকৃতিক অঞ্চল,' : 'Five natural territories,'}</span>{' '}
              <span className="serif">{lang === 'bn' ? 'আপনার গন্তব্য বেছে নিন।' : 'choose where you land.'}</span>
            </h2>
          </div>
          <p className="dl-lead max-w-md text-sm text-muted mb-0">
            {lang === 'bn'
              ? 'নিচের যেকোনো অঞ্চলে ক্লিক করে সেখানকার সৈকত, হ্রদ, পাহাড় ও স্পটগুলো অন্বেষণ করুন এবং সরাসরি বুকিংয়ে প্রবেশ করুন।'
              : 'Select a regional territory to drop into its local spots, verified stays, beach sunbeds, dining, and scenic viewpoints.'}
          </p>
        </div>

        {/* 5 Destination Showcase Grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {DRONE_DESTINATIONS.map((dest, idx) => {
            const badge = KIND_BADGES[dest.kind] || {
              en: dest.kind,
              bn: dest.kind,
              color: dest.accent,
            };
            const isFullWidth = idx === 4; // Sundarbans spans full width on desktop

            return (
              <div
                key={dest.id}
                className={`group relative overflow-hidden rounded-3xl border border-line bg-surface shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl ${
                  isFullWidth ? 'lg:col-span-2' : ''
                }`}
              >
                {/* Visual Media Header */}
                <div
                  className={`relative w-full overflow-hidden bg-surface-alt ${
                    isFullWidth ? 'aspect-[21/9] min-h-[260px]' : 'aspect-[16/9]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/media/places/${dest.hero}.webp`}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                  {/* Telemetry pill */}
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white/90 backdrop-blur-md border border-white/15">
                      <Compass className="size-3.5 text-accent" />
                      {dest.coord}
                    </span>
                    <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-mono text-white/80 backdrop-blur-md border border-white/15">
                      ALT {dest.alt}M
                    </span>
                  </div>

                  {/* Territory kind badge */}
                  <div className="absolute right-4 top-4">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md"
                      style={{ backgroundColor: badge.color }}
                    >
                      {lang === 'bn' ? badge.bn : badge.en}
                    </span>
                  </div>

                  {/* Title & Tagline overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Territory 0{idx + 1}
                      </span>
                      <span className="font-bn text-sm text-white/80">{dest.bn}</span>
                    </div>
                    <h3 className="mt-1 text-2xl font-extrabold md:text-3xl tracking-tight">
                      {dest.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/85 line-clamp-1 max-w-xl">
                      {lang === 'bn' ? dest.tagBn : dest.tag}
                    </p>
                  </div>
                </div>

                {/* Destination Spots & Quick Actions */}
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-line text-xs">
                    <div>
                      <span className="text-muted block font-medium">Best Season</span>
                      <span className="font-bold text-fg mt-0.5 block">{dest.best}</span>
                    </div>
                    <div>
                      <span className="text-muted block font-medium">Getting There</span>
                      <span className="font-bold text-fg mt-0.5 block truncate">{dest.getThere}</span>
                    </div>
                  </div>

                  {/* Spot pills inside this destination */}
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
                      Key Spots ({dest.spots.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dest.spots.map((spot) => (
                        <Link
                          key={spot.id}
                          href={`/d/${dest.id}/s/${spot.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-fg transition-colors hover:bg-action-bg hover:text-action-fg"
                        >
                          <MapPin className="size-3 text-muted group-hover:text-white" />
                          {lang === 'bn' ? spot.bn : spot.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-line">
                    <span className="text-xs text-muted">
                      Full territory guide, stays & activities
                    </span>
                    <Link
                      href={`/d/${dest.id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-action-bg px-5 py-2.5 text-xs font-bold text-action-fg shadow-md transition-all hover:bg-action-bg/90 hover:scale-105"
                    >
                      Explore {dest.name} <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
