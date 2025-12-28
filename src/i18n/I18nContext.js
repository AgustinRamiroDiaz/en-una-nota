/**
 * Internationalization Context
 * Manages language selection and provides translations
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import es from './locales/es.json';
import en from './locales/en.json';

const dictionaries = { es, en };
const SUPPORTED_LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';
const STORAGE_KEY = 'app_locale';

const I18nContext = createContext(null);

/**
 * Detects the user's preferred language from browser settings
 */
function detectBrowserLocale() {
  const browserLang = navigator.language || navigator.languages?.[0] || '';
  const langCode = browserLang.split('-')[0].toLowerCase();
  return SUPPORTED_LOCALES.includes(langCode) ? langCode : DEFAULT_LOCALE;
}

/**
 * Gets the initial locale from localStorage or browser
 */
function getInitialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved;
  }
  return detectBrowserLocale();
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale) => {
    if (SUPPORTED_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale);
    }
  };

  const t = (key) => {
    return dictionaries[locale]?.[key] || dictionaries[DEFAULT_LOCALE]?.[key] || key;
  };

  const value = {
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
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

