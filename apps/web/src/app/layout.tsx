import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Hind_Siliguri, Instrument_Serif, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/patterns/session';
import { LanguageProvider } from '@/components/patterns/language';
import { ToastProvider } from '@/components/ui/toast';
import { LANG_COOKIE, parseLanguage } from '@/lib/i18n';
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

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
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
  const lang = parseLanguage(store.get(LANG_COOKIE)?.value);
  const [viewer, accounts] = await Promise.all([getViewer(), getDemoUsers()]);

  return (
    <html
      lang={lang}
      data-theme={theme === 'system' ? undefined : theme}
      className={`${inter.variable} ${hind.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed left-4 top-4 z-[400] -translate-y-24 rounded-md bg-primary px-4 py-3 text-label text-on-primary focus:translate-y-0"
        >
          Skip to content
        </a>
        <LanguageProvider initial={lang}>
          <SessionProvider value={{ user: viewer.user, userId: viewer.userId, accounts }}>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
