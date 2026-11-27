import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import {
  Briefcase,
  CircleHelp,
  Compass,
  FileText,
  Info,
  Languages,
  Lock,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { getViewer } from '@/lib/session';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { Avatar, Card } from '@/components/ui/display';
import { PageHeader, RowLink } from '@/components/patterns/spot-hub-sections';
import { ThemeChoice } from '@/components/patterns/theme-choice';
import { WorkspaceSwitcher } from '@/components/patterns/workspace-switcher';

export const metadata: Metadata = { title: 'Profile | Coastline' };

export default async function ProfilePage() {
  const viewer = await getViewer();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const user = viewer.user;

  return (
    <div className="page max-w-3xl pb-24">
      <PageHeader
        title="Account & Profile"
        subtitle="Manage your identity, demo personas and system preferences"
        className="lg:pt-6"
      />

      <div className="space-y-6">
        {/* 2026 User Identity Terminal */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={user?.name ?? 'Guest'} className="size-16 text-lg font-bold shadow-md ring-2 ring-primary/30" />
                <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <ShieldCheck className="size-3" />
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-fg">{user?.name ?? 'Guest Visitor'}</h2>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    {user?.role ?? 'TOURIST'}
                  </span>
                </div>
                {user?.email ? (
                  <p className="truncate text-xs text-muted mt-0.5">{user.email}</p>
                ) : (
                  <p className="text-xs text-muted mt-0.5">Demo Account · Bangladesh Tourism Sandbox</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-surface-alt px-3 py-1.5 text-xs text-muted">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Session Active</span>
            </div>
          </div>
        </div>

        {/* Demo Persona Workspace Switcher */}
        <section aria-labelledby="switch-title" className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="switch-title" className="text-base font-bold text-fg flex items-center gap-2">
                <UserCheck className="size-4 text-primary" />
                Switch Demo Persona
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Switch between seeded tourist, local provider, beach desk attendant, and platform admin.
              </p>
            </div>
          </div>
          <WorkspaceSwitcher current="visitor" />
        </section>

        {/* System Settings & Display Theme */}
        <section aria-labelledby="settings-title" className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <h2 id="settings-title" className="text-base font-bold text-fg flex items-center gap-2 mb-4">
            <Sparkles className="size-4 text-primary" />
            Appearance & System
          </h2>
          <div className="space-y-4">
            <ThemeChoice initial={theme} />
            <div className="flex items-start gap-3 rounded-2xl bg-surface-alt p-4">
              <Languages aria-hidden className="mt-0.5 size-5 flex-none text-muted" />
              <div>
                <p className="text-xs font-bold text-fg">Language & Script</p>
                <p className="text-xs text-muted mt-0.5">
                  English (International) & <span lang="bn" className="font-semibold text-fg">বাংলা (বাংলাদেশ)</span>. Toggle using the language switch in the top bar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Support & Documentation */}
        <section aria-labelledby="more-title" className="space-y-2.5">
          <h2 id="more-title" className="text-sm font-bold uppercase tracking-wider text-muted px-1">
            Platform & Legal
          </h2>
          <RowLink
            href="/help"
            icon={CircleHelp}
            title="Help Centre & Safety Guidelines"
            body="Emergency contacts, lifeguards, payment guarantees, refunds"
          />
          <RowLink href="/about" icon={Info} title="About Coastline Bangladesh" />
          <RowLink
            href="/about#providers"
            icon={Briefcase}
            title="Become a Coastline Verified Provider"
            body="List beach sunbeds, heritage stays, seafood dining, or boat tours"
          />
          <RowLink href="/terms" icon={FileText} title="Terms of Service" />
          <RowLink href="/privacy" icon={Lock} title="Privacy Policy" />
        </section>
      </div>
    </div>
  );
}
