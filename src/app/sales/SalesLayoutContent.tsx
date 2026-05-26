"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/bf-shell";
import { salesNav } from "@/lib/sales-nav";
import { createClient } from "@/lib/supabase/client";

export function SalesLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/sales/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sales/login");
    router.refresh();
  };

  return (
    <AppShell
      brand={{ name: "Allone", sub: "Sales" }}
      nav={salesNav}
      chatScope={{ level: "org", org: "allone-sales" }}
      chatScopeLabel="Sales chat"
      chatApiPath="/api/sales/chat"
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
