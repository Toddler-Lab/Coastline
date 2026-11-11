import { Utensils } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Remote listing image, or a branded placeholder when the venue has none. */
export function VenueImage({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          'flex h-full w-full items-center justify-center bg-gradient-to-br from-raised via-surface to-deep',
          className,
        )}
      >
        <Utensils className="h-10 w-10 text-sea/50" aria-hidden />
      </div>
    );
  }

  return (
    // Seeded/remote listing URLs; matches the hotel cards, which also use a plain img.
    <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} />
  );
}
