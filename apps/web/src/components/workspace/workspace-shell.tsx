'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Ellipsis,
  Flag,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  PackageSearch,
  Receipt,
  ScanLine,
  ScrollText,
  Settings,
  Star,
  Store,
  Users,
  Wallet,
  Camera,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Sheet } from '@/components/ui/sheet';
import { Logo } from '@/components/patterns/logo';
import { AccountMenuButton } from '@/components/patterns/workspace-switcher';
import { WORKSPACE_LABEL, type Workspace } from '@/components/patterns/session';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the compact bottom bar (max four). */
  primary?: boolean;
  /** Not built yet; links to a page that says so. */
  soon?: boolean;
}

type StaffWorkspace = Exclude<Workspace, 'visitor'>;

/** Navigation per workspace (design.md 5.3). */
export const WORKSPACE_NAV: Record<StaffWorkspace, NavItem[]> = {
  provider: [
    { href: '/provider', label: 'Today', icon: LayoutDashboard, primary: true },
    { href: '/provider/bookings', label: 'Bookings', icon: ClipboardList, primary: true },
    { href: '/provider/orders', label: 'Kitchen', icon: ChefHat, primary: true },
    { href: '/provider/listings', label: 'Listings', icon: Store, primary: true },
    { href: '/provider/calendar', label: 'Calendar', icon: CalendarDays, soon: true },
    { href: '/provider/requests', label: 'Requests', icon: Camera, soon: true },
    { href: '/provider/inbox', label: 'Inbox', icon: Inbox, soon: true },
    { href: '/provider/earnings', label: 'Earnings', icon: Wallet, soon: true },
    { href: '/provider/reviews', label: 'Reviews', icon: Star, soon: true },
  ],
  desk: [
    { href: '/desk', label: 'Scan', icon: ScanLine, primary: true },
    { href: '/desk/arrivals', label: 'Arrivals', icon: ListChecks, primary: true },
    {
      href: '/desk/lost-found',
      label: 'Lost & found',
      icon: PackageSearch,
      primary: true,
      soon: true,
    },
    { href: '/desk/reports', label: 'Reports', icon: Flag, soon: true },
    { href: '/desk/alerts', label: 'Alerts', icon: Bell, soon: true },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, primary: true },
    { href: '/admin/destinations', label: 'Destinations', icon: MapPinned, primary: true },
    { href: '/admin/bookings', label: 'Bookings', icon: BookOpen, primary: true },
    { href: '/admin/providers', label: 'Providers', icon: Store, soon: true },
    { href: '/admin/listings', label: 'Listings', icon: ListChecks, soon: true },
    { href: '/admin/payments', label: 'Payments', icon: Receipt, soon: true },
    { href: '/admin/payouts', label: 'Payouts', icon: Wallet, soon: true },
    { href: '/admin/lost-found', label: 'Lost & found', icon: PackageSearch, soon: true },
    { href: '/admin/complaints', label: 'Complaints', icon: Flag, soon: true },
    { href: '/admin/alerts', label: 'Alerts', icon: Bell, soon: true },
    { href: '/admin/users', label: 'Users', icon: Users, soon: true },
    { href: '/admin/settings', label: 'Settings', icon: Settings, soon: true },
    { href: '/admin/audit', label: 'Audit', icon: ScrollText, soon: true },
  ],
};

function isActive(pathname: string, href: string, root: string): boolean {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}

function SoonTag() {
  return (
    <span className="ml-auto rounded-full bg-surface-alt px-2 text-caption text-muted">Soon</span>
  );
}

export function WorkspaceShell({
  workspace,
  children,
}: {
  workspace: StaffWorkspace;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = WORKSPACE_NAV[workspace];
  const root = `/${workspace}`;
  const primary = items.filter((item) => item.primary).slice(0, 4);
  const moreActive = items.some(
    (item) => !primary.includes(item) && isActive(pathname, item.href, root),
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-[var(--topbar-h)] items-center gap-2 px-4">
          <Logo href={root} />
          <span className="rounded-full bg-primary-soft px-2 text-caption text-primary">
            {WORKSPACE_LABEL[workspace]}
          </span>
        </div>
        <nav
          aria-label={`${WORKSPACE_LABEL[workspace]} navigation`}
          className="flex-1 overflow-y-auto px-3 py-2"
        >
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = isActive(pathname, item.href, root);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-11 items-center gap-3 rounded-sm px-3 text-label transition-colors',
                      active
                        ? 'bg-primary-soft text-primary'
                        : 'text-muted hover:bg-surface-alt hover:text-fg',
                    )}
                  >
                    <item.icon aria-hidden className="size-5" />
                    {item.label}
                    {item.soon ? <SoonTag /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-2 border-t border-line p-3">
          <AccountMenuButton current={workspace} />
          <span className="text-body-sm text-muted">Account and workspaces</span>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-line bg-surface px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Logo href={root} label="Coastline" />
            <span className="rounded-full bg-primary-soft px-2 text-caption text-primary">
              {WORKSPACE_LABEL[workspace]}
            </span>
          </div>
          <AccountMenuButton current={workspace} />
        </header>
        <main
          id="main"
          className="pb-[calc(var(--bottombar-h)+env(safe-area-inset-bottom)+24px)] lg:pb-10"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label={`${WORKSPACE_LABEL[workspace]} navigation`}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="grid h-[var(--bottombar-h)] grid-cols-5">
          {primary.map((item) => {
            const active = isActive(pathname, item.href, root);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 text-caption',
                    active ? 'text-primary' : 'text-muted',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-14 place-items-center rounded-full',
                      active && 'bg-primary-soft',
                    )}
                  >
                    <item.icon aria-hidden className="size-6" />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-0.5 text-caption',
                moreActive ? 'text-primary' : 'text-muted',
              )}
            >
              <span
                className={cn(
                  'grid h-8 w-14 place-items-center rounded-full',
                  moreActive && 'bg-primary-soft',
                )}
              >
                <Ellipsis aria-hidden className="size-6" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title={WORKSPACE_LABEL[workspace]}>
        <ul className="-mx-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-sm px-2 text-label hover:bg-surface-alt"
              >
                <item.icon aria-hidden className="size-5 text-muted" />
                {item.label}
                {item.soon ? <SoonTag /> : null}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}
