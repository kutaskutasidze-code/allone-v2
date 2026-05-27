"use client";

/**
 * Shared price-list UI for verticals that carry priced variants.
 *
 * Used by:
 *   - app/app/insurance/[id]/price-list/page.tsx   → kind="ensure"
 *   - app/app/transfers/[id]/price-list/page.tsx   → kind="transfer"
 *
 * Renders a list of price grids on the left + a panel on the right showing
 * the selected grid's price lines. Both create + delete actions hit the
 * `/api/<vertical>/[id]/grids[/...] ` endpoints introduced in Sprint C.
 *
 * Mirrors the visual shape of the legacy hotel `prices` tab but adds the
 * grid-list pivot, since insurance / transfer products typically carry
 * multiple overlapping price grids (seasonal + promotional).
 */

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/useLocale";

type Kind = "ensure" | "transfer";

interface Grid {
  id: number;
  name: string;
  valid_from: string | null;
  valid_until: string | null;
  notes: string | null;
  is_active: boolean | null;
  currency?: { code?: string | null; symbol?: string | null } | null;
  direction?: { name?: string | null } | null;
}

interface LineRow {
  id: number;
  price: number | null;
  sort_order: number | null;
  is_active: boolean | null;
  // ensure-only
  days?: number | null;
  age_from?: number | null;
  age_to?: number | null;
  coverage_amount?: number | null;
  ensure_type?: { name?: string | null } | null;
  // transfer-only
  passengers_from?: number | null;
  passengers_to?: number | null;
  distance_km_from?: number | null;
  distance_km_to?: number | null;
  transfer_type?: { name?: string | null } | null;
  currency?: { code?: string | null; symbol?: string | null } | null;
}

