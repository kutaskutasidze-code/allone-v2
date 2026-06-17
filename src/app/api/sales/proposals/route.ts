import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import {
  listProposals,
  createProposal,
  nextDocNumber,
} from "@/lib/offers/repo";
import type { OfferDraft } from "@/lib/offers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";

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

  let body: { response_id?: unknown };
  try {
    body = (await req.json()) as { response_id?: unknown };
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
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
