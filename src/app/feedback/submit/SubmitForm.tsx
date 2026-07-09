"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/dict";
import { useFeedbackLocale } from "../FeedbackShell";
import ScreenshotField from "@/components/feedback/ScreenshotField";

const TYPES = ["bug", "feature", "feedback"] as const;
const PRIORITIES = ["urgent", "high", "medium", "low", "none"] as const;

export default function SubmitForm({ companyName }: { companyName: string }) {
  const { t, locale } = useFeedbackLocale();

  const [type, setType] = useState<string>("feedback");
  const [priority, setPriority] = useState<string>("medium");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !details.trim()) {
      setError(t("feedback.portal.submit.errorMissing"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("type", type);
      fd.set("priority", priority);
      fd.set("title", title);
      fd.set("details", details);
      fd.set("page_url", pageUrl);
      files.slice(0, 3).forEach((f) => fd.append("screenshots", f));
      const res = await fetch("/api/feedback/submit", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError(t("feedback.portal.submit.errorFailed"));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSent(false);
    setType("feedback");
    setPriority("medium");
    setTitle("");
    setDetails("");
    setPageUrl("");
    setFiles([]);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <p className="text-sm text-neutral-700">{t("feedback.portal.submit.success")}</p>
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          {t("feedback.portal.submit.another")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-[28px]">
          {t("feedback.portal.submit.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-neutral-500">
          {t("feedback.portal.submit.subtitle")}
        </p>
        <p className="mt-3 text-[13px] text-neutral-400">
          {t("feedback.portal.submit.greeting", { name: companyName })}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
              {t("feedback.portal.submit.type")}
            </label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPES.map((x) => (
                <option key={x} value={x}>
                  {t(`feedback.type.${x}` as TranslationKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
              {t("feedback.portal.submit.priority")}
            </label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              {PRIORITIES.map((x) => (
                <option key={x} value={x}>
                  {t(`feedback.priority.${x}` as TranslationKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
            {t("feedback.portal.submit.titleField")}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("feedback.portal.submit.titlePlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
            {t("feedback.portal.submit.details")}
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={5}
            placeholder={t("feedback.portal.submit.detailsPlaceholder")}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
            {t("feedback.portal.submit.pageUrl")}
          </label>
          <input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-neutral-600">
            {t("feedback.portal.submit.screenshots")}
          </label>
          <ScreenshotField files={files} onChange={setFiles} locale={locale} />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {busy ? t("feedback.portal.submit.sending") : t("feedback.portal.submit.send")}
        </button>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none";
