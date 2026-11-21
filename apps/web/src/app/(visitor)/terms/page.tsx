import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/patterns/hub';

export const metadata: Metadata = { title: 'Terms of Service | Coastline' };

export default function TermsPage() {
  return (
    <div className="page max-w-3xl pb-24">
      <PageHeader
        title="Terms of Service"
        subtitle="Platform usage, booking rules and cancellation terms"
        backHref="/profile"
        backLabel="Back to Profile"
        className="lg:pt-6"
      />
      <div className="mt-4 rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 text-primary flex-none mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-fg">Sandbox Mode & Transparency Notice</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Coastline operates as an independent marketplace facilitating travel bookings in Bangladesh. Payments are currently processed in demonstration sandbox mode with full ledger and audit tracking. No real financial credentials are ever requested or stored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
