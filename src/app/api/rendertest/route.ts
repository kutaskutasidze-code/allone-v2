import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// TEMP diagnostic: runs the exact Vercel→Fly render fetch the approve route does,
// returns the real outcome/error. No secrets in the response. Removed after.
export async function GET() {
  const url = process.env.OFFER_API_URL ?? "";
  const key = process.env.OFFER_API_KEY ?? "";
  const t0 = Date.now();
  try {
    const r = await fetch(`${url}/api/offers/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        doc_number: "AL-2026-DIFFTEST",
        offer: { client_name: "t", summary: "s", scope_lines: [{ label: "v", description: "d", price: 800 }], price: 800, currency: "GEL", schedule: [{ label: "w", amount: 800, when: "x" }], monthly_opex: "1", timeline: "4" },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    const text = await r.text();
    return NextResponse.json({ reached: true, status: r.status, ms: Date.now() - t0, body: text.slice(0, 200), url_present: !!url, key_present: !!key });
  } catch (err) {
    return NextResponse.json({ reached: false, ms: Date.now() - t0, error: err instanceof Error ? `${err.name}: ${err.message}` : String(err), cause: (err as { cause?: { code?: string } })?.cause?.code ?? null, url_present: !!url, key_present: !!key });
  }
}
