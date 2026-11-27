import type { Metadata } from 'next';
import { Lock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/patterns/spot-hub-sections';

export const metadata: Metadata = { title: 'Privacy Policy | Coastline' };

export default function PrivacyPage() {
  return (
    <div className="page max-w-3xl pb-24">
      <PageHeader
        title="Privacy Policy"
        subtitle="Data protection and privacy commitments"
        backHref="/profile"
        backLabel="Back to Profile"
        className="lg:pt-6"
      />
      <div className="mt-4 rounded-3xl border border-line bg-surface p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <Lock className="size-5 text-primary flex-none mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-fg">Privacy Standards</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Coastline protects your privacy. In demonstration mode, session cookies manage persona switching. When real authentication goes live, personal data is strictly isolated, and payment card details are never handled directly by our application servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
