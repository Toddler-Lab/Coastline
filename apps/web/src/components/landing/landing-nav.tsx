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
    isHome || /^\/d\/[^/]+$/.test(pathname) || /^\/d\/[^/]+\/s\/[^/]+$/.test(pathname);

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
        <Link
          href="/photographers"
          className={pathname.startsWith('/photographers') ? 'active' : ''}
        >
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

      <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Mobile Search Button */}
        <Link
          href="/search"
          aria-label={lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
          className="dl-nav-icon grid size-11 shrink-0 place-items-center rounded-full transition-colors xl:hidden"
        >
          <Search className="size-3.5" />
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          aria-label={
            mobileOpen
              ? lang === 'bn'
                ? 'মেনু বন্ধ করুন'
                : 'Close menu'
              : lang === 'bn'
                ? 'মেনু খুলুন'
                : 'Open menu'
          }
          aria-controls="landing-mobile-nav"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
          className="dl-nav-icon grid size-11 shrink-0 place-items-center rounded-full transition-colors xl:hidden"
        >
          {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        <HelpTopButton className="dl-help-btn hidden sm:inline-flex" />

        <div className="dl-lang hidden sm:flex" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')}>
            বাং
          </button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </button>
        </div>

        <AccountMenuButton current="visitor" />
      </div>

      {/* Mobile Glass Menu Drawer */}
      {mobileOpen && (
        <div
          id="landing-mobile-nav"
          className="dl-nav-drawer absolute inset-x-0 top-full mt-2 max-h-[calc(100dvh-100px)] overflow-y-auto rounded-3xl border border-line bg-surface p-4 text-fg shadow-soft xl:hidden"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setMobileOpen(false);
              document
                .querySelector<HTMLButtonElement>('[aria-controls="landing-mobile-nav"]')
                ?.focus();
            }
          }}
        >
          <nav className="grid grid-cols-2 gap-2 text-xs" aria-label="Mobile Navigation">
            <Link
              href="/destinations"
              aria-current={isDestActive ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isDestActive
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'গন্তব্য' : 'Destinations'}
            </Link>
            <Link
              href={staysHref}
              aria-current={isStaysActive ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isStaysActive
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'হোটেল' : 'Stays'}
            </Link>
            <Link
              href={diningHref}
              aria-current={isDiningActive ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isDiningActive
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'খাবার' : 'Dining'}
            </Link>
            <Link
              href={sunbedsHref}
              aria-current={isSunbedsActive ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                isSunbedsActive
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'সানবেড' : 'Sunbeds'}
            </Link>
            <Link
              href="/photographers"
              aria-current={pathname.startsWith('/photographers') ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/photographers')
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'ফটোগ্রাফার' : 'Photographers'}
            </Link>
            <Link
              href="/trips"
              aria-current={pathname.startsWith('/trips') ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/trips')
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'ট্রিপ' : 'Trips'}
            </Link>
            <Link
              href="/saved"
              aria-current={pathname.startsWith('/saved') ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/saved')
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'সংরক্ষিত' : 'Saved'}
            </Link>
            <Link
              href="/search"
              aria-current={pathname.startsWith('/search') ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-xl px-3 py-2.5 font-semibold transition-colors',
                pathname.startsWith('/search')
                  ? 'bg-action-bg text-action-fg'
                  : 'text-muted hover:bg-surface-alt hover:text-fg',
              )}
            >
              {lang === 'bn' ? 'অনুসন্ধান' : 'Search'}
            </Link>
          </nav>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 sm:hidden">
            <HelpTopButton />
            <div
              className="flex items-center gap-1 rounded-full border border-line p-1"
              role="group"
              aria-label="Language"
            >
              {(['bn', 'en'] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  aria-pressed={lang === language}
                  onClick={() => setLang(language)}
                  className={cn(
                    'min-h-11 min-w-11 rounded-full px-3 text-label',
                    lang === language
                      ? 'bg-action-bg text-action-fg'
                      : 'text-muted hover:bg-surface-alt',
                  )}
                >
                  {language === 'bn' ? 'বাং' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
