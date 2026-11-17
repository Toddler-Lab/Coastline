import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Hind_Siliguri, Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/patterns/session';
import { ToastProvider } from '@/components/ui/toast';
import { getDemoUsers, getViewer } from '@/lib/session';
import { THEME_COOKIE, parseTheme } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Coastline · Book stays, food and sunbeds in Bangladesh',
    template: '%s · Coastline',
  },
  description:
    'Pick a destination and a spot, then find and book what is there: stays, food, sunbeds and more, with help on the spot.',
  applicationName: 'Coastline',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1415' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const theme = parseTheme(store.get(THEME_COOKIE)?.value);
  const [viewer, accounts] = await Promise.all([getViewer(), getDemoUsers()]);

  return (
    <html
      lang="en"
      data-theme={theme === 'system' ? undefined : theme}
      className={`${inter.variable} ${hind.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed left-4 top-4 z-[400] -translate-y-24 rounded-md bg-primary px-4 py-3 text-label text-on-primary focus:translate-y-0"
        >
          Skip to content
        </a>
        <SessionProvider value={{ user: viewer.user, userId: viewer.userId, accounts }}>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
