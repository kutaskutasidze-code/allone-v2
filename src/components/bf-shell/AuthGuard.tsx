"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Adapted from travelplace-bf's AuthGuard. Same shape — three-state machine
// (loading / in / out), redirect on "out" — but reads the session through
// Supabase instead of next-auth. The redirect target is zone-aware:
// /admin pages bounce to /admin/login, /sales pages to /sales/login.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [state, setState] = useState<"loading" | "in" | "out">("loading");
  const supabase = createClient();

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data.user) setState("in");
        else setState("out");
      })
      .catch(() => {
        // Network blip — err toward letting the user through, matches BF.
        if (!cancelled) setState("in");
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, supabase]);

  useEffect(() => {
    if (state !== "out") return;
    const zone = pathname.startsWith("/admin") ? "admin" : "sales";
    const next = encodeURIComponent(pathname);
    router.replace(`/${zone}/login?next=${next}`);
  }, [state, pathname, router]);

  if (state !== "in") return null;
  return <>{children}</>;
}
