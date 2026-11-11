'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@coastline/api-contracts';
import {
  Car,
  Hotel,
  Map,
  ShieldCheck,
  Ticket,
  Utensils,
  Waves,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { PersonaSwitch } from '@/components/brand/persona-switch';
import { cn } from '@/lib/cn';

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  exact: boolean;
  isDev?: boolean;
}

function navFor(role: 'TOURIST' | 'ADMIN' | undefined): NavItem[] {
  const items: NavItem[] = [
    { href: '/', label: 'Beach map', shortLabel: 'Map', icon: Map, exact: true },
    { href: '/hotels', label: 'Hotels', shortLabel: 'Hotels', icon: Hotel, exact: false },
    { href: '/food', label: 'Dining', shortLabel: 'Dining', icon: Utensils, exact: false, isDev: true },
    { href: '/rides', label: 'Rides', shortLabel: 'Rides', icon: Car, exact: false, isDev: true },
    { href: '/activities', label: 'Water sports', shortLabel: 'Sports', icon: Waves, exact: false, isDev: true },
    { href: '/bookings', label: 'My bookings', shortLabel: 'Bookings', icon: Ticket, exact: false },
  ];
  if (role === 'ADMIN') {
    items.push({ href: '/admin', label: 'Admin', shortLabel: 'Admin', icon: ShieldCheck, exact: false });
  }
  return items;
}

export function SiteHeader({
  user,
  users,
  currentId,
}: {
  user: SessionUser | null;
  users: SessionUser[];
  currentId: string;
}) {
  const pathname = usePathname();
  const items = navFor(user?.role);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-abyss/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--header-height)] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-foam flex-none">
            <Logo className="h-8 w-8 text-sea" />
            <span className="leading-none">
              <span className="font-display text-[15px] font-semibold tracking-[0.02em]">
                COASTLINE
              </span>
              <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.22em] text-mist">
                Cox&rsquo;s Bazar · coastal services
              </span>
            </span>
          </Link>

          {/* Desktop primary navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-1 xl:gap-1.5 lg:flex">
            {items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors',
                    active
                      ? 'bg-raised text-foam'
                      : 'text-mist hover:bg-raised/60 hover:text-foam',
                  )}
                >
                  <item.icon aria-hidden className="h-3.5 w-3.5 flex-none" />
                  <span>{item.label}</span>
                  {item.isDev ? (
                    <span className="rounded bg-sand/15 px-1 py-0.2 font-mono text-[7.5px] uppercase font-semibold text-sand">
                      Dev
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 flex-none">
            <span className="hidden rounded-full border border-coral/35 bg-coral/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-coral sm:inline">
              Demo
            </span>
            <PersonaSwitch users={users} currentId={currentId} />
          </div>
        </div>
      </header>

      {/* Mobile primary navigation: thumb-reachable across all planned modules */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-abyss/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-stretch overflow-x-auto scrollbar-none px-1">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[9.5px] font-medium transition-colors',
                  active ? 'text-sea' : 'text-mist hover:text-foam',
                )}
              >
                <div className="relative">
                  <item.icon aria-hidden className="h-[17px] w-[17px]" />
                  {item.isDev ? (
                    <span className="absolute -right-2 -top-1 block h-1.5 w-1.5 rounded-full bg-sand" />
                  ) : null}
                </div>
                <span className="truncate">{item.shortLabel ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
