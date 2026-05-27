"use client";
import { useEffect } from "react";

// Applies saved theme pre-paint (data-theme on documentElement) so the
// initial render matches what ThemeToggle persists to allone.prefs.
const KEY = "allone.prefs";
export function PreferencesBoot() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { theme?: string };
      if (p.theme === "dark") document.documentElement.dataset.theme = "dark";
      else if (p.theme === "light")
        document.documentElement.dataset.theme = "light";
    } catch {}
  }, []);
  return null;
}
