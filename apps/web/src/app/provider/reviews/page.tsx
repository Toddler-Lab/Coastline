import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Reviews' };

export default function Page() {
  return (
    <ComingSoon title="Reviews" body="Guest reviews with one reply each." workPackage="WP-25" />
  );
}
