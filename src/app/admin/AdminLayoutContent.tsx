"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/bf-shell";
import { adminNav } from "@/lib/admin-nav";
import { createClient } from "@/lib/supabase/client";
import { AdminThemeContext, type AdminTheme } from "./AdminThemeContext";

const THEME_STORAGE_KEY = "allone-admin-theme";

export function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const isChatNativeHome = pathname === "/admin";

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <AppShell
        brand={{ name: "Allone", sub: "Admin" }}
        nav={adminNav}
        chatScope={{ level: "org", org: "allone-admin" }}
        chatScopeLabel="Admin chat"
        chatApiPath="/api/sales/chat"
        hideChat={isChatNativeHome}
        hideChatToggle={isChatNativeHome}
        topbarRight={
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="rounded-lg p-1.5 text-[color:var(--ink-500)] hover:bg-[color:var(--bg-sunken)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        }
      >
        {children}
      </AppShell>
    </AdminThemeContext.Provider>
  );
}
