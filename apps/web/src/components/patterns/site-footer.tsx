'use client';

import Link from 'next/link';
import { Compass, Heart, Phone, ShieldCheck, Umbrella, Utensils, BedDouble } from 'lucide-react';
import { LogoMark } from './logo';

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line/60 bg-surface/70 backdrop-blur-xl">
      <div className="dl-wrap py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Purpose */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-lg font-extrabold text-fg">
              <LogoMark className="size-7" />
              <span>Coastline</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Bangladesh 2026
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted">
              Next-generation tourism platform connecting travelers with verified beach sunbeds, heritage stays, local cuisine, and verified guides across Bangladesh.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-4 text-primary flex-none" />
              <span>Independent platform · Commission on bookings · Sandbox payments</span>
            </div>
          </div>

          {/* Destinations Column */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-fg">Destinations</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>
                <Link href="/d/coxs-bazar" className="transition-colors hover:text-primary">
                  Cox&apos;s Bazar (Coast)
                </Link>
              </li>
              <li>
                <Link href="/d/sylhet" className="transition-colors hover:text-primary">
                  Sylhet (Wetlands & Tea)
                </Link>
              </li>
              <li>
                <Link href="/d/rangamati" className="transition-colors hover:text-primary">
                  Rangamati (Kaptai Lake)
                </Link>
              </li>
              <li>
                <Link href="/d/bandarban" className="transition-colors hover:text-primary">
                  Bandarban (Highlands)
                </Link>
              </li>
              <li>
                <Link href="/d/sundarbans" className="transition-colors hover:text-primary">
                  Sundarbans (Mangroves)
                </Link>
              </li>
            </ul>
          </div>

          {/* Experiences Column */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-fg">Experiences</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>
                <Link href="/sunbeds" className="transition-colors hover:text-primary">
                  Sunbed Booking
                </Link>
              </li>
              <li>
                <Link href="/stays" className="transition-colors hover:text-primary">
                  Hotels & Resorts
                </Link>
              </li>
              <li>
                <Link href="/dining" className="transition-colors hover:text-primary">
                  Dining & Sunbed Delivery
                </Link>
              </li>
              <li>
                <Link href="/photographers" className="transition-colors hover:text-primary">
                  Beach Photographers
                </Link>
              </li>
              <li>
                <Link href="/trips" className="transition-colors hover:text-primary">
                  Digital Tickets & Passes
                </Link>
              </li>
              <li>
                <Link href="/saved" className="transition-colors hover:text-primary">
                  Saved Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety & Help Column */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-fg">Help & Safety</p>
            <ul className="mt-3 space-y-2 text-xs text-muted">
              <li>
                <a href="tel:999" className="font-semibold text-danger hover:underline flex items-center gap-1.5">
                  <Phone className="size-3.5" /> 999 National Emergency
                </a>
              </li>
              <li>
                <a href="tel:01320169999" className="transition-colors hover:text-primary">
                  Tourist Police: 01320-169999
                </a>
              </li>
              <li>
                <Link href="/help/lost-found" className="transition-colors hover:text-primary">
                  Lost & Found Desk
                </Link>
              </li>
              <li>
                <Link href="/help" className="transition-colors hover:text-primary">
                  Help Center & FAQs
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-primary">
                  Privacy & Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-6 text-xs text-muted sm:flex-row">
          <p>© 2026 Coastline Bangladesh. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-fg">Terms</Link>
            <Link href="/privacy" className="hover:text-fg">Privacy</Link>
            <Link href="/about" className="hover:text-fg">About Coastline</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
