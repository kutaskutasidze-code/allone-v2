"use client";

import { useEffect } from "react";

// Reads `allone.locale` from localStorage on first render and applies it
// to <html> so the useLocale() hook + CSS lang selectors pick it up before
// hydration. Ported from travelplace-bf with the storage key rename.

const KEY = "allone.locale";

export function LocaleBoot() {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(KEY);
      if (stored === "en" || stored === "ka") {
        document.documentElement.dataset.locale = stored;
        document.documentElement.lang = stored;
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
