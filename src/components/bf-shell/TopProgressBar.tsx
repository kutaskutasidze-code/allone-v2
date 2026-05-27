"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Slim sliver under the topbar during route transitions. Approximates
// App-Router events (which don't exist) by listening for internal-link
// clicks and fading out when pathname/searchParams settle.

const SHOW_DELAY_MS = 150;

export function TopProgressBar() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (showTimer) clearTimeout(showTimer);
    };
  }, []);

  useEffect(() => {
    setVisible(false);
  }, [pathname, search]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[1.5px] overflow-hidden"
      style={{
        animation: "fade-in 180ms cubic-bezier(0.32, 0.72, 0, 1) both",
      }}
      aria-hidden
    >
      <div className="ao-progress-bar h-full w-full" />
    </div>
  );
}
