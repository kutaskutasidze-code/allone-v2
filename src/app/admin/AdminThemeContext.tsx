'use client';

import { createContext, useContext } from 'react';

export type AdminTheme = 'light' | 'dark';

export interface AdminThemeValue {
  theme: AdminTheme;
  toggleTheme: () => void;
}

export const AdminThemeContext = createContext<AdminThemeValue | null>(null);

export function useAdminTheme(): AdminThemeValue {
  const ctx = useContext(AdminThemeContext);
  if (!ctx) {
    // Fall back to a no-op so components outside the provider don't crash.
    return { theme: 'light', toggleTheme: () => {} };
  }
  return ctx;
}
