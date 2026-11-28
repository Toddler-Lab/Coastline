'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  Compass,
  Heart,
  Inbox,
  UserRound,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export const VISITOR_NAV: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}> = [
  {
    href: '/',
    label: 'Explore',
    icon: Compass,
    match: (path) =>
      path === '/' ||
      path.startsWith('/d/') ||
      path.startsWith('/search') ||
      path.startsWith('/l/') ||
      path.startsWith('/sunbeds'),
  },
  { href: '/saved', label: 'Saved', icon: Heart, match: (path) => path.startsWith('/saved') },
  {
    href: '/trips',
    label: 'Trips',
    icon: CalendarDays,
    match: (path) => path.startsWith('/trips'),
  },
  { href: '/inbox', label: 'Inbox', icon: Inbox, match: (path) => path.startsWith('/inbox') },
  {
    href: '/profile',
    label: 'Profile',
    icon: UserRound,
    match: (path) => path.startsWith('/profile'),
  },
];

/** Detail and flow screens carry their own sticky action bar instead. */
export function hidesBottomBar(pathname: string): boolean {
  return (
    /^\/l\/[^/]+/.test(pathname) ||
    pathname.startsWith('/sunbeds/') ||
    pathname.startsWith('/checkout')
  );
}

export function BottomBar() {
  const pathname = usePathname();
  if (hidesBottomBar(pathname)) return null;

  return (
    <nav
      aria-label="Main"
      className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-[var(--glass-edge)] bg-[var(--glass-chrome-scrolled)] backdrop-blur-2xl backdrop-saturate-180 pb-[env(safe-area-inset-bottom)] shadow-[inset_0_1px_0_var(--glass-rim),0_-8px_28px_rgba(6,20,19,0.12)] lg:hidden"
    >
      <ul className="mx-auto grid h-[var(--bottombar-h)] max-w-xl grid-cols-5">
        {VISITOR_NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-caption font-medium transition-all',
                  active ? 'text-primary font-bold' : 'text-muted hover:text-fg',
                )}
              >
                <span
                  className={cn(
                    'grid h-8 w-14 place-items-center rounded-full transition-all duration-300',
                    active && 'bg-primary-soft text-primary scale-105 shadow-sm',
                  )}
                >
                  <item.icon aria-hidden className="size-5" strokeWidth={active ? 2.2 : 1.75} />
                </span>
                <span className="text-[11px] leading-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Bar at the top while offline; tickets keep working, booking is disabled. */
export function OfflineBar() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);
  if (!offline) return null;
  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-fg px-4 py-2 text-body-sm text-bg"
    >
      <WifiOff aria-hidden className="size-4" />
      You are offline. Saved tickets still open; booking needs a connection.
    </div>
  );
}

/** True while the browser reports no connection. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);
  return online;
}
