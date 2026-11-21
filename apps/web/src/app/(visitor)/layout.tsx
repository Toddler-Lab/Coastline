import { VisitorTopBar } from '@/components/patterns/visitor-top-bar';
import { BottomBar, OfflineBar } from '@/components/patterns/visitor-nav';
import { HelpButton } from '@/components/patterns/help';
import { SiteFooter } from '@/components/patterns/site-footer';
import { VisitorMainShell } from '@/components/patterns/visitor-main-shell';

/**
 * Visitor shell: 2026 floating glass navigation across all pages,
 * unified typography, responsive footer, and bottom bar on mobile.
 */
export default function VisitorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="drone-landing-scope min-h-screen bg-bg text-fg flex flex-col justify-between">
      <div>
        <OfflineBar />
        <VisitorTopBar />
        <VisitorMainShell>{children}</VisitorMainShell>
      </div>
      <SiteFooter />
      <BottomBar />
      <HelpButton />
    </div>
  );
}
