'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, Ticket, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/points', label: 'Beach points', icon: MapPin, exact: false },
  { href: '/admin/bookings', label: 'Bookings & check-in', icon: Ticket, exact: false },
  { href: '/admin/dining', label: 'Dining', icon: UtensilsCrossed, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Operations desk" className="flex flex-wrap items-center gap-1">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] transition-colors',
              active
                ? 'border-sea/40 bg-sea/10 text-sea'
                : 'border-transparent text-mist hover:border-line-strong hover:bg-raised/60 hover:text-foam',
            )}
          >
            <item.icon aria-hidden className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