export function VerticalPriceList({
  kind,
  entityId,
  apiBase,
}: {
  kind: Kind;
  entityId: string | number;
  /** e.g. `/api/insurance/123` or `/api/transfer/123` */
  apiBase: string;
}) {
  const { t } = useLocale();
  const [grids, setGrids] = useState<Grid[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lines, setLines] = useState<LineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingGrid, setCreatingGrid] = useState(false);
  const [newGridName, setNewGridName] = useState("");

  async function loadGrids() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${apiBase}/grids`, { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error?.message ?? "load failed");
      setGrids(j.data ?? []);
      if (!selectedId && j.data && j.data.length > 0) {
        setSelectedId(j.data[0].id);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadLines(gridId: number) {
    try {
      const r = await fetch(`${apiBase}/grids/${gridId}/lines`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error?.message ?? "load failed");
      setLines(j.data ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    void loadGrids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  useEffect(() => {
    if (selectedId != null) void loadLines(selectedId);
    else setLines([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function createGrid() {
    if (!newGridName.trim()) return;
    const r = await fetch(`${apiBase}/grids`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newGridName.trim() }),
    });
    const j = await r.json();
    if (!j.ok) {
      setError(j.error?.message ?? "create failed");
      return;
    }
    setNewGridName("");
    setCreatingGrid(false);
    await loadGrids();
    setSelectedId(j.data.id);
  }

  async function deleteGrid(gridId: number) {
    if (!confirm(t("pricing.confirm.deleteGrid"))) return;
    const r = await fetch(`${apiBase}/grids/${gridId}`, { method: "DELETE" });
    const j = await r.json();
    if (!j.ok) {
      setError(j.error?.message ?? "delete failed");
      return;
    }
    if (selectedId === gridId) setSelectedId(null);
    await loadGrids();
  }

  async function deleteLine(gridId: number, lineId: number) {
    if (!confirm(t("pricing.confirm.deleteLine"))) return;
    const r = await fetch(`${apiBase}/grids/${gridId}/lines/${lineId}`, {
      method: "DELETE",
    });
    const j = await r.json();
    if (!j.ok) {
      setError(j.error?.message ?? "delete failed");
      return;
    }
    await loadLines(gridId);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-[var(--ink-700)]">
            {t("pricing.grids")}
          </h2>
          <button
            type="button"
            onClick={() => setCreatingGrid((v) => !v)}
            className="text-[12px] text-[var(--ao-accent)] hover:underline"
          >
            {creatingGrid ? t("common.cancel") : t("pricing.addGrid")}
          </button>
        </div>
        {creatingGrid ? (
          <div className="mb-3 rounded border border-[var(--allonce-line)] p-2">
            <input
              autoFocus
              value={newGridName}
              onChange={(e) => setNewGridName(e.target.value)}
              placeholder={t("pricing.gridName")}
              className="w-full rounded border border-[var(--allonce-line)] bg-transparent px-2 py-1 text-[13px]"
            />
            <button
              type="button"
              onClick={createGrid}
              className="mt-2 w-full rounded bg-[var(--ink-900)] px-2 py-1 text-[12px] text-white"
            >
              {t("common.save")}
            </button>
          </div>
        ) : null}
        {loading ? (
          <div className="text-[12px] text-[var(--ink-500)]">
            {t("common.loading")}
          </div>
        ) : grids.length === 0 ? (
          <div className="text-[12px] text-[var(--ink-500)]">
            {t("pricing.noGrids")}
          </div>
        ) : (
          <ul className="space-y-1">
            {grids.map((g) => {
              const active = g.id === selectedId;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(g.id)}
                    className={`group flex w-full items-start justify-between rounded px-2 py-1.5 text-left text-[13px] ${
                      active
                        ? "bg-[var(--allonce-fog)] text-[var(--ink-900)]"
                        : "text-[var(--ink-700)] hover:bg-[var(--allonce-fog)]"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {g.name}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--ink-500)]">
                        {g.valid_from ?? "—"} → {g.valid_until ?? "—"}
                      </span>
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteGrid(g.id);
                      }}
                      className="ml-2 text-[11px] text-[var(--ink-400)] hover:text-red-600 opacity-0 group-hover:opacity-100"
                      role="button"
                      tabIndex={0}
                    >
                      ×
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      <section>
        {error ? (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        ) : null}
        {selectedId == null ? (
          <div className="mt-12 text-center text-[var(--ink-500)]">
            <p>{t("pricing.selectGrid")}</p>
          </div>
        ) : (
          <PriceLineTable
            kind={kind}
            lines={lines}
            onDelete={(lineId) => deleteLine(selectedId, lineId)}
            onCreate={async (payload) => {
              const r = await fetch(`${apiBase}/grids/${selectedId}/lines`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
              });
              const j = await r.json();
              if (!j.ok) {
                setError(j.error?.message ?? "create failed");
                return;
              }
              await loadLines(selectedId);
            }}
          />
        )}
      </section>
    </div>
  );
}

