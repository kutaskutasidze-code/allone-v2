"use client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Lightweight account menu — sign out button. BF's version had role-aware
// switcher + org context; we don't need those in allone-website.
export function AccountMenu() {
  const router = useRouter();
  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sales/login");
    router.refresh();
  };
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={signOut}
        title="Sign out"
        aria-label="Sign out"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-700)] transition hover:bg-[var(--bg-sunken)]"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
