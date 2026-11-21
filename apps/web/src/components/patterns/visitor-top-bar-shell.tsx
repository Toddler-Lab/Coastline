'use client';

import { usePathname } from 'next/navigation';

export function VisitorTopBarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/' || pathname.startsWith('/d/')) return null;
  return <>{children}</>;
}
