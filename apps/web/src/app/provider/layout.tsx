import type { Metadata } from 'next';
import { getViewer } from '@/lib/session';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { WorkspaceDenied } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = {
  title: { default: 'Provider', template: '%s · Provider · Coastline' },
};

/**
 * Provider portal. Provider roles and membership arrive in WP-04/WP-16; until
 * then the operator account runs the dining venues here, and the API enforces
 * the same ADMIN guard it always has.
 */
export default async function ProviderLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer.user?.role !== 'ADMIN') return <WorkspaceDenied workspace="provider" />;
  return <WorkspaceShell workspace="provider">{children}</WorkspaceShell>;
}
