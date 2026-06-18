"use client";

import { useRef, useState, useEffect } from "react";

// In-chat electronic signature of the contract (Georgian e-contract style):
// review → identify (name + ID) → draw signature → consent → submit. Records
// against the proposal via the public sign endpoint.

export function SignPanel({
  slug,
  rid,
  contractUrl,
  signed,
  signerName,
  onSigned,
}: {
  slug: string;
  rid: string;
  contractUrl: string;
  signed: boolean;
  signerName: string | null;
  onSigned: () => void;
}) {
  const [name, setName] = useState("");
  const [idCode, setIdCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

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
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
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
  function clear() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }

  async function submit() {
    if (!name.trim()) return setErr("გთხოვთ მიუთითოთ სახელი და გვარი");
    if (!agree) return setErr("გთხოვთ დაეთანხმოთ პირობებს");
    setBusy(true);
    setErr(null);
    try {
      const sig = hasInk
        ? canvasRef.current?.toDataURL("image/png")
        : undefined;
      const res = await fetch(`/api/bots/${slug}/thread/${rid}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          id_code: idCode,
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
    <div className="max-w-[92%] rounded-2xl border border-[var(--allone-line,#ececec)] bg-[var(--bg-surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-2 text-[14px] font-medium text-[var(--ink-900)]">
        ხელშეკრულების ხელმოწერა
      </div>
      <a
        href={contractUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-3 inline-block text-[13px] font-medium text-[var(--ao-accent,#0047ff)] underline"
      >
        ხელშეკრულების ნახვა (PDF)
      </a>

      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="სახელი და გვარი *"
          className="w-full rounded-lg border border-[var(--allone-line,#e4e4e7)] px-3 py-2 text-[14px] outline-none focus:border-[var(--ink-900)]"
        />
        <input
          value={idCode}
          onChange={(e) => setIdCode(e.target.value)}
          placeholder="პირადი ნომერი"
          className="w-full rounded-lg border border-[var(--allone-line,#e4e4e7)] px-3 py-2 text-[14px] outline-none focus:border-[var(--ink-900)]"
        />
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] text-[var(--ink-500)]">
              ხელმოწერა (დახაზეთ)
            </span>
            <button
              type="button"
              onClick={clear}
              className="text-[11px] text-[var(--ink-400)] hover:text-[var(--ink-900)]"
            >
              გასუფთავება
            </button>
          </div>
          <canvas
            ref={canvasRef}
            width={520}
            height={130}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            className="w-full touch-none rounded-lg border border-dashed border-[var(--allone-line,#d4d4d8)] bg-[var(--bg-surface-alt,#fafafa)]"
            style={{ height: 130 }}
          />
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
          disabled={busy}
          className="w-full rounded-lg bg-[var(--ink-900)] py-2.5 text-[14px] font-medium text-white transition active:scale-[0.99] disabled:opacity-40"
        >
          {busy ? "იგზავნება…" : "ხელმოწერა და დადასტურება"}
        </button>
      </div>
    </div>
  );
}
