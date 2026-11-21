'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { DestinationSummaryDto } from '@coastline/api-contracts';
import type { SearchEntry } from '@/lib/search';
import { DRONE_SLIDES, DRONE_DESTINATIONS } from '@/lib/drone-landing-data';

const HUD_TELEMETRY: Record<string, { env: string; wind: string }> = {
  bd: { env: '27°C · VIS 18KM', wind: 'NW 8KT' },
  'coxs-bazar': { env: '28°C · TIDE +1.8M', wind: 'SW 12KT' },
  coxs: { env: '28°C · TIDE +1.8M', wind: 'SW 12KT' },
  sylhet: { env: '24°C · MIST 85%', wind: 'CALM 4KT' },
  rangamati: { env: '25°C · LAKE 150M', wind: 'SE 6KT' },
  bandarban: { env: '21°C · CLOUDS 840M', wind: 'E 14KT' },
  sundarbans: { env: '26°C · TIDAL 2.4M', wind: 'S 10KT' },
};

export function DroneStage({
  lang = 'en',
  destinations = [],
  searchIndex = [],
}: {
  lang?: 'en' | 'bn';
  destinations?: DestinationSummaryDto[];
  searchIndex?: SearchEntry[];
}) {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [clickCoords, setClickCoords] = useState<{ x: string; y: string }>({ x: '78%', y: '50%' });
  const [timecode, setTimecode] = useState('00:00:00');

  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = DRONE_SLIDES[currentIdx];

  // Timecode counter for HUD
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const hours = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      setTimecode(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = useCallback(
    (i: number, originEl?: HTMLElement | null) => {
      if (i === currentIdx) return;

      if (originEl && stageRef.current) {
        const r = originEl.getBoundingClientRect();
        const stageR = stageRef.current.getBoundingClientRect();
        setClickCoords({
          x: `${((r.left + r.width / 2 - stageR.left) / stageR.width) * 100}%`,
          y: `${((r.top + r.height / 2 - stageR.top) / stageR.height) * 100}%`,
        });
      } else {
        setClickCoords({ x: '78%', y: '50%' });
      }

      setPrevIdx(currentIdx);
      setCurrentIdx(i);

      setTimeout(() => {
        setPrevIdx(null);
      }, 1500);
    },
    [currentIdx],
  );

  // Auto-advance sequencer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    timerRef.current = setTimeout(() => {
      goToSlide((currentIdx + 1) % DRONE_SLIDES.length);
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIdx, isPaused, goToSlide]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = stageRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    stageRef.current.style.setProperty('--px', px.toFixed(3));
    stageRef.current.style.setProperty('--py', py.toFixed(3));
  };

  const handlePointerLeave = () => {
    if (!stageRef.current) return;
    stageRef.current.style.setProperty('--px', '0');
    stageRef.current.style.setProperty('--py', '0');
  };

  const destOptions =
    destinations && destinations.length > 0
      ? destinations.map((d) => ({
          id: d.slug,
          name: d.name,
          bn: d.nameBn,
        }))
      : DRONE_DESTINATIONS.map((d) => ({
          id: d.id,
          name: d.name,
          bn: d.bn,
        }));

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const where = (form.elements.namedItem('where') as HTMLSelectElement)?.value || destOptions[0]?.id || 'coxs-bazar';
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
      ref={stageRef}
      id="hero"
      className={`dl-stage ${isPaused ? 'dl-paused' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      aria-label="Drone views of Bangladesh"
    >
      {/* Slides */}
      {DRONE_SLIDES.map((slide, i) => {
        const isActive = i === currentIdx;
        const isLeaving = i === prevIdx;
        const isEntering = isActive && prevIdx !== null;

        let layerClass = 'dl-layer';
        if (isEntering) layerClass += ' enter';
        else if (isActive) layerClass += ' on';
        else if (isLeaving) layerClass += ' leave';

        if (!isActive && !isLeaving) return null;

        return (
          <div
            key={slide.id}
            className={layerClass}
            style={
              {
                '--cx': clickCoords.x,
                '--cy': clickCoords.y,
              } as React.CSSProperties
            }
          >
            <div className="dl-cam">
              {slide.video ? (
                <video
                  autoPlay
                  muted
                  playsInline
                  loop
                  preload={i < 2 ? 'auto' : 'metadata'}
                  poster={`/media/places/${slide.poster || slide.img}.webp`}
                  aria-hidden="true"
                >
                  <source src={`/media/video/${slide.video}.mp4`} type="video/mp4" />
                </video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/media/places/${slide.img}.webp`}
                  alt=""
                  loading={i < 2 ? 'eager' : 'lazy'}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Atmospheric Mist & Gradient Scrim */}
      <div className="dl-mist" aria-hidden="true" />
      <div className="dl-shade" aria-hidden="true" />

      {/* Drone HUD overlay */}
      <div className="dl-hud" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <div className="tl">
          <span className="dl-rec">REC</span>
          <span>{timecode}</span>
          <span>4K · 30FPS</span>
        </div>
        <div className="tr">
          <span>{currentSlide.coord}</span>
          <span>
            ALT <b>{currentSlide.alt}</b> M
          </span>
          <span>GIMBAL −45°</span>
          <span>{HUD_TELEMETRY[currentSlide.id]?.env || '27°C'}</span>
        </div>
        <div className="dl-cross" />
        <div className="dl-horizon" />
      </div>

      {/* Right Place Rail */}
      <div
        className="dl-rail"
        role="tablist"
        aria-label="Places"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {DRONE_SLIDES.map((slide, i) => {
          const isSelected = i === currentIdx;
          return (
            <button
              key={slide.id}
              role="tab"
              type="button"
              aria-current={isSelected}
              onClick={(e) => goToSlide(i, e.currentTarget)}
            >
              <span className="n">0{i + 1}</span>
              <span className="t">{slide.name}</span>
              <span className="b">{slide.bn}</span>
              <span className="bar">
                <span
                  style={{
                    width: isSelected ? '100%' : '0%',
                    animation: isSelected && !isPaused ? 'dl-fill 8s linear forwards' : 'none',
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero Copy & Search */}
      <div className="dl-hero-copy">
        <div className="dl-kicker">
          {lang === 'bn'
            ? 'বাংলাদেশ ভ্রমণের স্বাধীন প্ল্যাটফর্ম'
            : 'An independent travel platform for Bangladesh'}
        </div>
        <h1 className="dl-hero-title">
          <span>{lang === 'bn' ? 'বাংলাদেশ,' : 'Bangladesh,'}</span>
          <br />
          <span className="serif">{lang === 'bn' ? 'ওপর থেকে।' : 'from above.'}</span>
        </h1>

        <div className="dl-place-name">
          <div
            className="dl-swap"
            key={currentSlide.id}
            style={{ display: 'flex', gap: '14px', alignItems: 'baseline', flexWrap: 'wrap' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E8A93A"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ width: '20px', height: '20px', alignSelf: 'center' }}
            >
              <path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <b>{currentSlide.id === 'bd' ? (lang === 'bn' ? 'সমগ্র বাংলাদেশ' : 'Whole of Bangladesh') : currentSlide.name}</b>
            <span>{currentSlide.bn}</span>
            {currentSlide.id !== 'bd' ? (
              <Link
                href={`/d/${currentSlide.id}`}
                data-fly
                data-flyimg={`/media/places/${currentSlide.img}.webp`}
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,.5)',
                  marginLeft: '6px',
                }}
              >
                {lang === 'bn' ? `${currentSlide.name} অঞ্চল দেখুন →` : `Explore ${currentSlide.name} →`}
              </Link>
            ) : (
              <span className="text-xs font-medium uppercase tracking-wider text-sun">
                {lang === 'bn' ? '৫টি পর্যটন অঞ্চল' : '5 Travel Regions · 24+ Spots'}
              </span>
            )}
          </div>
        </div>

        <p className="dl-hero-sub">
          {currentSlide.id === 'bd'
            ? lang === 'bn'
              ? 'বঙ্গোপসাগরের দীর্ঘতম বালুকাবেলা থেকে সিলেটের জলাবন ও চা-বাগান, রাঙ্গামাটির হ্রদ এবং সুন্দরবনের ম্যানগ্রোভ। নিচের যেকোনো অঞ্চল বেছে নিয়ে সেখানকার স্পটগুলো অন্বেষণ করুন।'
              : 'From the Bay of Bengal coastline to the flooded swamp forests of Sylhet, the island lakes of Rangamati, cloud peaks of Bandarban, and the mangrove delta of the Sundarbans. Choose a regional territory below to drop in.'
            : lang === 'bn'
              ? 'অঞ্চল বেছে নিন, তারপর সেখানকার সবকিছু এক জায়গায় বুক করুন — থাকা, খাবার, সানবেড, নৌকা, গাইড আর ফটোগ্রাফার। সহায়তা সবসময় এক ট্যাপ দূরে।'
              : 'Pick a destination region, then book everything there in one go — stays, food, sunbeds, boats, guides and photographers. Help is always one tap away.'}
        </p>

        {/* 3D Region Quick Launcher Pills */}
        <div className="mb-4 flex flex-wrap gap-2 pt-1" role="group" aria-label="Quick Region Selection">
          {DRONE_DESTINATIONS.map((d, idx) => (
            <button
              key={d.id}
              type="button"
              onClick={(e) => goToSlide(idx + 1, e.currentTarget)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/50 hover:bg-black/50"
              style={{
                boxShadow: currentIdx === idx + 1 ? `0 0 16px ${d.accent}aa` : undefined,
                borderColor: currentIdx === idx + 1 ? d.accent : undefined,
              }}
            >
              <span className="size-2 rounded-full" style={{ backgroundColor: d.accent }} />
              {lang === 'bn' ? d.bn : d.name}
            </button>
          ))}
        </div>

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
            <span>{lang === 'bn' ? 'খুঁজুন' : 'Search spots'}</span>
          </button>
        </form>
      </div>

      {/* Accessible Pause/Play button */}
      <button
        className="dl-hero-pause"
        type="button"
        id="heroPause"
        aria-pressed={isPaused}
        aria-label={isPaused ? 'Play the moving background' : 'Pause the moving background'}
        onClick={() => setIsPaused((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {isPaused ? <path d="M7 5l12 7-12 7z" /> : <path d="M8 5v14M16 5v14" />}
        </svg>
        <span>{isPaused ? 'Play' : 'Pause'}</span>
      </button>

      {/* Scroll cue */}
      <div className="dl-scroll-cue">Scroll</div>
    </section>
  );
}
