"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/bf-shell";
import { AdminThemeContext, type AdminTheme } from "./AdminThemeContext";

const THEME_STORAGE_KEY = "allone-admin-theme";

const ADMIN_CHAT_STARTERS = [
  "Recent activity across services",
  "Open offers",
  "How many leads are unassigned?",
];

export function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  // Both /admin (overview) and /admin/cloner ARE the chat — hide the
  // shell's side-chat toggle so we don't stack two chat surfaces.
  const isChatNativeHome =
    pathname === "/admin" || pathname === "/admin/cloner";

  const [theme, setTheme] = useState<AdminTheme>("light");

  useEffect(() => {
    try {
      const stored =
        (localStorage.getItem(THEME_STORAGE_KEY) as AdminTheme | null) ?? null;
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(stored ?? (prefersDark ? "dark" : "light"));
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: AdminTheme = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  if (isLoginPage) {
    return (
      <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
      </AdminThemeContext.Provider>
    );
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <AppShell
        chatScope={{ level: "org", org: "allone-admin" }}
        chatScopeLabel="Allone Admin"
        chatStarters={ADMIN_CHAT_STARTERS}
        hideChatToggle={isChatNativeHome}
      >
        {children}
      </AppShell>
    </AdminThemeContext.Provider>
  );
}
