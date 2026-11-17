import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Briefcase, CircleHelp, FileText, Info, Languages, Lock } from 'lucide-react';
import { getViewer } from '@/lib/session';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';
import { Avatar, Card } from '@/components/ui/display';
import { PageHeader, RowLink } from '@/components/patterns/hub';
import { ThemeChoice } from '@/components/patterns/theme-choice';
import { WorkspaceSwitcher } from '@/components/patterns/workspace-switcher';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const viewer = await getViewer();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const user = viewer.user;

  return (
    <div className="page max-w-3xl">
      <PageHeader title="Profile" className="lg:pt-6" />
      <div className="space-y-8">
        <Card className="flex items-center gap-4 p-5">
          <Avatar name={user?.name ?? 'Guest'} className="size-14 text-title-sm" />
          <div className="min-w-0">
            <p className="text-title">{user?.name ?? 'Guest'}</p>
            {user?.email ? <p className="truncate text-body-sm text-muted">{user.email}</p> : null}
          </div>
        </Card>

        <section aria-labelledby="settings-title" className="space-y-4">
          <h2 id="settings-title" className="text-title">
            Settings
          </h2>
          <ThemeChoice initial={theme} />
          <Card className="flex items-start gap-3 p-4">
            <Languages aria-hidden className="mt-0.5 size-6 flex-none text-muted" />
            <div>
              <p className="text-label">Language</p>
              <p className="text-body-sm text-muted">
                English. <span lang="bn">বাংলা</span> is coming in a later update.
              </p>
            </div>
          </Card>
        </section>

        <section aria-labelledby="switch-title">
          <h2 id="switch-title" className="mb-4 text-title">
            Account and workspaces
          </h2>
          <WorkspaceSwitcher current="visitor" />
        </section>

        <section aria-labelledby="more-title" className="space-y-3">
          <h2 id="more-title" className="text-title">
            More
          </h2>
          <RowLink
            href="/help"
            icon={CircleHelp}
            title="Help centre"
            body="Bookings, payments, cancellations"
          />
          <RowLink href="/about" icon={Info} title="About Coastline" />
          <RowLink
            href="/about#providers"
            icon={Briefcase}
            title="Become a provider"
            body="List your stay, food or service"
          />
          <RowLink href="/terms" icon={FileText} title="Terms" />
          <RowLink href="/privacy" icon={Lock} title="Privacy" />
        </section>
      </div>
    </div>
  );
}
