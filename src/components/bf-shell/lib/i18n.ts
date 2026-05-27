// Minimal i18n stub so BF components that call useLocale().t(key) work without
// porting the BF translation dictionary. Returns the key itself; UI falls
// back to its raw English label.

export type TranslationKey = string;

export function useLocale(): { t: (key: TranslationKey) => string } {
  return {
    t: (key: TranslationKey) => key,
  };
}
