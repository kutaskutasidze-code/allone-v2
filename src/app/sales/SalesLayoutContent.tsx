"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/bf-shell";
import { SalesThemeContext, type SalesTheme } from "./SalesThemeContext";

const THEME_STORAGE_KEY = "allone-sales-theme";

const SALES_CHAT_STARTERS = [
  "What's my aim today?",
  "Show me my qualified leads",
  "Demos awaiting review",
];

export function SalesLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/sales/login";
  const isChatNativeHome = pathname === "/sales";

  const [theme, setTheme] = useState<SalesTheme>("light");

  useEffect(() => {
    try {
      const stored =
        (localStorage.getItem(THEME_STORAGE_KEY) as SalesTheme | null) ?? null;
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(stored ?? (prefersDark ? "dark" : "light"));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: SalesTheme = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  if (isLoginPage) {
    return (
      <SalesThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </SalesThemeContext.Provider>
    );
  }

  return (
    <SalesThemeContext.Provider value={{ theme, toggleTheme }}>
      <AppShell
        chatScope={{ level: "org", org: "allone-sales" }}
        chatScopeLabel="Allone Sales"
        chatStarters={SALES_CHAT_STARTERS}
        hideChatToggle={isChatNativeHome}
      >
        {children}
      </AppShell>
    </SalesThemeContext.Provider>
  );
}
