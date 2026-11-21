'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
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
  const hasFullHero = isHome || (/^\/d\/[^/]+$/.test(pathname) && !pathname.includes('/s/'));

  const [isSolid, setIsSolid] = useState(!hasFullHero);

  useEffect(() => {
    if (!hasFullHero) {
      setIsSolid(true);
      return;
    }
    function handleScroll() {
      setIsSolid(window.scrollY > window.innerHeight * 0.6);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasFullHero]);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    if (!isHome) return; // on other routes, let href link to /#id
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

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
        <Link href="/" className={isHome ? 'active' : ''}>
          {lang === 'bn' ? 'হোম' : 'Explore'}
        </Link>
        <Link href="/destinations" className={pathname.startsWith('/destinations') ? 'active' : ''}>
          {lang === 'bn' ? 'গন্তব্য' : 'Destinations'}
        </Link>
        <Link href="/sunbeds" className={pathname.startsWith('/sunbeds') ? 'active' : ''}>
          {lang === 'bn' ? 'সানবেড' : 'Sunbeds'}
        </Link>
        <Link href="/stays" className={pathname.startsWith('/stays') ? 'active' : ''}>
          {lang === 'bn' ? 'হোটেল' : 'Stays'}
        </Link>
        <Link href="/dining" className={pathname.startsWith('/dining') ? 'active' : ''}>
          {lang === 'bn' ? 'খাবার' : 'Dining'}
        </Link>
        <Link href="/trips" className={pathname.startsWith('/trips') ? 'active' : ''}>
          {lang === 'bn' ? 'ট্রিপ ও টিকিট' : 'Trips'}
        </Link>
        <Link href="/inbox" className={pathname.startsWith('/inbox') ? 'active' : ''}>
          {lang === 'bn' ? 'ইনবক্স' : 'Inbox'}
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
    </header>
  );
}
