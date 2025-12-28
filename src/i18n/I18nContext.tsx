/**
 * Internationalization Context
 * Manages language selection and provides translations
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import es from './locales/es.json';
import en from './locales/en.json';

type Locale = 'es' | 'en';
type Dictionary = Record<string, string>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  locales: readonly Locale[];
}

const dictionaries: Record<Locale, Dictionary> = { es, en };
const SUPPORTED_LOCALES: readonly Locale[] = ['es', 'en'] as const;
const DEFAULT_LOCALE: Locale = 'es';
const STORAGE_KEY = 'app_locale';

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Detects the user's preferred language from browser settings
 */
function detectBrowserLocale(): Locale {
  const browserLang = navigator.language || navigator.languages?.[0] || '';
  const langCode = browserLang.split('-')[0].toLowerCase();
  return SUPPORTED_LOCALES.includes(langCode as Locale) ? (langCode as Locale) : DEFAULT_LOCALE;
}

/**
 * Gets the initial locale from localStorage or browser
 */
function getInitialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LOCALES.includes(saved as Locale)) {
    return saved as Locale;
  }
  return detectBrowserLocale();
}

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale): void => {
    if (SUPPORTED_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale);
    }
  };

  const t = (key: string): string => {
    return dictionaries[locale]?.[key] || dictionaries[DEFAULT_LOCALE]?.[key] || key;
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    t,
    locales: SUPPORTED_LOCALES,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to use internationalization
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

