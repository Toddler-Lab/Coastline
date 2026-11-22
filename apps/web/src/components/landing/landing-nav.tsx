'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AccountMenuButton } from '@/components/patterns/workspace-switcher';
import { HelpTopButton } from '@/components/patterns/help';
import { useLanguage } from '@/components/patterns/language';

interface LandingNavProps {
  lang?: 'en' | 'bn';
  onLangChange?: (lang: 'en' | 'bn') => void;
}

export function LandingNav({ lang: propLang, onLangChange: propOnLangChange }: LandingNavProps) {
  const { lang: contextLang, setLang: setContextLang } = useLanguage();
  const lang = propLang ?? contextLang;
  const setLang = propOnLangChange ?? setContextLang;

  const pathname = usePathname();
  const isHome = pathname === '/';
  const hasFullHero =
    isHome ||
    /^\/d\/[^/]+$/.test(pathname) ||
    /^\/d\/[^/]+\/s\/[^/]+$/.test(pathname);

  const destMatch = pathname.match(/^\/d\/([^/]+)/);
  const currentDest = destMatch && destMatch[1] !== 'undefined' ? destMatch[1] : null;

  const staysHref = currentDest ? `/d/${currentDest}/stay` : '/stays';
  const diningHref = currentDest ? `/d/${currentDest}/food` : '/dining';
  const sunbedsHref = currentDest ? `/d/${currentDest}/sunbeds` : '/sunbeds';

  const isDestActive = pathname.startsWith('/destinations') || /^\/d\/[^/]+/.test(pathname);
  const isSunbedsActive = pathname.startsWith('/sunbeds') || pathname.includes('/sunbeds');
  const isStaysActive = pathname.startsWith('/stays') || pathname.includes('/stay');
  const isDiningActive = pathname.startsWith('/dining') || pathname.includes('/food');

  const [isSolid, setIsSolid] = useState(!hasFullHero);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!hasFullHero) {
      setIsSolid(true);
      return;
    }
    function handleScroll() {
      setIsSolid(window.scrollY > window.innerHeight * 0.4);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasFullHero]);

  return (
    <header className={`dl-nav ${isSolid ? 'solid' : ''}`} id="nav">
      <Link className="dl-logo" href="/" aria-label="Coastline home">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="15" fill="#0E6E6A" />
          <path
            d="M5 18c3.5-3 7-3 11 0s7.5 3 11 0"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M7 23c3-2.4 6-2.4 9 0s6 2.4 9 0"
            fill="none"
            stroke="#E8A93A"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="21" cy="10" r="3" fill="#E8A93A" />
        </svg>
        <span className="font-extrabold tracking-tight">Coastline</span>
      </Link>

      <nav className="dl-nav-links" aria-label="Main">
        <Link href="/destinations" className={isDestActive ? 'active' : ''}>
          {lang === 'bn' ? 'গন্তব্য' : 'Destinations'}
        </Link>
        <Link href={staysHref} className={isStaysActive ? 'active' : ''}>
          {lang === 'bn' ? 'হোটেল' : 'Stays'}
        </Link>
        <Link href={diningHref} className={isDiningActive ? 'active' : ''}>
          {lang === 'bn' ? 'খাবার' : 'Dining'}
        </Link>
        <Link href={sunbedsHref} className={isSunbedsActive ? 'active' : ''}>
          {lang === 'bn' ? 'সানবেড' : 'Sunbeds'}
        </Link>
        <Link href="/photographers" className={pathname.startsWith('/photographers') ? 'active' : ''}>
          {lang === 'bn' ? 'ফটোগ্রাফার' : 'Photographers'}
        </Link>
        <Link href="/trips" className={pathname.startsWith('/trips') ? 'active' : ''}>
          {lang === 'bn' ? 'ট্রিপ' : 'Trips'}
        </Link>
        <Link href="/saved" className={pathname.startsWith('/saved') ? 'active' : ''}>
          {lang === 'bn' ? 'সংরক্ষিত' : 'Saved'}
        </Link>
        <Link href="/search" className={pathname.startsWith('/search') ? 'active' : ''}>
          <span className="flex items-center gap-1">
            <Search className="size-3.5" />
            {lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
          </span>
        </Link>
      </nav>

      <div className="dl-nav-sp" />

      {/* Mobile Search Button */}
      <Link
        href="/search"
        aria-label={lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
        className="grid size-8 place-items-center rounded-full bg-white/10 text-white md:hidden hover:bg-white/20 transition-colors"
      >
        <Search className="size-3.5" />
      </Link>

      {/* Mobile Menu Toggle Button */}
      <button
        type="button"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((prev) => !prev)}
        className="grid size-8 place-items-center rounded-full bg-white/10 text-white md:hidden hover:bg-white/20 transition-colors"
      >
        {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      <HelpTopButton className="dl-help-btn" />

      <div className="dl-lang" role="group" aria-label="Language">
        <button type="button" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')}>
          বাং
        </button>
        <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
          EN
        </button>
      </div>

      <AccountMenuButton current="visitor" />

      {/* Mobile Glass Menu Drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full mt-2 rounded-3xl border border-white/20 bg-black/95 p-4 text-white shadow-2xl backdrop-blur-2xl md:hidden">
          <nav className="grid grid-cols-2 gap-2 text-xs" aria-label="Mobile Navigation">
            <Link
              href="/destinations"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isDestActive ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'গন্তব্য' : 'Destinations'}
            </Link>
            <Link
              href={staysHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isStaysActive ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'হোটেল' : 'Stays'}
            </Link>
            <Link
              href={diningHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isDiningActive ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'খাবার' : 'Dining'}
            </Link>
            <Link
              href={sunbedsHref}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isSunbedsActive ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'সানবেড' : 'Sunbeds'}
            </Link>
            <Link
              href="/photographers"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/photographers') ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'ফটোগ্রাফার' : 'Photographers'}
            </Link>
            <Link
              href="/trips"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/trips') ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'ট্রিপ' : 'Trips'}
            </Link>
            <Link
              href="/saved"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/saved') ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'সংরক্ষিত' : 'Saved'}
            </Link>
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/search') ? 'bg-primary text-white' : 'text-white/80 hover:bg-white/10 hover:text-white',
              )}
            >
              {lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
