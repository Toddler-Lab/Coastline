import type { Metadata } from 'next';
import { getViewer } from '@/lib/session';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { WorkspaceDenied } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin · Coastline' },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (viewer.user?.role !== 'ADMIN') return <WorkspaceDenied workspace="admin" />;
  return <WorkspaceShell workspace="admin">{children}</WorkspaceShell>;
}
