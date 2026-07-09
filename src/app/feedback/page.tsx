"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { translate, LOCALES, LOCALE_LABEL, type Locale, type TranslationKey } from "@/lib/i18n/dict";

interface ErrState {
  key: TranslationKey;
  vars?: Record<string, string | number>;
}

export default function FeedbackLoginPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("ka");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<ErrState | null>(null);

  const t = (k: TranslationKey, vars?: Record<string, string | number>) => translate(locale, k, vars);

  // Read any ?error= code from the magic-link redirect (avoids useSearchParams Suspense).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code === "badlink") setErr({ key: "feedback.portal.login.errorBadlink" });
    else if (code === "inactive") setErr({ key: "feedback.portal.login.errorInactive" });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErr({ key: "feedback.portal.login.errorMissing" });
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/feedback/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push("/feedback/submit");
        router.refresh();
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string; min?: number };
      if (j.error === "locked") setErr({ key: "feedback.portal.login.errorLocked", vars: { min: j.min ?? 15 } });
      else if (j.error === "missing") setErr({ key: "feedback.portal.login.errorMissing" });
      else setErr({ key: "feedback.portal.login.errorInvalid" });
    } catch {
      setErr({ key: "feedback.portal.login.errorInvalid" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-6 flex justify-end gap-1">
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

      <h1 className="text-lg font-semibold text-neutral-900">{t("feedback.portal.login.title")}</h1>
      <p className="mb-6 mt-1 text-[13px] text-neutral-500">{t("feedback.portal.login.subtitle")}</p>

      {err && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
          {t(err.key, err.vars)}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
            {t("feedback.portal.login.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
            {t("feedback.portal.login.password")}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? t("feedback.portal.login.working") : t("feedback.portal.login.submit")}
        </button>
      </form>

      <p className="mt-6 text-[12px] leading-relaxed text-neutral-400">{t("feedback.portal.login.hint")}</p>
    </div>
  );
}
