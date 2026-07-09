"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  KeyRound,
  Mail,
  Power,
  ExternalLink,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/admin";
import { toast } from "@/components/bf-shell/Toast";
import { useLocale } from "@/lib/i18n/useLocale";
import { LOCALES, LOCALE_LABEL, type Locale, type TranslationKey } from "@/lib/i18n/dict";

interface SubmissionRow {
  id: string;
  type: string;
  priority: string | null;
  title: string;
  body: string | null;
  page_url: string | null;
  screenshot_urls: string[] | null;
  plane_url: string | null;
  status: string;
  created_at: string;
}

interface CompanyDetail {
  id: string;
  name: string;
  slug: string;
  login_email: string;
  contact_email: string | null;
  phone: string | null;
  comms_language: Locale;
  plane_label_id: string | null;
  is_active: boolean;
  created_at: string;
  rotated_at: string | null;
}

interface Detail {
  company: CompanyDetail;
  link: string;
  password: string | null;
  submissions: SubmissionRow[];
  canDelete: boolean;
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
          className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--allone-line)] p-2 text-[var(--ink-500)] transition hover:border-[var(--allone-line-strong)] hover:text-[var(--ink-900)]"
          aria-label="Copy"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { t, locale } = useLocale();

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; run: () => Promise<void> }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/companies/${id}`);
      if (res.status === 401 || res.status === 403) {
        setNotAuthorized(true);
        return;
      }
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { data: Detail };
      setDetail(json.data);
    } catch {
      toast(t("feedback.admin.loadError"), "err");
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = useCallback(
    async (body: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
      const res = await fetch(`/api/sales/companies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        toast(t("feedback.admin.loadError"), "err");
        return null;
      }
      const json = (await res.json()) as { data: Record<string, unknown> };
      return json.data;
    },
    [id, t],
  );

  async function rotate() {
    setBusy("rotate");
    const data = await patch({ action: "rotate_link" });
    if (data && detail) {
      setDetail({ ...detail, link: String(data.link) });
      toast(t("feedback.admin.detail.saved"), "ok");
    }
    setBusy(null);
  }

  async function reset() {
    setBusy("reset");
    const data = await patch({ action: "reset_password" });
    if (data && detail) {
      setDetail({ ...detail, password: String(data.password) });
      toast(t("feedback.admin.detail.saved"), "ok");
    }
    setBusy(null);
  }

  async function resend() {
    setBusy("resend");
    const data = await patch({ action: "resend_onboarding" });
    if (data) {
      toast(data.emailSent ? t("feedback.admin.detail.saved") : String(data.reason ?? "not sent"), data.emailSent ? "ok" : "warn");
    }
    setBusy(null);
  }

  async function toggleActive() {
    if (!detail) return;
    setBusy("active");
    const data = await patch({ action: "set_active", is_active: !detail.company.is_active });
    if (data) {
      setDetail({ ...detail, company: { ...detail.company, is_active: Boolean(data.is_active) } });
      toast(t("feedback.admin.detail.saved"), "ok");
    }
    setBusy(null);
  }

  async function changeLanguage(lang: Locale) {
    if (!detail) return;
    setBusy("lang");
    const data = await patch({ action: "set_language", comms_language: lang });
    if (data) {
      setDetail({ ...detail, company: { ...detail.company, comms_language: lang } });
      toast(t("feedback.admin.detail.saved"), "ok");
    }
    setBusy(null);
  }

  async function del() {
    setBusy("delete");
    const res = await fetch(`/api/sales/companies/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/sales/companies");
      return;
    }
    setBusy(null);
    toast(t("feedback.admin.loadError"), "err");
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
  if (notFound || !detail) {
    return (
      <div className="mx-auto mt-20 w-full max-w-3xl text-center text-sm text-[var(--ink-500)]">
        {t("feedback.admin.detail.notFound")}
      </div>
    );
  }

  const c = detail.company;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <Link
          href="/sales/companies"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-500)] transition hover:text-[var(--ink-900)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("feedback.admin.detail.back")}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">{c.name}</h1>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
              c.is_active
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-[var(--allone-line)] bg-[var(--bg-sunken)] text-[var(--ink-500)]"
            }`}
          >
            {c.is_active ? t("feedback.admin.status.active") : t("feedback.admin.status.inactive")}
          </span>
        </div>
      </div>

      {/* Credentials */}
      <section className="space-y-4 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
        <CopyRow label={t("feedback.admin.detail.magicLink")} value={detail.link} />
        <CopyRow label={t("feedback.admin.detail.loginEmail")} value={c.login_email} />
        {detail.password && <CopyRow label={t("feedback.admin.detail.password")} value={detail.password} />}
        <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-3">
          <Meta label={t("feedback.admin.detail.contact")} value={c.contact_email ?? "—"} />
          <Meta label={t("feedback.admin.detail.phone")} value={c.phone ?? "—"} />
          <div>
            <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
              {t("feedback.admin.detail.language")}
            </p>
            <select
              value={c.comms_language}
              disabled={busy === "lang"}
              onChange={(e) => void changeLanguage(e.target.value as Locale)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-2 text-[13px] text-[var(--ink-900)] focus:border-[var(--ao-accent)] focus:outline-none"
            >
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABEL[l]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section>
        <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
          {t("feedback.admin.detail.actions")}
        </p>
        <div className="flex flex-wrap gap-2">
          <ActionBtn
            icon={RefreshCw}
            label={t("feedback.admin.detail.rotate")}
            busy={busy === "rotate"}
            onClick={() =>
              setConfirm({
                title: t("feedback.admin.detail.rotate"),
                message: t("feedback.admin.detail.rotateConfirm"),
                run: rotate,
              })
            }
          />
          <ActionBtn
            icon={KeyRound}
            label={t("feedback.admin.detail.reset")}
            busy={busy === "reset"}
            onClick={() =>
              setConfirm({
                title: t("feedback.admin.detail.reset"),
                message: t("feedback.admin.detail.resetConfirm"),
                run: reset,
              })
            }
          />
          <ActionBtn
            icon={Mail}
            label={t("feedback.admin.detail.resend")}
            busy={busy === "resend"}
            disabled={!c.contact_email}
            onClick={() => void resend()}
          />
          <ActionBtn
            icon={Power}
            label={c.is_active ? t("feedback.admin.detail.deactivate") : t("feedback.admin.detail.activate")}
            busy={busy === "active"}
            danger={c.is_active}
            onClick={() => {
              if (c.is_active) {
                setConfirm({
                  title: t("feedback.admin.detail.deactivate"),
                  message: t("feedback.admin.detail.deactivateConfirm"),
                  run: toggleActive,
                });
              } else {
                void toggleActive();
              }
            }}
          />
          {detail.canDelete && (
            <ActionBtn
              icon={Trash2}
              label={t("feedback.admin.detail.delete")}
              busy={busy === "delete"}
              danger
              onClick={() =>
                setConfirm({
                  title: t("feedback.admin.detail.delete"),
                  message: t("feedback.admin.detail.deleteConfirm"),
                  run: del,
                })
              }
            />
          )}
        </div>
      </section>

      {/* Submissions */}
      <section>
        <p className="mb-2 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
          {t("feedback.admin.detail.submissions")}
        </p>
        {detail.submissions.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-6 text-center text-sm text-[var(--ink-500)]">
            {t("feedback.admin.detail.noSubmissions")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--allone-line-soft)] text-left text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
                  <th className="px-4 py-3 font-medium">{t("feedback.admin.sub.title")}</th>
                  <th className="px-4 py-3 font-medium">{t("feedback.admin.sub.type")}</th>
                  <th className="px-4 py-3 font-medium">{t("feedback.admin.sub.priority")}</th>
                  <th className="px-4 py-3 font-medium">{t("feedback.admin.sub.when")}</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {detail.submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-[var(--allone-line-soft)] align-top first:border-t-0 hover:bg-[var(--bg-surface-alt)]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--ink-900)]">{s.title}</div>
                      {s.screenshot_urls && s.screenshot_urls.length > 0 && (
                        <div className="mt-1.5 flex gap-1.5">
                          {s.screenshot_urls.map((u) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <a key={u} href={u} target="_blank" rel="noreferrer">
                              <img
                                src={u}
                                alt=""
                                className="h-10 w-10 rounded border border-[var(--allone-line)] object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">{t(`feedback.type.${s.type}` as TranslationKey)}</td>
                    <td className="px-4 py-3 text-[var(--ink-700)]">
                      {t(`feedback.priority.${s.priority ?? "none"}` as TranslationKey)}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-500)]">
                      {new Date(s.created_at).toLocaleDateString(locale === "ka" ? "ka-GE" : "en-US")}
                    </td>
                    <td className="px-4 py-3">
                      {s.plane_url && (
                        <a
                          href={s.plane_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-[var(--ao-accent)] hover:underline"
                        >
                          {t("feedback.admin.detail.viewInPlane")}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const run = confirm?.run;
          setConfirm(null);
          if (run) await run();
        }}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmText={confirm?.title ?? ""}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">{label}</p>
      <p className="truncate text-[13px] text-[var(--ink-900)]">{value}</p>
    </div>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  busy,
  disabled,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-[13px] font-medium transition disabled:opacity-50 ${
        danger
          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          : "border-[var(--allone-line)] bg-[var(--bg-surface)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)] hover:text-[var(--ink-900)]"
      }`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
