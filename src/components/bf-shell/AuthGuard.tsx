"use client";
import type { ReactNode } from "react";
// Stub — allone-website handles auth at the page/layout level. BF's AuthGuard
// adds a session-check redirect; we no-op since we already redirect in pages.
export function AuthGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
