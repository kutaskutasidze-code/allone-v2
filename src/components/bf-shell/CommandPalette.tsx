"use client";

// Ported from travelplace-bf's CommandPalette. Adapted:
//   - Routes mapped from /app/* to /sales/* and /admin/* (we detect the
//     active zone from the pathname).
//   - signOut() uses Supabase instead of next-auth.
//   - Event name changed from "allonce.openPalette" to "allone.openPalette"
//     to match the rest of the renamed event bus.

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Item {
  id: string;
  label: string;
  hint: string;
  group: string;
  href?: string;
  action?: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const zone = pathname.startsWith("/admin") ? "admin" : "sales";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: Item[] = useMemo(() => {
    const supabase = createClient();
    const z = zone;
    const list: Item[] = [
      {
        id: "go-home",
        label: z === "admin" ? "Admin home" : "Sales home",
        hint: "Chat-native entry",
        group: "Navigate",
        href: `/${z}`,
      },
      {
        id: "go-dashboard",
        label: "Dashboard",
        hint: "Pipeline overview",
        group: "Navigate",
        href: `/${z}/dashboard`,
      },
    ];
    if (z === "sales") {
      list.push(
        {
          id: "go-leads",
          label: "Leads",
          hint: "Your queue",
          group: "Navigate",
          href: "/sales/leads",
        },
        {
          id: "go-demos",
          label: "Demos",
          hint: "Personalized demo jobs",
          group: "Navigate",
          href: "/sales/demos",
        },
        {
          id: "go-references",
          label: "Reference library",
          hint: "Demo templates",
          group: "Navigate",
          href: "/sales/demos/references",
        },
        {
          id: "go-notifications",
          label: "Notifications",
          hint: "Aim alerts + Telegram sends",
          group: "Navigate",
          href: "/sales/notifications",
        },
      );
    } else {
      list.push(
        {
          id: "go-admin-leads",
          label: "All leads",
          hint: "Across reps",
          group: "Navigate",
          href: "/admin/leads",
        },
        {
          id: "go-admin-assign",
          label: "Assign leads",
          hint: "Distribute to reps",
          group: "Navigate",
          href: "/admin/leads/assign",
        },
        {
          id: "go-admin-team",
          label: "Team",
          hint: "Sales user roster",
          group: "Navigate",
          href: "/admin/team",
        },
      );
    }
    list.push({
      id: "action-signout",
      label: "Sign out",
      hint: "End this session",
      group: "Actions",
      action: () => {
        void supabase.auth.signOut().then(() => {
          router.push(`/${z}/login`);
          router.refresh();
        });
      },
    });
    return list;
  }, [zone, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 14);
    return items
      .filter((it) => (it.label + " " + it.hint).toLowerCase().includes(q))
      .slice(0, 50);
  }, [items, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (open) {
        if (e.key === "Escape") {
          setOpen(false);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelected((s) => Math.min(filtered.length - 1, s + 1));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelected((s) => Math.max(0, s - 1));
        } else if (e.key === "Enter") {
          e.preventDefault();
          const it = filtered[selected];
          if (it) execute(it);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, selected]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    setSelected(0);
    setQuery("");
  }, [open]);

  function execute(it: Item) {
    setOpen(false);
    if (it.href) router.push(it.href);
    else if (it.action) it.action();
  }

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("allone.openPalette", onOpen);
    return () => window.removeEventListener("allone.openPalette", onOpen);
  }, []);

  if (!open) return null;

  const grouped: Record<string, Item[]> = {};
  for (const it of filtered) {
    if (!grouped[it.group]) grouped[it.group] = [];
    grouped[it.group]!.push(it);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/30 px-4 pt-[12vh] animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-[640px] overflow-hidden rounded-[var(--radius-xl)] bg-white border border-[var(--allone-line)] shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--allone-line-soft)] px-5 py-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="text-[var(--ink-400)]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search navigation, actions…"
            className="flex-1 bg-transparent text-[15px] text-[var(--ink-900)] placeholder:text-[var(--ink-400)] outline-none"
          />
          <kbd className="rounded border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-400)]">
            esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[var(--ink-500)]">
              No matches for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([group, list]) => (
              <div key={group} className="pb-1">
                <div className="px-5 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--ink-400)]">
                  {group}
                </div>
                {list.map((it) => {
                  const fIdx = filtered.indexOf(it);
                  const active = fIdx === selected;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onMouseEnter={() => setSelected(fIdx)}
                      onClick={() => execute(it)}
                      className={`flex w-full items-center gap-3 px-5 py-2.5 text-left transition ${
                        active ? "bg-[var(--bg-sunken)]" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-[var(--ink-900)]">
                          {it.label}
                        </p>
                        {it.hint && (
                          <p className="mt-0.5 truncate text-[12px] text-[var(--ink-500)]">
                            {it.hint}
                          </p>
                        )}
                      </div>
                      {active && (
                        <kbd className="rounded bg-[var(--ink-900)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-white">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--allone-line-soft)] bg-[var(--bg-surface-alt)] px-5 py-2 text-[11px] text-[var(--ink-500)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              open
            </span>
          </div>
          <span>{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
}
