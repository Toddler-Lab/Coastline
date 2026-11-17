'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Sparkles, Store } from 'lucide-react';
import { cn } from '@/lib/cn';
import { rankSuggestions, type SearchEntry } from '@/lib/search';
import { SERVICES } from '@/lib/services';

const KIND_ICON = { place: MapPin, listing: Store, service: Sparkles } as const;

/**
 * Search with suggestions for places, listings and service types
 * ("boat Kaptai", "food Laboni"). Enter without a highlighted suggestion opens
 * the full results page.
 */
export function SearchField({
  index = [],
  defaultValue = '',
  placeholder = 'Search stays, food, sunbeds, places',
  size = 'lg',
  className,
}: {
  index?: SearchEntry[];
  defaultValue?: string;
  placeholder?: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<number | null>(null);

  const suggestions = useMemo(
    () => (query.trim() ? rankSuggestions(index, query).slice(0, 6) : []),
    [index, query],
  );
  const expanded = open && suggestions.length > 0;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function submit() {
    if (expanded && active >= 0 && suggestions[active]) {
      go(suggestions[active].href);
      return;
    }
    const trimmed = query.trim();
    go(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Search Coastline
      </label>
      <Search
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted',
          size === 'lg' ? 'size-6' : 'size-5',
        )}
      />
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        enterKeyHint="search"
        value={query}
        placeholder={placeholder}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(event) => {
          if (!expanded) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => (index + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        className={cn(
          'w-full rounded-full border border-line bg-surface pr-4 text-body text-fg shadow-soft placeholder:text-muted focus:border-primary focus:outline-none',
          size === 'lg' ? 'h-14 pl-13' : 'h-11 pl-11 shadow-none',
        )}
      />
      {expanded ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-soft"
        >
          {suggestions.map((entry, index) => {
            const Icon = entry.service ? SERVICES[entry.service].icon : KIND_ICON[entry.kind];
            return (
              <li
                key={entry.href + entry.label}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (blurTimer.current) window.clearTimeout(blurTimer.current);
                  go(entry.href);
                }}
                className={cn(
                  'flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2',
                  index === active ? 'bg-primary-soft' : 'hover:bg-surface-alt',
                )}
              >
                <Icon aria-hidden className="size-5 flex-none text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body">{entry.label}</span>
                  {entry.sublabel ? (
                    <span className="block truncate text-caption text-muted">{entry.sublabel}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </form>
  );
}
