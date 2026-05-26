"use client";

import { useState, useEffect, type ReactNode } from "react";
import "../../styles/bf-tokens.css";
import { AppTopbar } from "./AppTopbar";
import { AppSidebar, type NavSection } from "./AppSidebar";
import { AppChatPane, type ChatScope } from "./AppChatPane";

export interface AppShellProps {
  children: ReactNode;
  // Brand block in the topbar
  brand: { name: string; sub?: string; logoUrl?: string };
  nav: NavSection[];
  // Where the side chat is scoped (drives system prompt + memory)
  chatScope?: ChatScope;
  chatScopeLabel?: string;
  hideChatToggle?: boolean;
  // Hides the side chat completely (e.g. for forms / login)
  hideChat?: boolean;
  // Right-side content of topbar; default = notifications + account menu
  topbarRight?: ReactNode;
  breadcrumb?: ReactNode;
  // Chat endpoint; default `/api/sales/chat`
  chatApiPath?: string;
}

const LS_SIDEBAR_OPEN = "allonce.sidebar.open";
const LS_CHAT_OPEN = "allonce.chat.open";

export function AppShell({
  children,
  brand,
  nav,
  chatScope,
  chatScopeLabel,
  hideChatToggle,
  hideChat,
  topbarRight,
  breadcrumb,
  chatApiPath = "/api/sales/chat",
}: AppShellProps) {
  // Hydration-safe: start collapsed, sync to localStorage on mount.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(!hideChat);
  const [isDesktop, setIsDesktop] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const s = localStorage.getItem(LS_SIDEBAR_OPEN);
      if (s !== null) setSidebarOpen(s === "1");
      const c = localStorage.getItem(LS_CHAT_OPEN);
      if (c !== null) setChatOpen(c === "1" && !hideChat);
    } catch {
      /* localStorage might be unavailable (SSR / private mode) */
    }

    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [hideChat]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_SIDEBAR_OPEN, sidebarOpen ? "1" : "0");
    } catch {}
  }, [sidebarOpen, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_CHAT_OPEN, chatOpen ? "1" : "0");
    } catch {}
  }, [chatOpen, hydrated]);

  // Keyboard: ⌘\ toggles sidebar, ⌘/ toggles chat
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "\\") {
        e.preventDefault();
        setSidebarOpen((v) => !v);
      } else if (e.key === "/") {
        e.preventDefault();
        if (!hideChat) setChatOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hideChat]);

  const showSidebar = sidebarOpen && (isDesktop || true);
  const showChat = chatOpen && !hideChat;

  return (
    <div className="bf-shell flex flex-col">
      <AppTopbar
        brand={brand}
        breadcrumb={breadcrumb}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleChat={
          hideChatToggle || hideChat ? undefined : () => setChatOpen((v) => !v)
        }
        rightSlot={topbarRight}
      />
      <div className="flex flex-1 min-h-0">
        <AppSidebar
          nav={nav}
          open={showSidebar}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
          {children}
        </main>
        {showChat && (
          <AppChatPane
            scope={chatScope}
            scopeLabel={chatScopeLabel}
            apiPath={chatApiPath}
            onClose={() => setChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
