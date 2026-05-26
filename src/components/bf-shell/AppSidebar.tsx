"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

interface SidebarProps {
  nav: NavSection[];
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ nav, open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === pathname ||
    (href !== "/sales" && href !== "/admin" && pathname.startsWith(href));

  if (!open) return null;

  return (
    <aside
      className="bf-island mx-3 mt-3 mb-3 hidden w-60 shrink-0 flex-col gap-1 px-2 py-3 lg:flex"
      style={{ borderRadius: 16 }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close sidebar"
        className="absolute right-2 top-2 hidden text-[color:var(--ink-400)] hover:text-[color:var(--ink-900)] lg:hidden"
      >
        <X className="h-4 w-4" />
      </button>
      <nav className="flex flex-col gap-3">
        {nav.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {section.label && (
              <div className="px-2 pb-1 pt-2 text-[10px] font-mono uppercase tracking-wider text-[color:var(--ink-400)]">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition ${
                    active
                      ? "bg-[color:var(--ao-accent-soft)] text-[color:var(--ao-accent)]"
                      : "text-[color:var(--ink-700)] hover:bg-[color:var(--bg-sunken)]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "" : "text-[color:var(--ink-400)]"}`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{
                        background: active
                          ? "rgba(0,71,255,0.18)"
                          : "var(--bg-sunken)",
                        color: active ? "var(--ao-accent)" : "var(--ink-500)",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
