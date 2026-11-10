import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-14 w-full max-w-[1440px] border-t border-line px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <div className="flex items-center gap-2 text-foam">
            <Logo className="h-6 w-6 text-sea" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Coastline</span>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-mist">
            A working demonstrator for hourly sunbed booking on the Cox&rsquo;s Bazar coast. Prices,
            payments and QR tickets are simulated. Beach coordinates are approximate.
          </p>
        </div>
        <div className="flex gap-10">
          <div>
            <p className="label mb-2">Book</p>
            <Link href="/" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Beach map
            </Link>
            <Link href="/bookings" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              My bookings
            </Link>
          </div>
          <div>
            <p className="label mb-2">Operate</p>
            <Link href="/admin" className="block py-1 text-[12.5px] text-mist hover:text-foam">
              Admin console
            </Link>
            <Link
              href="/admin/bookings"
              className="block py-1 text-[12.5px] text-mist hover:text-foam"
            >
              Check-in
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-8 font-mono text-[9px] uppercase tracking-[0.16em] text-mist/60">
        Imagery © Esri, Maxar, Earthstar Geographics · Demo data only
      </p>
    </footer>
  );
}
