"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "./Toast";

// Adapted verbatim from travelplace-bf's AccountMenu. Two swaps:
//   1. Session source: Supabase auth here vs next-auth in BF
//   2. Sign-out path: /sales/login or /admin/login depending on active zone

function deriveInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "").trim();
  if (!source) return "·";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  const head = parts[0] ?? "";
  return head.slice(0, 2).toUpperCase() || "·";
}

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AccountMenu() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const zone = pathname.startsWith("/admin") ? "admin" : "sales";

  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setUser({
        name: (data.user.user_metadata?.name as string | undefined) ?? null,
        email: data.user.email ?? null,
        image:
          (data.user.user_metadata?.avatar_url as string | undefined) ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Account";
  const displayEmail = user?.email ?? "";
  const initials = deriveInitials(user?.name, user?.email);

  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false);
    try {
      localStorage.removeItem("allone.authenticated");
    } catch {}
    toast("Signed out", "ok");
    await supabase.auth.signOut();
    router.push(`/${zone}/login`);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="ml-1 inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-sunken)] text-[11px] font-semibold text-[var(--ink-900)] shadow-[var(--shadow-sm)] transition hover:scale-105"
      >
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="leading-none"
            style={{ transform: "translateY(0.5px)" }}
          >
            {user ? initials : ""}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[260px] overflow-hidden rounded-[var(--radius-lg)] border border-black/8 bg-[var(--bg-surface)] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.18),0_4px_12px_-2px_rgba(0,0,0,0.08)] ring-1 ring-black/5 animate-fade-in"
        >
          <div className="border-b border-[var(--allone-line-soft)] px-4 py-3">
            <p className="text-[13.5px] font-semibold text-[var(--ink-900)]">
              {displayName}
            </p>
            {displayEmail && (
              <p className="mt-0.5 truncate text-[12px] text-[var(--ink-500)]">
                {displayEmail}
              </p>
            )}
          </div>

          <div className="py-1.5">
            <MenuItem
              href={`/${zone}`}
              onClick={() => setOpen(false)}
              label={zone === "admin" ? "Admin home" : "Sales home"}
            />
            <MenuItem
              href={`/${zone}/dashboard`}
              onClick={() => setOpen(false)}
              label="Dashboard"
            />
            {zone === "sales" && (
              <MenuItem
                href="/sales/notifications"
                onClick={() => setOpen(false)}
                label="Notifications"
              />
            )}
          </div>

          <div className="border-t border-[var(--allone-line-soft)] py-1.5">
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full px-4 py-2 text-left text-[13px] text-[var(--ink-500)] transition hover:bg-[var(--bg-surface-alt)] hover:text-[var(--allone-err)]"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  onClick,
  label,
}: {
  href: string;
  onClick: () => void;
  label: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-[13px] text-[var(--ink-900)] transition hover:bg-[var(--bg-surface-alt)]"
    >
      {label}
    </Link>
  );
}
