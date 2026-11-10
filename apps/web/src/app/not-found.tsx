import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-6">
      <p className="label">404</p>
      <h1 className="text-3xl">No such stretch of coast.</h1>
      <p className="max-w-prose text-[13.5px] leading-relaxed text-mist">
        That beach point or booking reference does not exist.
      </p>
      <Link href="/" className={buttonClass('primary', 'md')}>
        Back to the map
      </Link>
    </main>
  );
}
