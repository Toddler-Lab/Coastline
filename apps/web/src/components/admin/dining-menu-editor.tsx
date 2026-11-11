'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DINING_ADMIN_LIMITS,
  type AdminMenuItemDto,
  type DiningAdminVenueDto,
  type UpdateMenuItemRequest,
} from '@coastline/api-contracts';
import { Save } from 'lucide-react';
import { AdminNotice } from '@/components/admin/feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox, Input } from '@/components/ui/field';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { clientApi } from '@/lib/api';
import {
  diningErrorDetails,
  diningErrorMessage,
  minorToTakaInput,
  parseTaka,
  parseWholeNumber,
} from '@/lib/dining/admin';
import { formatMoney } from '@/lib/format';

interface ItemDraft {
  name: string;
  priceTaka: string;
  sortOrder: string;
  isAvailable: boolean;
}

function draftFrom(item: AdminMenuItemDto): ItemDraft {
  return {
    name: item.name,
    priceTaka: minorToTakaInput(item.priceMinor),
    sortOrder: String(item.sortOrder),
    isAvailable: item.isAvailable,
  };
}

/** Only the changed fields, or an error message when a field is invalid. */
function buildPatch(
  item: AdminMenuItemDto,
  draft: ItemDraft,
): { patch: UpdateMenuItemRequest } | { error: string } {
  const patch: UpdateMenuItemRequest = {};
  const name = draft.name.trim();
  if (name.length === 0 || name.length > DINING_ADMIN_LIMITS.menuItemNameMaxLength) {
    return { error: `Name must be 1 to ${DINING_ADMIN_LIMITS.menuItemNameMaxLength} characters.` };
  }
  if (name !== item.name) patch.name = name;

  const price = parseTaka(draft.priceTaka);
  if (price === null || price <= 0 || price > DINING_ADMIN_LIMITS.maxMenuPriceMinor) {
    return { error: 'Price must be a positive taka amount (up to two decimals).' };
  }
  if (price !== item.priceMinor) patch.priceMinor = price;

  const sortOrder = parseWholeNumber(draft.sortOrder);
  if (sortOrder === null || sortOrder > DINING_ADMIN_LIMITS.maxSortOrder) {
    return { error: `Sort must be a whole number from 0 to ${DINING_ADMIN_LIMITS.maxSortOrder}.` };
  }
  if (sortOrder !== item.sortOrder) patch.sortOrder = sortOrder;

  if (draft.isAvailable !== item.isAvailable) patch.isAvailable = draft.isAvailable;
  return { patch };
}

function MenuItemRow({ item }: { item: AdminMenuItemDto }) {
  const router = useRouter();
  const toast = useToast();
  const [saved, setSaved] = useState(item);
  const [draft, setDraft] = useState<ItemDraft>(() => draftFrom(item));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const result = buildPatch(saved, draft);
  const dirty = 'error' in result || Object.keys(result.patch).length > 0;
  const idBase = `menu-${item.id}`;

  const update = <Key extends keyof ItemDraft>(key: Key, value: ItemDraft[Key]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ('error' in result) {
      setError(result.error);
      return;
    }
    if (Object.keys(result.patch).length === 0) return;

    setPending(true);
    try {
      const updated = await clientApi<AdminMenuItemDto>(
        `/admin/dining/menu-items/${encodeURIComponent(item.id)}`,
        { method: 'PATCH', body: JSON.stringify(result.patch) },
      );
      setSaved(updated);
      setDraft(draftFrom(updated));
      toast.push(`${updated.name} saved.`, 'success');
      router.refresh();
    } catch (failure) {
      const details = diningErrorDetails(failure);
      setError(details.length > 0 ? details.join(' ') : diningErrorMessage(failure));
    } finally {
      setPending(false);
    }
  };

  return (
    <li className="border-b border-line/70 py-3 last:border-0">
      <form
        onSubmit={save}
        aria-busy={pending}
        aria-label={`Edit ${saved.name}`}
        noValidate
        className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_5rem_auto_auto]"
      >
        <div className="col-span-2 space-y-1 sm:col-span-1">
          <label htmlFor={`${idBase}-name`} className="label block text-foam/80">
            Name
          </label>
          <Input
            id={`${idBase}-name`}
            value={draft.name}
            onChange={(event) => update('name', event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${idBase}-price`} className="label block text-foam/80">
            Price ৳
          </label>
          <Input
            id={`${idBase}-price`}
            inputMode="decimal"
            value={draft.priceTaka}
            onChange={(event) => update('priceTaka', event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${idBase}-sort`} className="label block text-foam/80">
            Sort
          </label>
          <Input
            id={`${idBase}-sort`}
            inputMode="numeric"
            value={draft.sortOrder}
            onChange={(event) => update('sortOrder', event.target.value)}
          />
        </div>
        <Checkbox
          label="Available"
          checked={draft.isAvailable}
          onChange={(event) => update('isAvailable', event.target.checked)}
        />
        <Button type="submit" variant="secondary" loading={pending} disabled={!dirty}>
          <Save aria-hidden className="h-4 w-4" />
          Save
        </Button>
      </form>
      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-mist">
        <span>
          Current: <span className="font-mono text-foam">{formatMoney(saved.priceMinor)}</span>
        </span>
        {saved.isAvailable ? null : <Badge tone="warn">Unavailable</Badge>}
        {saved.nameBn ? <span lang="bn">{saved.nameBn}</span> : null}
      </p>
      {error ? (
        <AdminNotice tone="danger" className="mt-2">
          {error}
        </AdminNotice>
      ) : null}
    </li>
  );
}

export function DiningMenuEditor({ venue }: { venue: DiningAdminVenueDto }) {
  const itemCount = venue.menu.reduce((total, category) => total + category.items.length, 0);

  return (
    <Panel className="p-4">
      <PanelHeader
        eyebrow="Menu"
        title="Menu editor"
        right={
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
            {itemCount} items
          </span>
        }
      />
      <p className="mt-2 text-[12px] leading-relaxed text-mist">
        Indicative demo prices. A price change applies to new orders only; placed food orders keep
        the name and price they were ordered at.
      </p>

      {venue.menu.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No menu yet"
          body="This venue has no menu categories. Seed data defines menus; the MVP editor changes existing items only."
        />
      ) : (
        <div className="mt-4 space-y-5">
          {venue.menu.map((category) => (
            <section key={category.id} aria-labelledby={`category-${category.id}`}>
              <h3
                id={`category-${category.id}`}
                className="label border-b border-line pb-1.5 text-foam/80"
              >
                {category.name}
                {category.nameBn ? (
                  <span lang="bn" className="ml-2 normal-case tracking-normal text-mist">
                    {category.nameBn}
                  </span>
                ) : null}
              </h3>
              {category.items.length === 0 ? (
                <p className="py-3 text-[12px] text-mist">No items in this category.</p>
              ) : (
                <ul>
                  {category.items.map((item) => (
                    <MenuItemRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </Panel>
  );
}