function PriceLineTable({
  kind,
  lines,
  onDelete,
  onCreate,
}: {
  kind: Kind;
  lines: LineRow[];
  onDelete: (lineId: number) => Promise<void>;
  onCreate: (payload: Record<string, number | null>) => Promise<void>;
}) {
  const { t } = useLocale();
  const [showAdd, setShowAdd] = useState(false);
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [ageFrom, setAgeFrom] = useState("");
  const [ageTo, setAgeTo] = useState("");
  const [coverage, setCoverage] = useState("");
  const [paxFrom, setPaxFrom] = useState("");
  const [paxTo, setPaxTo] = useState("");
  const [distFrom, setDistFrom] = useState("");
  const [distTo, setDistTo] = useState("");

  function n(v: string): number | null {
    if (v === "") return null;
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  }

  async function submit() {
    const payload: Record<string, number | null> = { price: n(price) };
    if (kind === "ensure") {
      payload.days = n(days);
      payload.age_from = n(ageFrom);
      payload.age_to = n(ageTo);
      payload.coverage_amount = n(coverage);
    } else {
      payload.passengers_from = n(paxFrom);
      payload.passengers_to = n(paxTo);
      payload.distance_km_from = n(distFrom);
      payload.distance_km_to = n(distTo);
    }
    await onCreate(payload);
    setShowAdd(false);
    setPrice("");
    setDays("");
    setAgeFrom("");
    setAgeTo("");
    setCoverage("");
    setPaxFrom("");
    setPaxTo("");
    setDistFrom("");
    setDistTo("");
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-[var(--ink-700)]">
          {t("pricing.lines")}
        </h2>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-[12px] text-[var(--ao-accent)] hover:underline"
        >
          {showAdd ? t("common.cancel") : t("pricing.addLine")}
        </button>
      </div>
      {showAdd ? (
        <div className="mb-3 grid gap-2 rounded border border-[var(--allonce-line)] p-3 sm:grid-cols-2 lg:grid-cols-3">
          {kind === "ensure" ? (
            <>
              <LabeledInput
                label={t("pricing.days")}
                value={days}
                onChange={setDays}
                type="number"
              />
              <LabeledInput
                label={t("pricing.ageFrom")}
                value={ageFrom}
                onChange={setAgeFrom}
                type="number"
              />
              <LabeledInput
                label={t("pricing.ageTo")}
                value={ageTo}
                onChange={setAgeTo}
                type="number"
              />
              <LabeledInput
                label={t("pricing.coverage")}
                value={coverage}
                onChange={setCoverage}
                type="number"
              />
            </>
          ) : (
            <>
              <LabeledInput
                label={t("pricing.paxFrom")}
                value={paxFrom}
                onChange={setPaxFrom}
                type="number"
              />
              <LabeledInput
                label={t("pricing.paxTo")}
                value={paxTo}
                onChange={setPaxTo}
                type="number"
              />
              <LabeledInput
                label={t("pricing.distFrom")}
                value={distFrom}
                onChange={setDistFrom}
                type="number"
              />
              <LabeledInput
                label={t("pricing.distTo")}
                value={distTo}
                onChange={setDistTo}
                type="number"
              />
            </>
          )}
          <LabeledInput
            label={t("pricing.price")}
            value={price}
            onChange={setPrice}
            type="number"
          />
          <div className="flex items-end">
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
      {lines.length === 0 ? (
        <p className="mt-6 text-center text-[12px] text-[var(--ink-500)]">
          {t("pricing.noLines")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--allonce-line)]">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--allonce-fog)] text-left text-[12px] text-[var(--ink-700)]">
              <tr>
                <th className="px-3 py-2">#</th>
                {kind === "ensure" ? (
                  <>
                    <th className="px-3 py-2">{t("pricing.type")}</th>
                    <th className="px-3 py-2">{t("pricing.days")}</th>
                    <th className="px-3 py-2">{t("pricing.ageRange")}</th>
                    <th className="px-3 py-2">{t("pricing.coverage")}</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2">{t("pricing.type")}</th>
                    <th className="px-3 py-2">{t("pricing.paxRange")}</th>
                    <th className="px-3 py-2">{t("pricing.distRange")}</th>
                  </>
                )}
                <th className="px-3 py-2 text-right">{t("pricing.price")}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr
                  key={l.id}
                  className="border-t border-[var(--allonce-line)]"
                >
                  <td className="px-3 py-2 text-[12px] text-[var(--ink-500)]">
                    {l.id}
                  </td>
                  {kind === "ensure" ? (
                    <>
                      <td className="px-3 py-2">
                        {l.ensure_type?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2">{l.days ?? "—"}</td>
                      <td className="px-3 py-2">
                        {l.age_from ?? "—"}–{l.age_to ?? "—"}
                      </td>
                      <td className="px-3 py-2">{l.coverage_amount ?? "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2">
                        {l.transfer_type?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        {l.passengers_from ?? "—"}–{l.passengers_to ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        {l.distance_km_from ?? "—"}–{l.distance_km_to ?? "—"}
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2 text-right">
                    {l.price != null
                      ? `${Number(l.price).toFixed(2)} ${l.currency?.code ?? ""}`.trim()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(l.id)}
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

function LabeledInput({
  label,
  value,
  onChange,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-[var(--ink-500)]">
        {label}
      </span>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-[var(--allonce-line)] bg-transparent px-2 py-1 text-[13px]"
      />
    </label>
  );
}
