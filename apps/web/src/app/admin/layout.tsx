import type { Metadata } from 'next';
import { ShieldCheck, Wrench } from 'lucide-react';
import { AdminNav } from '@/components/admin/admin-nav';
import { ErrorState } from '@/components/ui/states';
import { getViewer } from '@/lib/session';

export const metadata: Metadata = {
  title: {
    default: 'Operations desk',
    template: '%s · Operations desk',
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();

  if (!viewer.user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState
          title="API offline"
          message="The operations desk cannot reach the API. Start the API and refresh this page."
        />
      </main>
    );
  }

  if (viewer.user.role !== 'ADMIN') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="panel corner-ticks p-6 sm:p-8">
          <p className="label flex items-center gap-2">
            <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-coral" />
            Restricted · operations desk
          </p>
          <h1 className="mt-3 text-3xl">This is the operations desk.</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-mist">
            You are viewing as <span className="text-foam">{viewer.user.name}</span> (Tourist). This
            area needs an administrator session.
          </p>
          <p className="mt-2 max-w-prose text-[13.5px] leading-relaxed text-mist">
            Use the persona switch in the header to change to a demo administrator, then reload this
            page. The API also checks the role on every admin request.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 pb-20 pt-6 sm:px-6 lg:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 place-items-center rounded-xl border border-sea/30 bg-sea/10 text-sea"
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="label">Operations desk</p>
            <p className="mt-0.5 text-[12.5px] text-foam">
              Admin session
              <span aria-hidden className="mx-1.5 text-mist/60">
                ·
              </span>
              <span className="text-mist">{viewer.user.name}</span>
            </p>
          </div>
        </div>
        <AdminNav />
      </div>

      <div className="mt-6">{children}</div>

      <p className="mt-10 flex items-start gap-2 border-t border-line pt-4 text-[11.5px] leading-relaxed text-mist">
        <Wrench aria-hidden className="mt-0.5 h-3.5 w-3.5 flex-none text-coral" />
        <span>
          Demo operations: prices, payments, refunds and tickets are simulated. Every action writes
          to the demo database and is audit-logged; no real money moves.
        </span>
      </p>
    </main>
  );
}
