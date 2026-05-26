"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/bf-shell";
import { adminNav } from "@/lib/admin-nav";
import { createClient } from "@/lib/supabase/client";

export function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const isChatNativeHome = pathname === "/admin";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
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
  );
}
