"use client";

import Link from "next/link";
import { Menu, MessageSquare, Bell, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface TopbarProps {
  brand: { name: string; sub?: string; logoUrl?: string };
  breadcrumb?: ReactNode;
  onToggleSidebar: () => void;
  onToggleChat?: () => void;
  rightSlot?: ReactNode;
}

export function AppTopbar({
  brand,
  breadcrumb,
  onToggleSidebar,
  onToggleChat,
  rightSlot,
}: TopbarProps) {
  return (
    <header
      className="bf-island sticky top-0 z-30 mx-3 mt-3 flex items-center gap-3 px-4 py-2"
      style={{ borderRadius: 16 }}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar (⌘\\)"
        className="rounded-lg p-1.5 text-[color:var(--ink-700)] hover:bg-[color:var(--bg-sunken)]"
      >
        <Menu className="h-4 w-4" />
      </button>

      <Link href="/sales" className="flex items-center gap-2">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logoUrl} alt="" className="h-6 w-6 rounded" />
        ) : (
          <span
            className="flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold text-white"
            style={{ background: "var(--ao-accent)" }}
          >
            {brand.name.slice(0, 1)}
          </span>
        )}
        <span className="text-sm font-semibold tracking-tight text-[color:var(--ink-900)]">
          {brand.name}
        </span>
        {brand.sub && (
          <span className="text-xs font-medium text-[color:var(--ink-500)]">
            {brand.sub}
          </span>
        )}
      </Link>

      {breadcrumb && (
        <>
          <ChevronRight className="h-3 w-3 text-[color:var(--ink-300)]" />
          <div className="text-xs text-[color:var(--ink-700)]">
            {breadcrumb}
          </div>
        </>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        {rightSlot ?? (
          <>
            <button
              type="button"
              className="rounded-lg p-1.5 text-[color:var(--ink-500)] hover:bg-[color:var(--bg-sunken)]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
          </>
        )}
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            aria-label="Toggle side chat (⌘/)"
            className="rounded-lg p-1.5 text-[color:var(--ink-700)] hover:bg-[color:var(--bg-sunken)]"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
}
