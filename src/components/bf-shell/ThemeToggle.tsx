"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "auto";

const LS_KEY = "allonce.theme";

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" ||
    (theme === "auto" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  // Apply to every .bf-shell on the page so AppShell + nested children pick it up.
  document.querySelectorAll(".bf-shell").forEach((el) => {
    el.setAttribute("data-theme", isDark ? "dark" : "light");
  });
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const stored = (localStorage.getItem(LS_KEY) as Theme | null) ?? "auto";
      setTheme(stored);
      applyTheme(stored);
    } catch {}

    // Re-apply when system preference flips (only matters in auto mode).
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      try {
        const cur = (localStorage.getItem(LS_KEY) as Theme | null) ?? "auto";
        if (cur === "auto") applyTheme("auto");
      } catch {}
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const cycle = () => {
    const next: Theme =
      theme === "auto" ? "light" : theme === "light" ? "dark" : "auto";
    setTheme(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {}
    applyTheme(next);
  };

  if (!hydrated) return null;
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${theme}. Click to cycle.`}
      title={`Theme: ${theme}`}
      className="rounded-lg p-1.5 text-[color:var(--ink-500)] hover:bg-[color:var(--bg-sunken)]"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
