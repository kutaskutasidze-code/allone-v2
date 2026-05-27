"use client";

/**
 * Shared start-balance UI used inside every vertical's "Start balance" tab.
 *
 * Renders:
 *   - a table of period-opening balances (newest first)
 *   - an inline "add" form (date + amount + optional note)
 *   - row-level delete (× button)
 *
 * Org-scoping is handled by the API layer; this component only needs
 * `apiBase` (e.g. `/api/hotels/123`) and POSTs / DELETEs against
 * `<apiBase>/start-balances`.
 */

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";

interface Row {
  id: number;
  period_start: string;
  opening_balance: number | string;
  note: string | null;
  currency_id: number | null;
  currency?: { code?: string | null; symbol?: string | null } | null;
  created_at: string;
}

export function StartBalancePanel({ apiBase }: { apiBase: string }) {
  const { t } = useLocale();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${apiBase}/start-balances`, { cache: "no-store" });
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

  async function submit() {
    if (!periodStart) {
      setError(t("startBalance.errors.periodRequired"));
      return;
    }
    const amount = Number(openingBalance);
    if (!Number.isFinite(amount)) {
      setError(t("startBalance.errors.amountInvalid"));
      return;
    }
    const r = await fetch(`${apiBase}/start-balances`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        period_start: periodStart,
        opening_balance: amount,
        note: note.trim() === "" ? null : note.trim(),
      }),
    });
    const j = await r.json();
    if (!j.ok) {
      setError(j.error?.message ?? "create failed");
      return;
    }
    setShowAdd(false);
    setPeriodStart("");
    setOpeningBalance("");
    setNote("");
    await load();
  }

  async function del(id: number) {
    if (!confirm(t("startBalance.confirm.delete"))) return;
    const r = await fetch(`${apiBase}/start-balances/${id}`, {
      method: "DELETE",
    });
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
          {t("startBalance.title")}
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-[12px] text-[var(--ao-accent)] hover:underline"
        >
          {showAdd ? t("common.cancel") : t("startBalance.add")}
        </button>
      </div>
      <p className="mb-3 text-[12px] text-[var(--ink-500)]">
        {t("startBalance.intro")}
      </p>
      {error ? (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      ) : null}
      {showAdd ? (
        <div className="mb-4 grid gap-2 rounded border border-[var(--allonce-line)] p-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] text-[var(--ink-500)]">
              {t("startBalance.col.period")}
            </span>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded border border-[var(--allonce-line)] bg-transparent px-2 py-1 text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-[var(--ink-500)]">
              {t("startBalance.col.amount")}
            </span>
            <input
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full rounded border border-[var(--allonce-line)] bg-transparent px-2 py-1 text-[13px]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-[var(--ink-500)]">
              {t("startBalance.col.note")}
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded border border-[var(--allonce-line)] bg-transparent px-2 py-1 text-[13px]"
            />
          </label>
          <div className="sm:col-span-3">
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
          {t("startBalance.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--allonce-line)]">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--allonce-fog)] text-left text-[12px] text-[var(--ink-700)]">
              <tr>
                <th className="px-3 py-2">{t("startBalance.col.period")}</th>
                <th className="px-3 py-2 text-right">
                  {t("startBalance.col.amount")}
                </th>
                <th className="px-3 py-2">{t("startBalance.col.note")}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-[var(--allonce-line)]"
                >
                  <td className="px-3 py-2">{r.period_start}</td>
                  <td className="px-3 py-2 text-right">
                    {Number(r.opening_balance).toFixed(2)}{" "}
                    {r.currency?.code ?? ""}
                  </td>
                  <td className="px-3 py-2 text-[var(--ink-700)]">
                    {r.note ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => del(r.id)}
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
