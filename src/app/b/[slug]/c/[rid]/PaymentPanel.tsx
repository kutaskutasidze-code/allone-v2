"use client";

import { useEffect, useRef, useState } from "react";

// In-chat PayPal payment. Offers are in GEL; PayPal charges USD (converted
// server-side). Loads the PayPal JS SDK, renders Buttons, and routes
// createOrder/onApprove to our rid-keyed endpoints.

interface PayPalButtonsApi {
  Buttons: (cfg: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: (err: unknown) => void;
    style?: Record<string, string>;
  }) => { render: (el: HTMLElement) => Promise<void> };
}
declare global {
  interface Window {
    paypal?: PayPalButtonsApi;
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

function loadSdk(): Promise<void> {
  if (window.paypal) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.id = "paypal-sdk";
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      CLIENT_ID,
    )}&currency=USD&disable-funding=venmo,paylater`;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("PayPal SDK load failed"));
    document.body.appendChild(s);
  });
}

export function PaymentPanel({
  slug,
  rid,
  amountGel,
  invoiceUrl,
  paid,
  onPaid,
}: {
  slug: string;
  rid: string;
  amountGel: number;
  invoiceUrl: string | null;
  paid: boolean;
  onPaid: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(paid);

  useEffect(() => {
    if (done || rendered.current || !CLIENT_ID || !ref.current) return;
    rendered.current = true;
    let cancelled = false;
    loadSdk()
      .then(() => {
        if (cancelled || !window.paypal || !ref.current) return;
        window.paypal
          .Buttons({
            style: { layout: "vertical", color: "black", shape: "pill" },
            createOrder: async () => {
              const res = await fetch(
                `/api/bots/${slug}/thread/${rid}/pay/create`,
                { method: "POST" },
              );
              const d = (await res.json()) as {
                orderID?: string;
                error?: string;
              };
              if (!d.orderID) throw new Error(d.error || "create failed");
              return d.orderID;
            },
            onApprove: async (data) => {
              const res = await fetch(
                `/api/bots/${slug}/thread/${rid}/pay/capture`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderID: data.orderID }),
                },
              );
              const d = (await res.json()) as { ok?: boolean; error?: string };
              if (!d.ok) throw new Error(d.error || "capture failed");
              setDone(true);
              onPaid();
            },
            onError: () => setErr("გადახდა ვერ დასრულდა — სცადეთ ისევ."),
          })
          .render(ref.current);
      })
      .catch(() => setErr("PayPal ვერ ჩაიტვირთა."));
    return () => {
      cancelled = true;
    };
  }, [slug, rid, done, onPaid]);

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-[14px] font-medium text-green-800">
        ✓ გადახდა მიღებულია — მადლობა!
      </div>
    );
  }

  const usdApprox = (amountGel / 2.7).toFixed(0);

  return (
    // Brand-accent scoped to match the in-chat offer + sign panel (one blue).
    <div
      style={{ "--ao-accent": "#2776EA" } as React.CSSProperties}
      className="max-w-[92%] rounded-2xl border border-[var(--allone-line,#ececec)] bg-[var(--bg-surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="mb-1 text-[14px] font-medium text-[var(--ink-900)]">
        გადახდა
      </div>
      <div className="mb-3 text-[13px] text-[var(--ink-600,#52525b)]">
        გადასახდელი (ავანსი): <b>{amountGel.toLocaleString("en-US")} ₾</b>
        <span className="text-[var(--ink-400)]"> · ≈ ${usdApprox} USD</span>
      </div>
      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 inline-block text-[13px] font-medium text-[var(--ao-accent,#0047ff)] underline"
        >
          ინვოისის ნახვა (PDF)
        </a>
      )}
      {!CLIENT_ID ? (
        <p className="text-[12.5px] text-[var(--ink-500)]">
          გადახდა ჯერ არ არის კონფიგურირებული.
        </p>
      ) : (
        <div ref={ref} />
      )}
      {err && (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">
          {err}
        </p>
      )}
    </div>
  );
}
