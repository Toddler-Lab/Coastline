import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, MapPin, Sparkles, Umbrella, ArrowRight } from 'lucide-react';
import { DRONE_DESTINATIONS } from '@/lib/drone-landing-data';
import { PageHeader } from '@/components/patterns/spot-hub-sections';

export const metadata: Metadata = {
  title: 'Destinations of Bangladesh | Coastline',
  description: 'Explore the 5 premier tourism territories of Bangladesh: Cox’s Bazar, Sylhet, Rangamati, Bandarban, and Sundarbans.',
};

export default function DestinationsPage() {
  return (
    <div className="page pb-24">
      <PageHeader
        title="Destinations of Bangladesh"
        subtitle="Explore regional territories, natural landscapes and tourist spots across Bangladesh"
        className="lg:pt-6"
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {DRONE_DESTINATIONS.map((dest, idx) => (
          <div
            key={dest.id}
            className="group relative overflow-hidden rounded-3xl border border-line bg-surface shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
          >
            {/* Hero Image / Video Container */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-alt">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/media/places/${dest.hero}.webp`}
                alt={dest.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

              {/* Telemetry pill */}
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-mono text-white/90 backdrop-blur-md border border-white/15">
                  <Compass className="size-3.5 text-accent" />
                  {dest.coord}
                </span>
                <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs font-mono text-white/80 backdrop-blur-md border border-white/15">
                  ALT {dest.alt}M
                </span>
              </div>

              {/* Title & Tagline overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Territory 0{idx + 1}
                  </span>
                  <span className="font-bn text-sm text-white/80">{dest.bn}</span>
                </div>
                <h2 className="mt-1 text-2xl font-extrabold md:text-3xl">{dest.name}</h2>
                <p className="mt-1 text-xs text-white/85 line-clamp-1">{dest.tag}</p>
              </div>
            </div>

            {/* Destination Info & Spots Drawer */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-line text-xs">
                <div>
                  <span className="text-muted block font-medium">Best Season</span>
                  <span className="font-bold text-fg mt-0.5 block">{dest.best}</span>
                </div>
                <div>
                  <span className="text-muted block font-medium">Getting There</span>
                  <span className="font-bold text-fg mt-0.5 block truncate">{dest.getThere}</span>
                </div>
              </div>

              {/* Spot pills inside this destination */}
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5">
                  Tourist Spots ({dest.spots.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dest.spots.map((spot) => (
                    <Link
                      key={spot.id}
                      href={`/d/${dest.id}/s/${spot.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-3 py-1 text-xs font-medium text-fg transition-colors hover:bg-action-bg hover:text-action-fg"
                    >
                      <MapPin className="size-3 text-muted group-hover:text-white" />
                      {spot.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-line">
                <span className="text-xs text-muted">
                  Full region guide & bookings
                </span>
                <Link
                  href={`/d/${dest.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-action-bg px-4 py-2 text-xs font-bold text-action-fg shadow-md transition-all hover:bg-action-bg/90 hover:scale-105"
                >
                  Explore {dest.name} <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
