"use client";

import { createContext, useContext, useState } from "react";
import {
  translate,
  LOCALES,
  LOCALE_LABEL,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n/dict";

interface FeedbackLocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: TranslationKey, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<FeedbackLocaleCtx | null>(null);

export function useFeedbackLocale(): FeedbackLocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFeedbackLocale must be used within FeedbackShell");
  return ctx;
}

// Client shell for the whole /feedback area: holds the active locale (seeded
// server-side from the fb_locale cookie → the company's language), renders the
// header with the language toggle + sign-out, and shares locale via context.
export default function FeedbackShell({
  initialLocale,
  authed,
  children,
}: {
  initialLocale: Locale;
  authed: boolean;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(l: Locale) {
    setLocaleState(l);
    document.cookie = `fb_locale=${l}; path=/; max-age=31536000; samesite=lax`;
  }

  const t = (k: TranslationKey, vars?: Record<string, string | number>) => translate(locale, k, vars);

  return (
    <Ctx.Provider value={{ locale, setLocale, t }}>
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-body">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight">AllOne</span>
              <span className="text-[13px] text-neutral-400">Feedback</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {LOCALES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={`rounded-full px-2.5 py-1 text-[12px] transition ${
                      locale === l ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {LOCALE_LABEL[l]}
                  </button>
                ))}
              </div>
              {authed && (
                <a
                  href="/feedback/logout"
                  className="text-[12px] text-neutral-400 transition hover:text-neutral-900"
                >
                  {t("feedback.portal.submit.logout")}
                </a>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-5 py-10">{children}</main>
      </div>
    </Ctx.Provider>
  );
}
