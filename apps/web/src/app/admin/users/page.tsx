import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/staff-page-shell';

export const metadata: Metadata = { title: 'Users' };

export default function Page() {
  return (
    <ComingSoon title="Users" body="Accounts, roles and desk assignments." workPackage="WP-18" />
  );
}
