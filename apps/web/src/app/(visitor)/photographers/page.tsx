import type { Metadata } from 'next';
import Link from 'next/link';
import { Camera, CheckCircle2, ShieldCheck, Sparkles, Video, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = {
  title: 'Beach & Drone Photographers | Coastline',
  description: 'Hire verified beach and drone photographers in Cox’s Bazar and Sylhet with transparent pricing and verified digital delivery.',
};

export default function PhotographersPage() {
  return (
    <div className="page pb-24">
      <PageHeader
        title="Beach & Drone Photography"
        subtitle="Professional sunset portraits, couple shoots and 4K drone cinematography on Bangladesh beaches"
        className="lg:pt-6"
      />

      {/* Hero Banner */}
      <div className="relative mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-md">
        <div className="relative aspect-[21/9] w-full min-h-[260px] overflow-hidden bg-surface-alt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/places/coxs_beach_waves.webp"
            alt="Beach Photography"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/80 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="size-3.5" /> Verified Photographers Network
            </span>
            <h2 className="mt-2 text-2xl font-extrabold md:text-4xl">Pay Only for the Photos You Love</h2>
            <p className="mt-1 text-xs text-white/80 max-w-xl">
              Standard beach portrait rate: Tk 5 per keeper photo. Attendants transfer high-resolution digital files instantly to your phone via AirDrop or WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Package Options */}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-sm hover:border-primary/40 transition-colors">
          <div>
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Camera className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-fg">Beach Walk & Sunset Portraits</h3>
            <p className="mt-1 text-xs text-muted">
              Photographer accompanies you along the surf line at Laboni, Sugandha, or Kolatoli.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> Tk 5 / selected digital photo
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> Instant file transfer on the beach
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> No minimum purchase required
              </li>
            </ul>
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-extrabold text-fg">Tk 5 <span className="text-xs font-normal text-muted">/ keeper</span></p>
            <Link
              href="/d/coxs-bazar/photographers"
              className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Find Beach Photographers <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-primary/40 bg-surface p-6 shadow-md relative">
          <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            Most Popular
          </span>
          <div>
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Video className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-fg">4K Drone Cinematography</h3>
            <p className="mt-1 text-xs text-muted">
              Dramatic overhead tracking shots of your group along Marine Drive and Inani coral reefs.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> 20-minute flight session
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> Color-graded 4K 60FPS video reels
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> Licensed CAAB drone operator
              </li>
            </ul>
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-extrabold text-fg">Tk 1,500 <span className="text-xs font-normal text-muted">/ session</span></p>
            <Link
              href="/d/coxs-bazar/photographers"
              className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary/90 transition-colors"
            >
              Book Drone Operator <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-sm hover:border-primary/40 transition-colors">
          <div>
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </div>
            <h3 className="mt-4 text-base font-bold text-fg">Half-Day Coastal Story</h3>
            <p className="mt-1 text-xs text-muted">
              Dedicated photographer travels with your group down the Marine Drive coast to Teknaf.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> 4-hour coverage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> Unlimited edited photos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" /> Cloud gallery with permanent link
              </li>
            </ul>
          </div>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-sm font-extrabold text-fg">Tk 3,500 <span className="text-xs font-normal text-muted">/ half-day</span></p>
            <Link
              href="/d/coxs-bazar/photographers"
              className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
            >
              Request Coverage <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm flex items-start gap-3">
        <ShieldCheck className="size-5 text-primary flex-none mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-fg">Verified Identity & Security</h4>
          <p className="text-xs text-muted mt-0.5">
            Coastline photographers carry active registered badges verified by the Tourist Police. Never surrender your mobile device; files are delivered via wireless direct transfer.
          </p>
        </div>
      </div>
    </div>
  );
}
