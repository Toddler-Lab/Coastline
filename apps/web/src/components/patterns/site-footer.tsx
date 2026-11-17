import Link from 'next/link';
import { LogoMark } from './logo';

/** Expanded screens only; on phones the same links live in Profile. */
export function SiteFooter() {
  return (
    <footer className="no-print hidden border-t border-line bg-surface lg:block">
      <div className="page flex items-start justify-between gap-8 py-8 text-body-sm text-muted">
        <div className="max-w-md">
          <p className="flex items-center gap-2 text-title-sm text-fg">
            <LogoMark className="size-6" /> Coastline
          </p>
          <p className="mt-2">
            An independent booking platform. Prices are set by each provider; Coastline earns a
            commission on bookings. Payments run through a sandbox gateway: they are recorded, and
            no money moves.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex gap-6">
            <li>
              <Link href="/about" className="hover:text-fg hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/help" className="hover:text-fg hover:underline">
                Help centre
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-fg hover:underline">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-fg hover:underline">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
