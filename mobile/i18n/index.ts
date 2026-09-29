import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import bg from "@/i18n/resources/bg.json";
import enGB from "@/i18n/resources/en-GB.json";
import enUS from "@/i18n/resources/en-US.json";

void i18n.use(initReactI18next).init({
  resources: {
    "en-US": { translation: enUS },
    "en-GB": { translation: enGB },
    bg: { translation: bg },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
