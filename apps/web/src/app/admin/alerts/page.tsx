import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Alerts' };

export default function Page() {
  return <ComingSoon title="Alerts" body="Spot alerts across destinations." workPackage="WP-20" />;
}
