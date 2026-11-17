import Link from 'next/link';
import { Compass } from 'lucide-react';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="main" className="page grid min-h-[70dvh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <Compass aria-hidden className="mx-auto size-12 text-primary" />
        <h1 className="mt-4 text-title-lg">We could not find that page</h1>
        <p className="mt-2 text-body text-muted">
          The link may be old, or the place is no longer listed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/" className={buttonClass('primary')}>
            Go to Explore
          </Link>
          <Link href="/trips" className={buttonClass('secondary')}>
            Open Trips
          </Link>
        </div>
      </div>
    </main>
  );
}
