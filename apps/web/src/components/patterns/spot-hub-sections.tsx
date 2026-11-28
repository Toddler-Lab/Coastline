import Link from 'next/link';
import { ArrowLeft, ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IMAGERY_CREDIT, tileMosaic } from '@/lib/imagery';
import { SERVICES, type ServiceKey } from '@/lib/services';

/** Aerial imagery of the actual place, with its credit line. */
export function AerialImage({
  latitude,
  longitude,
  zoom,
  label,
  className,
  cols = 4,
  rows = 3,
  priority = false,
}: {
  latitude: number;
  longitude: number;
  zoom: number;
  label: string;
  className?: string;
  cols?: number;
  rows?: number;
  priority?: boolean;
}) {
  const mosaic = tileMosaic(latitude, longitude, zoom, cols, rows);
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('relative overflow-hidden bg-surface-alt', className)}
    >
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2"
        style={{
          gridTemplateColumns: `repeat(${mosaic.cols}, 1fr)`,
          width: `max(100%, ${mosaic.cols * 256}px)`,
          minHeight: '100%',
          aspectRatio: `${mosaic.cols} / ${mosaic.rows}`,
        }}
      >
        {mosaic.tiles.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="block h-full w-full object-cover"
          />
        ))}
      </div>
    </div>
  );
}

export function ImageCredit({ className }: { className?: string }) {
  return <p className={cn('text-caption text-muted', className)}>{IMAGERY_CREDIT}</p>;
}

/** Photo or a quiet placeholder when there is none. Always 4:3 on cards. */
export function Photo({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('grid place-items-center bg-surface-alt text-muted', className)}
      >
        <ImageOff aria-hidden className="size-8" />
      </div>
    );
  }
  return (
    // Remote photos are listing data; next/image allow-lists are configured per host.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('bg-surface-alt object-cover', className)}
    />
  );
}

/** Back button + title used at the top of detail and list screens on phones. */
export function PageHeader({
  title,
  backHref,
  backLabel = 'Back',
  actions,
  subtitle,
  className,
  visuallyHiddenOnDesktop = false,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  visuallyHiddenOnDesktop?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2 py-3', className)}>
      {backHref ? (
        <Link
          href={backHref}
          aria-label={backLabel}
          title={backLabel}
          className="-ml-2 inline-flex size-11 flex-none items-center justify-center rounded-full hover:bg-surface-alt"
        >
          <ArrowLeft aria-hidden className="size-6" />
        </Link>
      ) : null}
      <div className={cn('min-w-0 flex-1', visuallyHiddenOnDesktop && 'lg:sr-only')}>
        <h1 className="truncate text-title-lg">{title}</h1>
        {subtitle ? <p className="truncate text-body-sm text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-none items-center gap-1">{actions}</div> : null}
    </div>
  );
}

/** Compact back link for hub pages whose hero carries the title. */
export function BackLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        '-ml-2 inline-flex h-11 items-center gap-1 rounded-full pl-1 pr-3 text-label hover:bg-surface-alt',
        className,
      )}
    >
      <ArrowLeft aria-hidden className="size-6" />
      {label}
    </Link>
  );
}

/** Large tappable service tile. Only service types with listings get one. */
export function ServiceTile({
  service,
  href,
  count,
  countLabel,
}: {
  service: ServiceKey;
  href: string;
  count?: number;
  countLabel?: string;
}) {
  const meta = SERVICES[service];
  const Icon = meta.icon;
  return (
    <Link
      href={href}
      className="glass-card group flex min-h-24 flex-col justify-between gap-3 rounded-2xl p-3 transition-all hover:-translate-y-0.5 hover:border-primary/50 md:p-4"
    >
      <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-primary group-hover:bg-surface">
        <Icon aria-hidden className="size-6" />
      </span>
      <span>
        <span className="block text-title-sm">{meta.label}</span>
        <span className="block truncate text-caption text-muted">
          {count !== undefined
            ? `${count} ${countLabel ?? (count === 1 ? meta.one : meta.noun)}`
            : meta.blurb}
        </span>
      </span>
    </Link>
  );
}

export function ServiceTileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

/** Horizontal card row on phones; a 3-4 column grid on expanded screens. */
export function CardRow({
  label,
  children,
  columns = 3,
}: {
  label: string;
  children: React.ReactNode;
  columns?: 3 | 4;
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        'bleed-row scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0',
        columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
      )}
    >
      {children}
    </ul>
  );
}

export function CardRowItem({ children }: { children: React.ReactNode }) {
  return <li className="w-[78%] flex-none snap-start md:w-[44%] lg:w-auto">{children}</li>;
}

/** Bold row link used for help shortcuts and "Know before you go". */
export function RowLink({
  href,
  icon: Icon,
  title,
  body,
  tone = 'primary',
  external = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  title: string;
  body?: string;
  tone?: 'primary' | 'danger';
  external?: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          'grid size-11 flex-none place-items-center rounded-full',
          tone === 'danger' ? 'bg-danger/12 text-danger' : 'bg-primary-soft text-primary',
        )}
      >
        <Icon aria-hidden className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-title-sm">{title}</span>
        {body ? <span className="block text-body-sm text-muted">{body}</span> : null}
      </span>
      <ChevronRight aria-hidden className="size-5 flex-none text-muted" />
    </>
  );
  const className =
    'glass-card flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:border-primary/40';
  return external ? (
    <a href={href} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
