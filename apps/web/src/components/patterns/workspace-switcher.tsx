'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Check,
  Compass,
  LayoutDashboard,
  ScanLine,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/display';
import { Sheet } from '@/components/ui/sheet';
import {
  WORKSPACE_HOME,
  WORKSPACE_LABEL,
  canUseWorkspace,
  useSession,
  useSwitchAccount,
  type Workspace,
} from './session';

const WORKSPACE_ICON: Record<Workspace, LucideIcon> = {
  visitor: Compass,
  provider: Briefcase,
  desk: ScanLine,
  admin: LayoutDashboard,
};

const WORKSPACE_HINT: Record<Workspace, string> = {
  visitor: 'Explore and book',
  provider: 'Listings, bookings, kitchen',
  desk: 'Scan tickets, check in',
  admin: 'Places, bookings, finance',
};

const ROLE_LABEL: Record<string, string> = { TOURIST: 'Visitor', ADMIN: 'Operator' };

export function WorkspaceSwitcher({
  current,
  onNavigate,
}: {
  current: Workspace;
  onNavigate?: () => void;
}) {
  const { user, accounts } = useSession();
  const switchAccount = useSwitchAccount();
  const workspaces = (Object.keys(WORKSPACE_HOME) as Workspace[]).filter((workspace) =>
    canUseWorkspace(user, workspace),
  );

  return (
    <div className="space-y-6">
      <section aria-labelledby="ws-title">
        <h3 id="ws-title" className="mb-2 text-label text-muted">
          Workspace
        </h3>
        <ul className="grid gap-2">
          {workspaces.map((workspace) => {
            const Icon = WORKSPACE_ICON[workspace];
            const active = workspace === current;
            return (
              <li key={workspace}>
                <Link
                  href={WORKSPACE_HOME[workspace]}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 items-center gap-3 rounded-md border px-3',
                    active ? 'border-primary bg-primary-soft' : 'border-line hover:bg-surface-alt',
                  )}
                >
                  <Icon
                    aria-hidden
                    className={cn('size-6', active ? 'text-primary' : 'text-muted')}
                  />
                  <span className="flex-1">
                    <span className="block text-label">{WORKSPACE_LABEL[workspace]}</span>
                    <span className="block text-caption text-muted">
                      {WORKSPACE_HINT[workspace]}
                    </span>
                  </span>
                  {active ? <Check aria-hidden className="size-5 text-primary" /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
        {workspaces.length === 1 ? (
          <p className="mt-2 text-body-sm text-muted">
            Staff workspaces open for operator accounts. Switch to the operator account below to try
            them.
          </p>
        ) : null}
      </section>

      {accounts.length > 0 ? (
        <section aria-labelledby="acct-title">
          <h3 id="acct-title" className="mb-1 text-label text-muted">
            Seeded accounts
          </h3>
          <p className="mb-2 text-body-sm text-muted">
            Local demo sign-in. Real sign-in comes in a later release.
          </p>
          <ul className="grid gap-2">
            {accounts.map((account) => {
              const active = account.id === user?.id;
              return (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.();
                      if (!active) switchAccount(account);
                    }}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-14 w-full items-center gap-3 rounded-md border px-3 text-left',
                      active
                        ? 'border-primary bg-primary-soft'
                        : 'border-line hover:bg-surface-alt',
                    )}
                  >
                    <Avatar name={account.name} className="size-9" />
                    <span className="flex-1">
                      <span className="block text-label">{account.name}</span>
                      <span className="block text-caption text-muted">
                        {ROLE_LABEL[account.role] ?? account.role}
                      </span>
                    </span>
                    {active ? <Check aria-hidden className="size-5 text-primary" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Avatar button that opens the account and workspace menu. */
export function AccountMenuButton({ current }: { current: Workspace }) {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Account and workspaces${user ? `, signed in as ${user.name}` : ''}`}
        className="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-alt"
      >
        <Avatar name={user?.name ?? 'Guest'} className="size-9" />
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={user ? user.name : 'Account'}
        description={user?.email ?? undefined}
      >
        <WorkspaceSwitcher current={current} onNavigate={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
