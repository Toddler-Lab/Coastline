import { cookies } from 'next/headers';
import type { SessionUser } from '@coastline/api-contracts';
import { DEFAULT_DEMO_USER, DEMO_COOKIE, serverApi } from './api';

export interface Viewer {
  userId: string;
  user: SessionUser | null;
}

export async function getViewer(): Promise<Viewer> {
  const store = await cookies();
  const userId = store.get(DEMO_COOKIE)?.value || DEFAULT_DEMO_USER;

  try {
    const user = await serverApi<SessionUser>('/session', userId);
    return { userId, user };
  } catch {
    return { userId, user: null };
  }
}

/**
 * Dev-only persona directory. Returns an empty list when the API is offline so
 * the shell still renders with a clear error on the data surfaces.
 */
export async function getDemoUsers(): Promise<SessionUser[]> {
  try {
    return await serverApi<SessionUser[]>('/demo/users', DEFAULT_DEMO_USER);
  } catch {
    return [];
  }
}
