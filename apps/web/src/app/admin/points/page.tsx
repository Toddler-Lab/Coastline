import type { Metadata } from 'next';
import type { BeachPointSummary } from '@coastline/api-contracts';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PointsManager } from '@/components/admin/points-manager';
import { readParam } from '@/components/admin/utils';
import { ErrorState } from '@/components/ui/states';
import { ApiError, serverApi } from '@/lib/api';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = { title: 'Beach points' };

export default async function AdminPointsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const viewer = await getViewer();
  if (!viewer.user || viewer.user.role !== 'ADMIN') {
    return null;
  }

  const params = await searchParams;
  const editCode = readParam(params.edit)?.toUpperCase();

  let points: BeachPointSummary[] | null = null;
  let failure: string | null = null;

  try {
    points = await serverApi<BeachPointSummary[]>('/admin/beach-points', viewer.userId);
  } catch (error) {
    failure = error instanceof ApiError ? error.message : 'Beach points could not be loaded.';
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Operations · inventory"
        title="Beach points"
        description="Coordinates, opening hours, default pricing and bed counts for every stretch of coast, including deactivated points. Money is entered in whole taka."
      />
      {points ? (
        <PointsManager points={points} initialEditCode={editCode} />
      ) : (
        <ErrorState
          title="Beach points unavailable"
          message={failure ?? 'The API did not answer.'}
        />
      )}
    </div>
  );
}
