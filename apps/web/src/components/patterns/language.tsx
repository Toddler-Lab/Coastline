'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { applyLanguage, type Language } from '@/lib/i18n';

export interface LanguageValue {
  lang: Language;
  setLang: (lang: Language) => void;
  /** Pick the copy for the active language. */
  t: (en: string, bn: string) => string;
}

const LanguageContext = createContext<LanguageValue>({
  lang: 'en',
  setLang: () => {},
  t: (en) => en,
});

export function LanguageProvider({
  initial,
  children,
}: {
  initial: Language;
  children: React.ReactNode;
}) {
  const [lang, setState] = useState<Language>(initial);
  const setLang = useCallback((next: Language) => {
    setState(next);
    applyLanguage(next);
  }, []);
  const t = useCallback((en: string, bn: string) => (lang === 'bn' ? bn : en), [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  return useContext(LanguageContext);
}

/** Compact EN / BN toggle for the top bar. */
export function LanguageSwitch({ overMedia = false }: { overMedia?: boolean }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={
        overMedia
          ? 'inline-flex items-center rounded-full border border-white/30 bg-black/35 p-0.5 backdrop-blur-md'
          : 'inline-flex items-center rounded-full border border-line bg-surface-alt p-0.5'
      }
      role="group"
      aria-label="Language"
    >
      {(['en', 'bn'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={
            'min-h-8 rounded-full px-2.5 text-xs font-bold transition-colors ' +
            (lang === code
              ? overMedia
                ? 'bg-white text-ink'
                : 'bg-primary text-on-primary'
              : overMedia
                ? 'text-white/80 hover:text-white'
                : 'text-muted hover:text-fg')
          }
        >
          {code === 'en' ? 'EN' : 'বাংলা'}
        </button>
      ))}
    </div>
  );
}
