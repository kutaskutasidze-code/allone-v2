import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import {
  listProposals,
  createProposal,
  nextDocNumber,
} from "@/lib/offers/repo";
import { reconcileOfferPricing } from "@/lib/offers/pricing";
import type { OfferDraft } from "@/lib/offers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";

type ScopeLine = { label: string; description: string; price: number };

// Build a clean OfferDraft from sales-entered fields. Enforces the pricing
// single-source-of-truth: offer.price === Σ scope_lines, and the schedule sums
// to that total (default: one stage). Everything here is sales-controlled.
function normalizeManualOffer(
  raw: unknown,
  clientNameRaw: unknown,
): { offer: OfferDraft } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "offer required" };
  const o = raw as Record<string, unknown>;
  const client_name =
    (typeof clientNameRaw === "string" && clientNameRaw.trim()) ||
    (typeof o.client_name === "string" && o.client_name.trim()) ||
    "";
  if (!client_name) return { error: "client_name required" };

  const linesIn = Array.isArray(o.scope_lines) ? o.scope_lines : [];
  const scope_lines: ScopeLine[] = linesIn
    .map((l) => {
      const x = (l ?? {}) as Record<string, unknown>;
      return {
        label: typeof x.label === "string" ? x.label.trim() : "",
        description: typeof x.description === "string" ? x.description : "",
        price: Number(x.price) || 0,
      };
    })
    .filter((l) => l.label);
  if (scope_lines.length === 0)
    return { error: "at least one scope line required" };

  const stagesIn = Array.isArray(o.schedule) ? o.schedule : [];
  const scheduleIn = stagesIn
    .map((s) => {
      const x = (s ?? {}) as Record<string, unknown>;
      return {
        label: typeof x.label === "string" ? x.label : "",
        amount: Number(x.amount) || 0,
        when: typeof x.when === "string" ? x.when : "",
      };
    })
    .filter((s) => s.label);

  const monthly_price =
    Number(o.monthly_price) > 0 ? Number(o.monthly_price) : undefined;

  const addonsIn = Array.isArray(o.addons) ? o.addons : [];
  const addons: ScopeLine[] = addonsIn
    .map((l) => {
      const x = (l ?? {}) as Record<string, unknown>;
      return {
        label: typeof x.label === "string" ? x.label.trim() : "",
        description: typeof x.description === "string" ? x.description : "",
        price: Number(x.price) || 0,
      };
    })
    .filter((l) => l.label);

  const draft: OfferDraft = {
    client_name,
    summary: typeof o.summary === "string" ? o.summary : "",
    scope_lines,
    price: 0, // reconciled below from scope_lines (the SSOT)
    currency: "GEL",
    schedule: scheduleIn,
    monthly_price,
    monthly_opex:
      typeof o.monthly_opex === "string"
        ? o.monthly_opex
        : monthly_price
          ? `${monthly_price.toLocaleString("en-US")} ₾/თვე`
          : "",
    timeline: typeof o.timeline === "string" ? o.timeline : "",
    addons: addons.length ? addons : undefined,
  };
  // Same reconciliation the draft-edit PATCH uses: price = Σ scope_lines,
  // schedule rescaled to match. One code path, no divergence.
  const { offer } = reconcileOfferPricing(draft);
  return { offer };
}

export async function GET() {
  try {
    await requireSalesAuth();
    const proposals = await listProposals();
    return NextResponse.json({ proposals });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let salesUserId: string | null = null;
  try {
    const { salesUser } = await requireSalesAuth();
    salesUserId = salesUser?.id ?? null;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }

  let body: {
    response_id?: unknown;
    manual?: unknown;
    client_name?: unknown;
    offer?: unknown;
    language?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // ── Manual path: sales authors the offer directly, no bot/claude-bridge.
  // "as if the bot said it" — same OfferDraft shape, same downstream
  // offer/contract/invoice generation, but the content is sales-controlled.
  if (body.manual) {
    const manualOffer = normalizeManualOffer(body.offer, body.client_name);
    if ("error" in manualOffer) {
      return NextResponse.json({ error: manualOffer.error }, { status: 400 });
    }
    const doc_number = await nextDocNumber();
    const proposal = await createProposal({
      lead_id: null,
      source_response_id: null,
      client_name: manualOffer.offer.client_name,
      doc_number,
      language: body.language === "en" ? "en" : "ka",
      offer: manualOffer.offer,
      price: manualOffer.offer.price,
      currency: manualOffer.offer.currency ?? "GEL",
      status: "draft",
      created_by: salesUserId,
      source: "manual",
    });
    return NextResponse.json({ proposal }, { status: 201 });
  }

  if (typeof body.response_id !== "string") {
    return NextResponse.json(
      { error: "response_id (string) required" },
      { status: 400 },
    );
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const db = createAdminClient();

  const { data: responseRow, error: rErr } = await db
    .from("questionnaire_responses")
    .select("*")
    .eq("id", body.response_id)
    .maybeSingle();

  if (rErr) {
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }
  if (!responseRow) {
    return NextResponse.json(
      { error: "questionnaire response not found" },
      { status: 404 },
    );
  }

  const row = responseRow as {
    id: string;
    lead_id: string | null;
    client_name: string | null;
    respondent_name: string | null;
    answers: Record<string, unknown>;
  };

  const client_name = row.client_name ?? row.respondent_name ?? "კლიენტი";

  // Proxy to the offer-generator service
  let offer: OfferDraft;
  try {
    const svcRes = await fetch(`${OFFER_API_URL}/api/offers/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({ client_name, answers: row.answers }),
    });

    if (!svcRes.ok) {
      const errText = await svcRes.text();
      return NextResponse.json(
        {
          error: `offer service error: ${errText || svcRes.statusText}`,
          bridge: "down",
        },
        { status: 502 },
      );
    }

    const svcJson = (await svcRes.json()) as { offer: OfferDraft };
    offer = svcJson.offer;
    // Guard against a malformed/oversized model response landing in the DB.
    if (
      !offer ||
      typeof offer.price !== "number" ||
      !Array.isArray(offer.scope_lines)
    ) {
      return NextResponse.json(
        { error: "offer service returned malformed offer" },
        { status: 502 },
      );
    }
    if (JSON.stringify(offer).length > 50_000) {
      return NextResponse.json({ error: "offer too large" }, { status: 502 });
    }
  } catch (fetchErr) {
    return NextResponse.json(
      {
        error:
          fetchErr instanceof Error
            ? fetchErr.message
            : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
        bridge: "down",
      },
      { status: 502 },
    );
  }

  const doc_number = await nextDocNumber();

  const proposal = await createProposal({
    lead_id: row.lead_id,
    source_response_id: row.id,
    client_name,
    doc_number,
    language: "ka",
    offer,
    price: offer.price,
    currency: offer.currency ?? "GEL",
    status: "draft",
    created_by: salesUserId,
  });

  return NextResponse.json({ proposal }, { status: 201 });
}
