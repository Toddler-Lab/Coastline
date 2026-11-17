import { VisitorTopBar } from '@/components/patterns/visitor-top-bar';
import { BottomBar, OfflineBar } from '@/components/patterns/visitor-nav';
import { HelpButton } from '@/components/patterns/help';
import { SiteFooter } from '@/components/patterns/site-footer';

/**
 * Visitor shell: top bar on expanded screens, bottom bar on compact and medium
 * ones, and the floating Help button (design.md 5.1).
 */
export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBar />
      <VisitorTopBar />
      <main
        id="main"
        className="min-h-[60dvh] pb-[calc(var(--bottombar-h)+env(safe-area-inset-bottom)+24px)] lg:pb-16"
      >
        {children}
      </main>
      <SiteFooter />
      <BottomBar />
      <HelpButton />
    </>
  );
}
