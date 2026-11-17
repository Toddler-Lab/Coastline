import type { Metadata } from 'next';
import { ComingSoon } from '@/components/workspace/parts';

export const metadata: Metadata = { title: 'Calendar' };

export default function Page() {
  return (
    <ComingSoon
      title="Calendar"
      body="Block dates and slots for each listing."
      workPackage="WP-17"
    />
  );
}
