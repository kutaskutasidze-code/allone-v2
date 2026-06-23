"use client";

import { useRef, useState, useEffect } from "react";

// In-chat electronic signature of the contract (Georgian e-contract style).
// #13 — SIMPLER signing: the client's name/ID are autofilled from the proposal,
// the signature is TYPED by default (rendered in a signature style; no drawing
// needed), and a prominent Review & Sign CTA leads the flow. Drawing is kept as
// an optional fallback. Records against the proposal via the public endpoint.

export function SignPanel({
  slug,
  rid,
  contractUrl,
  signed,
  signerName,
  prefillName,
  prefillIdCode,
  onSigned,
}: {
  slug: string;
  rid: string;
  contractUrl: string;
  signed: boolean;
  signerName: string | null;
  prefillName?: string | null;
  prefillIdCode?: string | null;
  onSigned: () => void;
}) {
  const [name, setName] = useState(prefillName ?? "");
  const [idCode, setIdCode] = useState(prefillIdCode ?? "");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  // Keep the fields in sync if the prefill arrives after first render.
  useEffect(() => {
    if (prefillName) setName((n) => n || prefillName);
    if (prefillIdCode) setIdCode((c) => c || prefillIdCode);
  }, [prefillName, prefillIdCode]);

  useEffect(() => {
    if (mode !== "draw") return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [mode]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(x, y);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.lineTo(x, y);
    ctx?.stroke();
    setHasInk(true);
  }
  function up() {
    drawing.current = false;
  }
  function clearDraw() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  // Render the typed name as a signature-style PNG so a visual signature is
  // stored/stampable even when the client never draws.
  function typedSignatureImage(): string | undefined {
    if (!name.trim()) return undefined;
    const c = document.createElement("canvas");
    c.width = 520;
    c.height = 130;
    const ctx = c.getContext("2d");
    if (!ctx) return undefined;
    ctx.fillStyle = "#0a0a0a";
    ctx.textBaseline = "middle";
    ctx.font = "italic 44px 'Noto Serif Georgian', Georgia, serif";
    ctx.fillText(name.trim(), 16, 70, 488);
    return c.toDataURL("image/png");
  }

  async function submit() {
    if (!name.trim()) return setErr("გთხოვთ მიუთითოთ სახელი და გვარი");
    if (!agree) return setErr("გთხოვთ დაეთანხმოთ პირობებს");
    if (mode === "draw" && !hasInk)
      return setErr("გთხოვთ დახაზოთ ხელმოწერა ან გადართოთ აკრეფაზე");
    setBusy(true);
    setErr(null);
    try {
      const sig =
        mode === "draw"
          ? canvasRef.current?.toDataURL("image/png")
          : typedSignatureImage();
      const res = await fetch(`/api/bots/${slug}/thread/${rid}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          id_code: idCode.trim(),
          signature_image: sig,
          agree: true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "ვერ მოხერხდა");
      onSigned();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ვერ მოხერხდა");
      setBusy(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 text-[14px] font-medium text-green-800">
          <span>✓</span> ხელშეკრულება ხელმოწერილია
          {signerName ? ` — ${signerName}` : ""}
        </div>
      </div>
    );
  }

  return (
    // Brand-accent scoped to the client thread so sign + pay + offer read as one
    // consistent blue (#2776EA), matching the in-chat offer card.
    <div
      style={{ "--ao-accent": "#2776EA" } as React.CSSProperties}
      className="max-w-[92%] rounded-2xl border border-[var(--allone-line,#ececec)] bg-[var(--bg-surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-3 text-[14px] font-semibold text-[var(--ink-900)]">
        ხელშეკრულების ხელმოწერა
      </div>

      {/* Prominent Review & Sign CTA — read the contract first */}
      <a
        href={contractUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 flex items-center justify-between rounded-xl border border-[var(--ao-accent)] bg-[#eef4fe] px-3.5 py-2.5 text-[13px] font-medium text-[var(--ao-accent)]"
      >
        <span>ხელშეკრულების ნახვა (PDF)</span>
        <span aria-hidden>↗</span>
      </a>

      <div className="space-y-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="სახელი და გვარი *"
          className="w-full rounded-lg border border-[var(--allone-line,#e4e4e7)] px-3 py-2 text-[14px] outline-none focus:border-[var(--ao-accent)]"
        />
        <input
          value={idCode}
          onChange={(e) => setIdCode(e.target.value)}
          placeholder="პირადი ნომერი"
          className="w-full rounded-lg border border-[var(--allone-line,#e4e4e7)] px-3 py-2 text-[14px] outline-none focus:border-[var(--ao-accent)]"
        />

        {/* Signature: typed by default, drawn optionally */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-[var(--ink-500)]">ხელმოწერა</span>
            <button
              type="button"
              onClick={() => {
                setErr(null);
                setMode((m) => (m === "type" ? "draw" : "type"));
              }}
              className="text-[11px] font-medium text-[var(--ao-accent)] hover:underline"
            >
              {mode === "type" ? "დახაზვა ნაცვლად" : "აკრეფა ნაცვლად"}
            </button>
          </div>

          {mode === "type" ? (
            <div className="flex min-h-[64px] items-center rounded-lg border border-[var(--allone-line,#e4e4e7)] bg-[var(--bg-surface-alt,#fafafa)] px-4">
              {name.trim() ? (
                <span
                  className="text-[var(--ink-900)]"
                  style={{
                    fontFamily: "'Noto Serif Georgian', Georgia, serif",
                    fontStyle: "italic",
                    fontSize: 30,
                    lineHeight: 1.1,
                  }}
                >
                  {name.trim()}
                </span>
              ) : (
                <span className="text-[13px] text-[var(--ink-400)]">
                  თქვენი სახელი გამოჩნდება ხელმოწერად
                </span>
              )}
            </div>
          ) : (
            <div>
              <canvas
                ref={canvasRef}
                width={520}
                height={130}
                onPointerDown={down}
                onPointerMove={moveDraw}
                onPointerUp={up}
                onPointerLeave={up}
                className="w-full touch-none rounded-lg border border-dashed border-[var(--allone-line,#d4d4d8)] bg-[var(--bg-surface-alt,#fafafa)]"
                style={{ height: 130 }}
              />
              <button
                type="button"
                onClick={clearDraw}
                className="mt-1 text-[11px] text-[var(--ink-400)] hover:text-[var(--ink-900)]"
              >
                გასუფთავება
              </button>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 text-[12.5px] leading-snug text-[var(--ink-700,#3f3f46)]">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            ვადასტურებ, რომ გავეცანი ხელშეკრულებას და ვეთანხმები მის პირობებს.
            ელექტრონული ხელმოწერა იურიდიულად მავალდებულებელია.
          </span>
        </label>

        {err && (
          <p className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">
            {err}
          </p>
        )}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || !name.trim() || !agree}
          className="w-full rounded-lg bg-[var(--ink-900)] py-2.5 text-[14px] font-medium text-white transition active:scale-[0.99] disabled:opacity-40"
        >
          {busy ? "იგზავნება…" : "ხელმოწერა და დადასტურება"}
        </button>
      </div>
    </div>
  );
}
