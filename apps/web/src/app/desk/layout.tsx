import type { Metadata } from 'next';
import { getViewer } from '@/lib/session';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { WorkspaceDenied } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: { default: 'Desk', template: '%s · Desk · Coastline' } };

/** Spot desk. The DESK role and desk scopes arrive in WP-04; the operator account runs it until then. */
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer.user?.role !== 'ADMIN') return <WorkspaceDenied workspace="desk" />;
  return <WorkspaceShell workspace="desk">{children}</WorkspaceShell>;
}
