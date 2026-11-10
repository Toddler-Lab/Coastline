import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-14 w-full max-w-[1440px] border-t border-line px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-foam">
            <Logo className="h-6 w-6 text-sea" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Coastline</span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-mist">
            Smart Cox&rsquo;s Bazar coastal services demonstrator. Sunbed booking & shoreline map is live.
            Hotels, beach dining, rides, and water sports modules are in development.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="label mb-2">Live Services</p>
            <Link href="/" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Beach map (Sunbeds)
            </Link>
            <Link href="/bookings" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              My bookings & QR tickets
            </Link>
          </div>

          <div>
            <p className="label mb-2">Future Modules</p>
            <Link href="/hotels" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Hotels & Stays <span className="font-mono text-[8px] text-sand">(Dev)</span>
            </Link>
            <Link href="/food" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Food & Dining <span className="font-mono text-[8px] text-sand">(Dev)</span>
            </Link>
            <Link href="/rides" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Rides & Transport <span className="font-mono text-[8px] text-sand">(Dev)</span>
            </Link>
            <Link href="/activities" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Water sports <span className="font-mono text-[8px] text-sand">(Dev)</span>
            </Link>
          </div>

          <div>
            <p className="label mb-2">Governance & Ops</p>
            <Link href="/admin" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Admin console
            </Link>
            <Link
              href="/admin/bookings"
              className="block py-1 text-[12.5px] text-mist hover:text-foam"
            >
              Desk check-in & Scanner
            </Link>
            <Link
              href="/admin/points"
              className="block py-1 text-[12.5px] text-mist hover:text-foam"
            >
              Beach points manager
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t border-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist/60">
          Imagery © Esri, Maxar, Earthstar Geographics · Proposal Demonstrator only
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist/60">
          Asia/Dhaka (UTC+6)
        </p>
      </div>
    </footer>
  );
}
