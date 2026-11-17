'use client';

import useSWR from 'swr';
import { Heart } from 'lucide-react';
import type { SavedItemDto, SavedItemType } from '@coastline/api-contracts';
import { clientApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/toast';
import { useSession } from './session';

const SAVED_KEY = '/saved';

/** Shared saved list; SWR dedupes it across every save button on the page. */
export function useSaved() {
  const { user } = useSession();
  return useSWR<SavedItemDto[]>(user?.role === 'TOURIST' ? SAVED_KEY : null, (path: string) => clientApi(path), {
    revalidateOnFocus: false,
  });
}

/** Optimistic save toggle with an Undo snackbar (design.md 9). Visitors only. */
export function SaveButton({
  type,
  itemKey,
  label,
  className,
}: {
  type: SavedItemType;
  itemKey: string;
  label: string;
  className?: string;
}) {
  const { user } = useSession();
  const toast = useToast();
  const { data, mutate } = useSaved();
  if (user?.role !== 'TOURIST') return null;

  const saved = Boolean(data?.some((item) => item.type === type && item.key === itemKey));

  async function setSaved(next: boolean) {
    const previous = data ?? [];
    const optimistic = next
      ? [
          {
            type,
            key: itemKey,
            title: label,
            subtitle: null,
            imageUrl: null,
            href: '',
            savedAt: new Date().toISOString(),
          },
          ...previous,
        ]
      : previous.filter((item) => !(item.type === type && item.key === itemKey));
    await mutate(optimistic, { revalidate: false });
    try {
      if (next) {
        await clientApi(SAVED_KEY, { method: 'POST', body: JSON.stringify({ type, key: itemKey }) });
      } else {
        await clientApi(`${SAVED_KEY}?type=${type}&key=${encodeURIComponent(itemKey)}`, { method: 'DELETE' });
      }
      await mutate();
    } catch {
      await mutate(previous, { revalidate: false });
      toast.push('Could not update Saved. Try again.', 'danger');
      return;
    }
    toast.push(next ? `Saved ${label}` : `Removed ${label} from Saved`, 'success', {
      label: 'Undo',
      onClick: () => void setSaved(!next),
    });
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${label} from Saved` : `Save ${label}`}
      title={saved ? 'Saved' : 'Save'}
      onClick={() => void setSaved(!saved)}
      className={cn(
        'inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-surface-alt',
        saved ? 'text-danger' : 'text-fg',
        className,
      )}
    >
      <Heart aria-hidden className={cn('size-6', saved && 'fill-current')} />
    </button>
  );
}
