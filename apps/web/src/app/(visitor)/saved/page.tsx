'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BedDouble, Heart, MapPin, Trash2, UtensilsCrossed } from 'lucide-react';
import type { SavedItemType } from '@coastline/api-contracts';
import { useSaved } from '@/components/patterns/save-button';
import { PageHeader } from '@/components/patterns/spot-hub-sections';
import { EmptyState, Skeleton } from '@/components/ui/feedback-states';
import { clientApi } from '@/lib/api';

type FilterType = 'ALL' | SavedItemType;

export default function SavedPage() {
  const { data: items, isLoading, mutate } = useSaved();
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filtered = items
    ? items.filter((item) => (filter === 'ALL' ? true : item.type === filter))
    : [];

  async function removeSaved(type: SavedItemType, key: string) {
    if (!items) return;
    const next = items.filter((item) => !(item.type === type && item.key === key));
    await mutate(next, { revalidate: false });
    try {
      await clientApi('/saved', {
        method: 'DELETE',
        body: JSON.stringify({ type, key }),
      });
    } catch {
      await mutate();
    }
  }

  return (
    <div className="page max-w-4xl pb-16">
      <PageHeader
        title="Saved items"
        subtitle="Stays, dining spots, and destinations you bookmarked for your trip."
        className="lg:pt-6"
      />

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter saved items">
        {[
          { id: 'ALL' as const, label: 'All saved' },
          { id: 'HOTEL' as const, label: 'Stays', icon: BedDouble },
          { id: 'VENUE' as const, label: 'Dining', icon: UtensilsCrossed },
          { id: 'SPOT' as const, label: 'Spots', icon: MapPin },
        ].map((tab) => {
          const isSelected = filter === tab.id;
          const count = items
            ? tab.id === 'ALL'
              ? items.length
              : items.filter((i) => i.type === tab.id).length
            : 0;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setFilter(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-action-bg text-action-fg shadow-md'
                  : 'border border-line bg-surface text-muted hover:bg-surface-alt hover:text-fg'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-alt text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Heart}
          className="mt-8"
          title={filter === 'ALL' ? 'Nothing saved yet' : `No saved ${filter.toLowerCase()}s`}
          body="Tap the heart icon on any hotel, dining venue, or tourist spot to keep it in your saved trip collection."
          action={{ label: 'Explore Bangladesh', href: '/' }}
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={`${item.type}-${item.key}`}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {item.type === 'HOTEL' ? 'Stay' : item.type === 'VENUE' ? 'Dining' : 'Spot'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSaved(item.type, item.key)}
                    aria-label={`Remove ${item.title}`}
                    className="rounded-full p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <h3 className="mt-3 text-lg font-bold text-fg group-hover:text-primary">
                  {item.title}
                </h3>
                {item.subtitle ? (
                  <p className="mt-1 text-sm text-muted">{item.subtitle}</p>
                ) : null}
              </div>

              <div className="mt-4 pt-3 border-t border-line/60">
                <Link
                  href={item.href || '/'}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-surface-alt py-2 text-sm font-semibold text-fg transition-colors hover:bg-action-bg hover:text-action-fg"
                >
                  View & Book →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
