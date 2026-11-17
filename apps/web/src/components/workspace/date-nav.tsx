import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, formatDateKey, relativeDateLabel } from '@/lib/format';
import { buttonClass } from '@/components/ui/button';

/** Previous / today / next day links that keep the other query parameters. */
export function DateNav({
  base,
  date,
  today,
  params = {},
}: {
  base: string;
  date: string;
  today: string;
  params?: Record<string, string | undefined>;
}) {
  const href = (key: string) => {
    const search = new URLSearchParams();
    for (const [name, value] of Object.entries(params)) if (value) search.set(name, value);
    if (key !== today) search.set('date', key);
    const query = search.toString();
    return query ? `${base}?${query}` : base;
  };
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Day">
      <Link
        href={href(addDays(date, -1))}
        aria-label="Previous day"
        className={buttonClass('secondary', 'md', 'px-0')}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </Link>
      <span className="min-w-36 text-center text-label">
        {relativeDateLabel(date, today)}
        {date !== today ? null : (
          <span className="block text-caption font-normal text-muted">{formatDateKey(date)}</span>
        )}
      </span>
      <Link
        href={href(addDays(date, 1))}
        aria-label="Next day"
        className={buttonClass('secondary', 'md', 'px-0')}
      >
        <ChevronRight aria-hidden className="size-5" />
      </Link>
      {date !== today ? (
        <Link href={href(today)} className={buttonClass('text', 'md')}>
          Today
        </Link>
      ) : null}
    </div>
  );
}
