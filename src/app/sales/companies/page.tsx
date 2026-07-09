"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, X, Loader2, Copy, Check, ShieldAlert, Mail } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/admin";
import { useLocale } from "@/lib/i18n/useLocale";
import { LOCALES, LOCALE_LABEL, type Locale } from "@/lib/i18n/dict";

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  login_email: string;
  contact_email: string | null;
  comms_language: Locale;
  is_active: boolean;
  created_at: string;
}

interface CreatedInfo {
  portalUrl: string;
  loginEmail: string;
  password: string;
  emailSent: boolean;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-sunken)] px-3 py-2 text-[13px] text-[var(--ink-900)]">
          {value}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--allone-line)] p-2 text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:border-[var(--allone-line-strong)] transition"
          aria-label="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const { t, locale } = useLocale();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ name: string; contact_email: string; phone: string; comms_language: Locale }>({
    name: "",
    contact_email: "",
    phone: "",
    comms_language: "ka",
  });
  const [created, setCreated] = useState<CreatedInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sales/companies");
      if (res.status === 401 || res.status === 403) {
        setNotAuthorized(true);
        setRows([]);
        return;
      }
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data?: CompanyRow[] };
      setRows(json.data ?? []);
    } catch {
      setError(t("feedback.admin.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t("feedback.admin.create.nameRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sales/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data: CreatedInfo };
      setShowAdd(false);
      setForm({ name: "", contact_email: "", phone: "", comms_language: "ka" });
      setCreated(json.data);
      void load();
    } catch {
      setError(t("feedback.admin.create.error"));
    } finally {
      setSaving(false);
    }
  }

  if (notAuthorized) {
    return (
      <div className="mx-auto mt-20 flex w-full max-w-3xl flex-col items-center gap-3 text-center text-[var(--ink-500)]">
        <ShieldAlert className="h-8 w-8" />
        <p className="text-sm">You do not have access to this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--allone-line)] border-t-[var(--ink-900)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <PageHeader
        title={t("feedback.admin.title")}
        description={t("feedback.admin.count", { n: rows.length })}
        action={{ label: t("feedback.admin.add"), onClick: () => setShowAdd(true) }}
      />

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowAdd(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 mx-4 w-full max-w-md rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-6 shadow-xl shadow-black/[0.08]"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--ink-900)]">{t("feedback.admin.create.title")}</h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="text-[var(--ink-400)] transition-colors hover:text-[var(--ink-900)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="space-y-4">
                <Field label={t("feedback.admin.create.name")}>
                  <input
                    value={form.name}
                    required
                    autoFocus
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label={t("feedback.admin.create.contactEmail")}>
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label={t("feedback.admin.create.phone")}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label={t("feedback.admin.create.language")} hint={t("feedback.admin.create.languageHint")}>
                  <select
                    value={form.comms_language}
                    onChange={(e) => setForm({ ...form, comms_language: e.target.value as Locale })}
                    className={inputCls}
                  >
                    {LOCALES.map((l) => (
                      <option key={l} value={l}>
                        {LOCALE_LABEL[l]}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 text-sm text-[var(--ink-700)] transition-colors hover:text-[var(--ink-900)]"
                  >
                    {t("feedback.admin.create.cancel")}
                  </button>
                  <button type="submit" disabled={saving} className={primaryBtn}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? t("feedback.admin.create.saving") : t("feedback.admin.create.submit")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post-create credentials */}
      <AnimatePresence>
        {created && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setCreated(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 mx-4 w-full max-w-lg rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-6 shadow-xl shadow-black/[0.08]"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--ink-900)]">{t("feedback.admin.add")}</h2>
                <button
                  onClick={() => setCreated(null)}
                  className="text-[var(--ink-400)] transition-colors hover:text-[var(--ink-900)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <CopyRow label={t("feedback.admin.detail.magicLink")} value={created.portalUrl} />
                <CopyRow label={t("feedback.admin.detail.loginEmail")} value={created.loginEmail} />
                <CopyRow label={t("feedback.admin.detail.password")} value={created.password} />
                <p className="flex items-center gap-2 text-[13px] text-[var(--ink-500)]">
                  <Mail className="h-4 w-4" />
                  {created.emailSent
                    ? t("feedback.admin.detail.saved")
                    : t("feedback.admin.detail.resend")}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* List */}
      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("feedback.admin.empty.title")}
          description={t("feedback.admin.empty.desc")}
          action={{ label: t("feedback.admin.add"), onClick: () => setShowAdd(true) }}
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--allone-line-soft)] text-left text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
                <th className="px-4 py-3 font-medium">{t("feedback.admin.col.name")}</th>
                <th className="px-4 py-3 font-medium">{t("feedback.admin.col.login")}</th>
                <th className="px-4 py-3 font-medium">{t("feedback.admin.col.language")}</th>
                <th className="px-4 py-3 font-medium">{t("feedback.admin.col.status")}</th>
                <th className="px-4 py-3 font-medium">{t("feedback.admin.col.created")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[var(--allone-line-soft)] first:border-t-0 hover:bg-[var(--bg-surface-alt)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--ink-900)]">
                    <Link href={`/sales/companies/${c.id}`} className="hover:text-[var(--ao-accent)]">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{c.login_email}</td>
                  <td className="px-4 py-3 text-[var(--ink-700)]">{LOCALE_LABEL[c.comms_language]}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        c.is_active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[var(--allone-line)] bg-[var(--bg-sunken)] text-[var(--ink-500)]"
                      }`}
                    >
                      {c.is_active ? t("feedback.admin.status.active") : t("feedback.admin.status.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--ink-500)]">
                    {new Date(c.created_at).toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ao-accent)] focus:outline-none";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[var(--ink-800)] active:scale-[0.98] disabled:opacity-50";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[var(--ink-700)]">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[var(--ink-400)]">{hint}</p>}
    </div>
  );
}
