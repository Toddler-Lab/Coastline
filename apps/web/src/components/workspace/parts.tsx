import Link from 'next/link';
import { Construction, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { EmptyState } from '@/components/ui/states';
import { WorkspaceSwitcher } from '@/components/patterns/workspace-switcher';
import type { Workspace } from '@/components/patterns/session';

/** Staff pages are denser: 16 px side margins and a 1200 max width. */
export function StaffPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 py-5 lg:px-8 lg:py-8', className)}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title-lg">{title}</h1>
          {description ? <p className="mt-0.5 text-body-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-body-sm text-muted">{label}</p>
      <p className="tabular mt-1 text-title-lg">{value}</p>
      {hint ? <p className="mt-0.5 text-caption text-muted">{hint}</p> : null}
    </>
  );
  return href ? (
    <Link
      href={href}
      className="block rounded-md border border-line bg-surface p-4 hover:bg-surface-alt"
    >
      {body}
    </Link>
  ) : (
    <Card className="p-4">{body}</Card>
  );
}

export function ComingSoon({
  title,
  body,
  workPackage,
}: {
  title: string;
  body: string;
  workPackage: string;
}) {
  return (
    <StaffPage title={title}>
      <EmptyState
        icon={Construction}
        title="Not available yet"
        body={`${body} Planned in ${workPackage}.`}
      />
    </StaffPage>
  );
}

export function WorkspaceDenied({ workspace }: { workspace: Workspace }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <ShieldAlert aria-hidden className="size-10 text-warn" />
      <h1 className="mt-3 text-title-lg">This workspace is for staff accounts</h1>
      <p className="mt-1 text-body text-muted">
        Your account cannot open the {workspace} workspace. Switch to a staff account, or go back to
        exploring.
      </p>
      <Link href="/" className={buttonClass('secondary', 'md', 'mt-4')}>
        Back to Explore
      </Link>
      <div className="mt-8">
        <WorkspaceSwitcher current="visitor" />
      </div>
    </div>
  );
}
