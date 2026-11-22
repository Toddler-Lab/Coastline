'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function VisitorMainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hero pages that have a full-screen hero stage at the very top (home, destination drone view, and spot hero)
  const hasHero =
    pathname === '/' ||
    /^\/d\/[^/]+$/.test(pathname) ||
    /^\/d\/[^/]+\/s\/[^/]+$/.test(pathname);

  return (
    <main
      id="main"
      className={cn(
        'min-h-[70dvh] w-full',
        hasHero ? 'pt-0' : 'pt-24 md:pt-28',
        'pb-[calc(var(--bottombar-h)+env(safe-area-inset-bottom)+24px)] lg:pb-16',
      )}
    >
      {children}
    </main>
  );
}
