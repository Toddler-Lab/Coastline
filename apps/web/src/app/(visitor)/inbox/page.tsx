import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell, CalendarDays, Inbox, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Inbox & Notifications | Coastline' };

export default function InboxPage() {
  return (
    <div className="page max-w-3xl pb-24">
      <PageHeader
        title="Inbox & Notifications"
        subtitle="Live booking updates, safety bulletins and provider communications"
        className="lg:pt-6"
      />

      <div className="mt-2 flex gap-2 overflow-x-auto border-b border-line pb-3">
        {['All Updates', 'Bookings', 'Safety Bulletins', 'Provider Messages'].map((tab, idx) => (
          <button
            key={tab}
            type="button"
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              idx === 0
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-surface-alt/70 text-muted hover:bg-surface-alt hover:text-fg'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {/* Live Safety Announcement Card */}
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="grid size-11 flex-none place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-fg">Welcome to Coastline 2026</h3>
                <span className="text-[10px] text-muted">Platform Update</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Your live booking confirmations, check-in QR codes, and sunbed passes appear directly in the Trips tab. Beach desks and hotel attendants can scan your QR code for rapid paperless check-in.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/trips"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <CalendarDays className="size-3.5" /> View Active Trips →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="rounded-3xl border border-line/60 bg-surface/50 p-8 text-center backdrop-blur-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-alt text-muted">
            <Inbox className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-bold text-fg">No direct messages</h3>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
            Conversations with local providers, dining kitchens, and desk attendants will be displayed here in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
