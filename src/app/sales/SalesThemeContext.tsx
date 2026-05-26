'use client';

import { createContext, useContext } from 'react';

export type SalesTheme = 'light' | 'dark';

export interface SalesThemeValue {
  theme: SalesTheme;
  toggleTheme: () => void;
}

export const SalesThemeContext = createContext<SalesThemeValue | null>(null);

export function useSalesTheme(): SalesThemeValue {
  const ctx = useContext(SalesThemeContext);
  if (!ctx) {
    return { theme: 'light', toggleTheme: () => {} };
  }
  return ctx;
}
