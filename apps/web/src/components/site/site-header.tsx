'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@coastline/api-contracts';
import { Map, ShieldCheck, Ticket } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { PersonaSwitch } from '@/components/brand/persona-switch';
import { cn } from '@/lib/cn';

function navFor(role: 'TOURIST' | 'ADMIN' | undefined) {
  const items = [
    { href: '/', label: 'Beach map', icon: Map, exact: true },
    { href: '/bookings', label: 'My bookings', icon: Ticket, exact: false },
  ];
  if (role === 'ADMIN') {
    items.push({ href: '/admin', label: 'Admin', icon: ShieldCheck, exact: false });
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
      <header className="sticky top-0 z-50 border-b border-line bg-abyss/82 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--header-height)] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-foam">
            <Logo className="h-8 w-8 text-sea" />
            <span className="leading-none">
              <span className="font-display text-[15px] font-semibold tracking-[0.02em]">
                COASTLINE
              </span>
              <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.22em] text-mist">
                Cox&rsquo;s Bazar · sunbed map
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] transition-colors',
                    active ? 'bg-raised text-foam' : 'text-mist hover:bg-raised/60 hover:text-foam',
                  )}
                >
                  <item.icon aria-hidden className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-coral/35 bg-coral/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-coral sm:inline">
              Demo
            </span>
            <PersonaSwitch users={users} currentId={currentId} />
          </div>
        </div>
      </header>

      {/* Mobile primary navigation: three destinations, thumb-reachable. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-abyss/94 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <div className="flex items-stretch">
          {items.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[10px]',
                  active ? 'text-sea' : 'text-mist',
                )}
              >
                <item.icon aria-hidden className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
