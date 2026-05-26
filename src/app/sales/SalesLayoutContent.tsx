"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/bf-shell";
import { salesNav } from "@/lib/sales-nav";
import { createClient } from "@/lib/supabase/client";
import { SalesThemeContext, type SalesTheme } from "./SalesThemeContext";

const THEME_STORAGE_KEY = "allone-sales-theme";

export function SalesLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sales/login");
    router.refresh();
  };

  return (
    <SalesThemeContext.Provider value={{ theme, toggleTheme }}>
      <AppShell
        brand={{ name: "Allone", sub: "Sales" }}
        nav={salesNav}
        chatScope={{ level: "org", org: "allone-sales" }}
        chatScopeLabel="Sales chat"
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
    </SalesThemeContext.Provider>
  );
}
