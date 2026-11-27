import type { Metadata } from 'next';
import Link from 'next/link';
import { Flag, Siren } from 'lucide-react';
import { buttonClass } from '@/components/ui/button';
import { Card } from '@/components/ui/display';
import { Notice } from '@/components/ui/feedback-states';
import { PageHeader } from '@/components/patterns/spot-hub-sections';

export const metadata: Metadata = { title: 'Report a problem' };

const CATEGORIES = [
  'Overcharging',
  'Safety',
  'Cleanliness',
  'A listing is wrong',
  'A provider behaved badly',
  'Something else',
];

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const ref = typeof query.ref === 'string' ? query.ref : null;
  return (
    <div className="page max-w-3xl">
      <PageHeader
        title="Report a problem"
        backHref={ref ? `/trips/${encodeURIComponent(ref)}` : '/help'}
        backLabel="Back"
        className="lg:pt-6"
      />
      <div className="space-y-6">
        <Notice tone="warn" icon={Siren} title="In danger right now?">
          Call 999. Coastline does not dispatch police or rescue.{' '}
          <Link href="/help/emergency" className="font-semibold text-fg underline">
            Emergency information
          </Link>
        </Notice>
        <Notice tone="info" icon={Flag} title="Reports in the app are coming soon">
          You will be able to report a problem here and follow its status in Trips. For a booking
          issue now, tell the venue&apos;s staff and quote your reference
          {ref ? (
            <>
              {' '}
              <span className="font-mono text-fg">{ref}</span>
            </>
          ) : null}
          .
        </Notice>
        <Card className="p-5">
          <h2 className="text-title-sm">What you will be able to report</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <li
                key={category}
                className="inline-flex h-9 items-center rounded-full bg-surface-alt px-3 text-body-sm"
              >
                {category}
              </li>
            ))}
          </ul>
        </Card>
        {ref ? (
          <Link href={`/trips/${encodeURIComponent(ref)}`} className={buttonClass('secondary')}>
            Back to booking {ref}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
