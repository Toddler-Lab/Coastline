'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  CircleHelp,
  Flag,
  LifeBuoy,
  PackageSearch,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/sheet';

const HELP_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
  danger?: boolean;
}> = [
  {
    href: '/help/emergency',
    icon: Siren,
    title: 'Emergency',
    body: 'Call 999, nearest hospital',
    danger: true,
  },
  {
    href: '/help/lost-found',
    icon: PackageSearch,
    title: 'Lost something or found something',
    body: 'Report an item or check the board',
  },
  {
    href: '/help/report',
    icon: Flag,
    title: 'Report a problem',
    body: 'Overcharging, safety, a listing',
  },
  {
    href: '/help',
    icon: CircleHelp,
    title: 'Help centre',
    body: 'Bookings, payments, cancellations',
  },
];

export function HelpMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <ul className="-mx-2 space-y-1">
      {HELP_ITEMS.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onNavigate}
            className="flex min-h-16 items-center gap-4 rounded-md px-2 py-2 hover:bg-surface-alt"
          >
            <span
              className={cn(
                'grid size-11 flex-none place-items-center rounded-full',
                item.danger ? 'bg-danger/12 text-danger' : 'bg-primary-soft text-primary',
              )}
            >
              <item.icon aria-hidden className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-title-sm">{item.title}</span>
              <span className="block text-body-sm text-muted">{item.body}</span>
            </span>
            <ChevronRight aria-hidden className="size-5 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Screens where the floating Help button would cover the primary action. */
function hidesHelpButton(pathname: string): boolean {
  return (
    pathname.startsWith('/checkout') ||
    /^\/trips\/[^/]+/.test(pathname) ||
    pathname.startsWith('/sunbeds/') ||
    /^\/l\/[^/]+/.test(pathname) ||
    pathname.startsWith('/help')
  );
}

export function HelpButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {!hidesHelpButton(pathname) ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="no-print fixed bottom-[calc(var(--bottombar-h)+16px+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-surface pl-4 pr-5 text-label text-fg shadow-soft ring-1 ring-line transition-transform hover:-translate-y-0.5 lg:hidden"
        >
          <LifeBuoy aria-hidden className="size-6 text-danger" />
          Help
        </button>
      ) : null}
      <HelpSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="How can we help?">
      <HelpMenu onNavigate={onClose} />
    </Sheet>
  );
}

/** Top-bar Help item on expanded screens. */
export function HelpTopButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-label hover:bg-surface-alt"
      >
        <LifeBuoy aria-hidden className="size-5 text-danger" />
        Help
      </button>
      <HelpSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
