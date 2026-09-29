import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

import i18n from "@/i18n";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isAppLocale,
  type AppLocale,
} from "@/i18n/locales";

type LocaleContextValue = {
  ready: boolean;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();
  const [ready, setReady] = useState(false);
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
        const next = isAppLocale(stored) ? stored : DEFAULT_LOCALE;
        if (!cancelled) {
          setLocaleState(next);
          if (i18n.language !== next) {
            await i18n.changeLanguage(next);
          }
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback(
    async (next: AppLocale) => {
      setLocaleState(next);
      await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
      if (i18nInstance.language !== next) {
        await i18nInstance.changeLanguage(next);
      }
    },
    [i18nInstance],
  );

  const value = useMemo(() => ({ ready, locale, setLocale }), [ready, locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is missing.");
  return value;
}
