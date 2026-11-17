'use client';

import { createContext, useCallback, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@coastline/api-contracts';
import { setDemoUser } from '@/lib/api';

interface SessionValue {
  user: SessionUser | null;
  userId: string;
  /** Seeded accounts; empty when demo sign-in is off or the API is down. */
  accounts: SessionUser[];
}

const SessionContext = createContext<SessionValue>({ user: null, userId: '', accounts: [] });

export function SessionProvider({
  value,
  children,
}: {
  value: SessionValue;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}

/** Staff workspaces. Provider and desk roles arrive with WP-04; until then admin holds them. */
export function canUseWorkspace(user: SessionUser | null, workspace: Workspace): boolean {
  if (workspace === 'visitor') return true;
  return user?.role === 'ADMIN';
}

export type Workspace = 'visitor' | 'provider' | 'desk' | 'admin';

export const WORKSPACE_HOME: Record<Workspace, string> = {
  visitor: '/',
  provider: '/provider',
  desk: '/desk',
  admin: '/admin',
};

export const WORKSPACE_LABEL: Record<Workspace, string> = {
  visitor: 'Visitor',
  provider: 'Provider',
  desk: 'Desk',
  admin: 'Admin',
};

/** Switch the seeded account (demo sign-in) and land on a page that account can use. */
export function useSwitchAccount() {
  const router = useRouter();
  return useCallback(
    (account: SessionUser, target?: string) => {
      setDemoUser(account.id);
      const destination = target ?? (account.role === 'ADMIN' ? '/admin' : '/');
      router.push(destination);
      router.refresh();
    },
    [router],
  );
}
