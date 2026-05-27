"use client";

// Minimal i18n shim. Same API as travelplace-bf's useLocale so ported
// components compile and behave: `t(key)` returns either the dictionary
// value or the raw key (so screens still render readable English even
// before we populate the catalogs). `locale` / `setLocale` persists to
// localStorage and dispatches a window event so other consumers can
// re-render.

import { useEffect, useState } from "react";

export type TranslationKey = string;
export type Locale = "en" | "ka";

export const LOCALES: Locale[] = ["en", "ka"];
export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  ka: "ქართული",
};

const STORAGE_KEY = "allone.locale";
const EVENT = "allone.localeChange";

function readSaved(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "ka" ? "ka" : "en";
  } catch {
    return "en";
  }
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(readSaved());
    function onChange(e: Event) {
      const ce = e as CustomEvent<{ locale: Locale }>;
      if (ce.detail?.locale) setLocaleState(ce.detail.locale);
    }
    window.addEventListener(EVENT, onChange as EventListener);
    return () => window.removeEventListener(EVENT, onChange as EventListener);
  }, []);

  const setLocale = (next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setLocaleState(next);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { locale: next } }));
  };

  // No translation dictionary in this repo (yet) — return the key, which is
  // the same fallback travelplace-bf falls back to when a key is missing.
  const t = (key: TranslationKey) => key;

  return { locale, setLocale, t };
}
