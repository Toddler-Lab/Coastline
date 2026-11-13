import Link from 'next/link';
import { ArrowLeft, Clock, Construction, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { SiteFooter } from '@/components/site/site-footer';

export interface ModuleHighlight {
  title: string;
  desc: string;
  badge?: string;
}

export interface UnderDevelopmentModuleProps {
  moduleKey: 'hotels' | 'food' | 'rides' | 'activities';
  title: string;
  bengaliTitle: string;
  icon: React.ElementType;
  tagline: string;
  description: string;
  phaseLabel?: string;
  indicativeTariff?: string;
  highlights: ModuleHighlight[];
  mockStats?: Array<{ label: string; value: string }>;
}

export function UnderDevelopmentModule({
  title,
  bengaliTitle,
  icon: Icon,
  tagline,
  description,
  phaseLabel = 'Sprint 4 · Milestone 2',
  indicativeTariff,
  highlights,
  mockStats,
}: UnderDevelopmentModuleProps) {
  return (
    <div className="min-h-[calc(100dvh-var(--header-height)-var(--banner-height))] flex flex-col justify-between">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {/* Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12.5px] font-medium text-mist transition-colors hover:text-foam"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Beach Map (Sunbeds)
          </Link>
          <div className="flex items-center gap-2">
            <Badge tone="warn">Under Development</Badge>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-mist/70 sm:inline">
              {phaseLabel}
            </span>
          </div>
        </div>

        {/* Hero Banner */}
        <Panel className="relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-sea/5 blur-3xl" />
          <div className="pointer-events-none absolute right-6 top-6 opacity-10">
            <Icon className="h-32 w-32 text-sea" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-sea/30 bg-sea/10 text-sea">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-sand">
                  {bengaliTitle}
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-foam sm:text-3xl">{title}</h1>
              </div>
            </div>

            <p className="mt-4 text-[14px] font-medium text-foam/90 sm:text-[15px]">{tagline}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-mist">{description}</p>

            {indicativeTariff ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line bg-abyss/40 px-3 py-1.5 font-mono text-[11px] text-mist">
                <span className="text-sand">Indicative tariff reference:</span>
                <span className="font-semibold text-foam">{indicativeTariff}</span>
              </div>
            ) : null}
          </div>

          {/* Quick Mock Stats */}
          {mockStats && mockStats.length > 0 ? (
            <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 border-t border-line/60 pt-6 sm:grid-cols-4">
              {mockStats.map((stat) => (
                <div key={stat.label} className="rounded-lg bg-raised/30 p-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-mist">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-mono text-[15px] font-semibold text-foam">{stat.value}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Panel>

        {/* Planned Features & Architecture Preview */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-foam">Planned Feature Roadmap & Specs</h2>
            <span className="flex items-center gap-1.5 font-mono text-[9.5px] text-mist">
              <Clock className="h-3 w-3 text-sea" />
              PRD FR-01 · FR-05
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((h) => (
              <Panel key={h.title} className="p-4 transition-colors hover:border-line-strong">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-foam">{h.title}</h3>
                  {h.badge ? (
                    <span className="rounded bg-sea/10 px-1.5 py-0.5 font-mono text-[8.5px] font-medium text-sea">
                      {h.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-mist">{h.desc}</p>
              </Panel>
            ))}
          </div>
        </div>

        {/* Notice & Demo Callout */}
        <div className="mt-8 rounded-2xl border border-dashed border-warn/35 bg-warn/5 p-4 sm:p-5">
          <div className="flex gap-3">
            <Construction className="h-5 w-5 flex-none text-warn" />
            <div>
              <h4 className="text-[13px] font-semibold text-foam">
                Demonstrator in Active Development
              </h4>
              <p className="mt-1 text-[12px] leading-relaxed text-mist">
                The <strong>Sunbed Booking & Coastline Map</strong> module is currently live and
                fully functional. This module ({title}) is being integrated into the API contracts,
                PostgreSQL schema, and provider moderation workflows according to the 12-week
                delivery roadmap.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href="/" className={buttonClass('primary', 'sm')}>
                  <Sparkles className="h-3.5 w-3.5" />
                  Try live Sunbed Booking on the Map
                </Link>
                <Link href="/bookings" className={buttonClass('ghost', 'sm')}>
                  View My Demo Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
