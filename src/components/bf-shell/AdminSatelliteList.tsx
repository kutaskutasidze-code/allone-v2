"use client";

/**
 * Shared list/add/delete UI for the 5 staff HR satellites
 * (education / experience / language / program / sertificat).
 *
 * Each tab page passes:
 *   - `apiBase`  — e.g. `/api/administration/123/education`
 *   - `fields`   — what columns to render in the table + the add-form
 *
 * Insert uses the same column names; null-empty strings before POST.
 */

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";

export interface FieldDef {
  /** column name on the row */
  key: string;
  /** translation key for the label */
  labelKey: string;
  /** input type for the add-form */
  type: "text" | "number" | "date" | "checkbox";
  /** column-render formatter; defaults to identity. */
  render?: (v: unknown) => string;
}

export function AdminSatelliteList({
  apiBase,
  fields,
  emptyKey,
}: {
  apiBase: string;
  fields: FieldDef[];
  /** i18n key for the empty-state message. */
  emptyKey: string;
}) {
  const { t } = useLocale();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(apiBase, { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error?.message ?? "load failed");
      setRows(j.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase]);

  function buildPayload(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const v = draft[f.key];
      if (v === undefined) continue;
      if (f.type === "number") {
        if (v === "") out[f.key] = null;
        else {
          const n = Number(v);
          out[f.key] = Number.isFinite(n) ? n : null;
        }
      } else if (f.type === "checkbox") {
        out[f.key] = Boolean(v);
      } else {
        const s = String(v).trim();
        out[f.key] = s === "" ? null : s;
      }
    }
    return out;
  }

  async function submit() {
    const r = await fetch(apiBase, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    const j = await r.json();
    if (!j.ok) {
      setError(j.error?.message ?? "create failed");
      return;
    }
    setShowAdd(false);
    setDraft({});
    await load();
  }

  async function del(id: number) {
    if (!confirm(t("staff.confirm.delete"))) return;
    const r = await fetch(`${apiBase}/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!j.ok) {
      setError(j.error?.message ?? "delete failed");
      return;
    }
    await load();
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-[var(--ink-700)]">
          {t("staff.records")}
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-[12px] text-[var(--ao-accent)] hover:underline"
        >
          {showAdd ? t("common.cancel") : t("common.add")}
        </button>
      </div>
      {error ? (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      ) : null}
      {showAdd ? (
        <div className="mb-4 grid gap-2 rounded border border-[var(--allonce-line)] p-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-[11px] text-[var(--ink-500)]">
                {t(f.labelKey as never)}
              </span>
              {f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!draft[f.key]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.checked }))
                  }
                />
              ) : (
                <input
                  type={f.type}
                  value={String(draft[f.key] ?? "")}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  className="w-full rounded border border-[var(--allonce-line)] bg-transparent px-2 py-1 text-[13px]"
                />
              )}
            </label>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={submit}
              className="rounded bg-[var(--ink-900)] px-3 py-1 text-[12px] text-white"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      ) : null}
      {loading ? (
        <p className="text-[12px] text-[var(--ink-500)]">
          {t("common.loading")}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-[12px] text-[var(--ink-500)]">
          {t(emptyKey as never)}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--allonce-line)]">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--allonce-fog)] text-left text-[12px] text-[var(--ink-700)]">
              <tr>
                {fields.map((f) => (
                  <th key={f.key} className="px-3 py-2">
                    {t(f.labelKey as never)}
                  </th>
                ))}
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={Number(row["id"])}
                  className="border-t border-[var(--allonce-line)]"
                >
                  {fields.map((f) => {
                    const v = row[f.key];
                    const cell = f.render
                      ? f.render(v)
                      : v == null || v === ""
                        ? "—"
                        : f.type === "checkbox"
                          ? v
                            ? "✓"
                            : "—"
                          : String(v);
                    return (
                      <td key={f.key} className="px-3 py-2">
                        {cell}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => del(Number(row["id"]))}
                      className="text-[12px] text-[var(--ink-400)] hover:text-red-600"
                    >
                      ×
                    </button>
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
