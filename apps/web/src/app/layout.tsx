import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, Manrope } from 'next/font/google';
import './globals.css';
import { DemoBanner } from '@/components/brand/demo-banner';
import { ToastProvider } from '@/components/ui/toast';
import { SiteHeader } from '@/components/site/site-header';
import { getDemoUsers, getViewer } from '@/lib/session';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-plex-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Coastline — Cox's Bazar sunbed map",
    template: '%s · Coastline',
  },
  description:
    "Find a free sunbed on Cox's Bazar beach, book it by the hour, and show the QR ticket at the bed. Demo: payments are simulated.",
  applicationName: 'Coastline',
  keywords: ["Cox's Bazar", 'sunbed', 'beach', 'booking', 'Kolatoli', 'Laboni'],
};

export const viewport: Viewport = {
  themeColor: '#041014',
  colorScheme: 'dark',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [viewer, users] = await Promise.all([getViewer(), getDemoUsers()]);

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link rel="preconnect" href="https://server.arcgisonline.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://server.arcgisonline.com" />
      </head>
      <body className="min-h-dvh bg-abyss text-foam antialiased">
        <a
          href="#main"
          className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-sea px-4 py-2 text-[12px] font-semibold text-abyss transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <ToastProvider>
          <DemoBanner />
          <SiteHeader user={viewer.user} users={users} currentId={viewer.userId} />
          <div id="main" className="pb-16 md:pb-0">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
