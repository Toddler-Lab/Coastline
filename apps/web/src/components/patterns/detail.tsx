import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Photo } from './hub';

/** Swipe gallery on phones, a grid of up to five on expanded screens. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const list = images.filter(Boolean);
  if (list.length === 0) {
    return (
      <Photo src={null} alt={alt} className="aspect-[4/3] w-full rounded-lg md:aspect-[21/9]" />
    );
  }
  return (
    <>
      <ul
        aria-label={`${alt} photos`}
        className="bleed-row scrollbar-none flex snap-x snap-mandatory gap-2 overflow-x-auto lg:hidden"
      >
        {list.map((src, index) => (
          <li
            key={src + index}
            className="w-[88%] flex-none snap-center first:w-full first:last:w-full md:w-[70%]"
          >
            <Photo
              src={src}
              alt={`${alt}, photo ${index + 1} of ${list.length}`}
              priority={index === 0}
              className="aspect-[4/3] w-full rounded-lg"
            />
          </li>
        ))}
      </ul>
      <div
        className={cn(
          'hidden gap-2 overflow-hidden rounded-lg lg:grid',
          list.length >= 3 ? 'grid-cols-4 grid-rows-2' : 'grid-cols-2',
        )}
        style={{ height: 420 }}
      >
        {list.slice(0, 5).map((src, index) => (
          <Photo
            key={src + index}
            src={src}
            alt={`${alt}, photo ${index + 1}`}
            priority={index === 0}
            className={cn(
              'h-full w-full',
              index === 0 && list.length >= 3 && 'col-span-2 row-span-2',
            )}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Detail page shape: content in 8 columns, sticky booking card in 4 on
 * expanded screens; sticky bottom bar with price and the primary button on
 * phones.
 */
export function DetailLayout({
  backHref,
  backLabel,
  headerActions,
  gallery,
  children,
  bookingCard,
  bookingBar,
}: {
  backHref: string;
  backLabel: string;
  headerActions?: React.ReactNode;
  gallery: React.ReactNode;
  children: React.ReactNode;
  bookingCard: React.ReactNode;
  bookingBar: React.ReactNode;
}) {
  return (
    <div className="page">
      <div className="flex items-center justify-between py-2 lg:py-4">
        <Link
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
          className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full px-2 text-label hover:bg-surface-alt"
        >
          <ArrowLeft aria-hidden className="size-6" />
          <span className="hidden md:inline">{backLabel}</span>
        </Link>
        <div className="flex items-center gap-1">{headerActions}</div>
      </div>
      {gallery}
      <div className="mt-5 lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="space-y-8 lg:col-span-8">{children}</div>
        <div className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-[calc(var(--topbar-h)+24px)]">{bookingCard}</div>
        </div>
      </div>
      <div className="h-24 lg:hidden" aria-hidden />
      <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-soft lg:hidden">
        {bookingBar}
      </div>
    </div>
  );
}

export function FactChips({
  facts,
}: {
  facts: Array<{
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    label: string;
  }>;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {facts.map((fact) => (
        <li
          key={fact.label}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface-alt px-3 text-body-sm"
        >
          <fact.icon aria-hidden className="size-4 text-primary" />
          {fact.label}
        </li>
      ))}
    </ul>
  );
}
