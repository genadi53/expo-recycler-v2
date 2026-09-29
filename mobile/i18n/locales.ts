export const LOCALE_STORAGE_KEY = "recycler.locale.v1";

export const SUPPORTED_LOCALES = ["en-US", "en-GB", "bg"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en-US";

export type LocaleOption = {
  id: AppLocale;
  /** Stable native label shown in the picker (not translated with the UI language). */
  nativeLabel: string;
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { id: "en-US", nativeLabel: "English (US)" },
  { id: "en-GB", nativeLabel: "English (UK)" },
  { id: "bg", nativeLabel: "Български" },
];

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return Boolean(value && (SUPPORTED_LOCALES as readonly string[]).includes(value));
}

export function localeDisplayName(locale: AppLocale): string {
  return LOCALE_OPTIONS.find((option) => option.id === locale)?.nativeLabel ?? locale;
}
