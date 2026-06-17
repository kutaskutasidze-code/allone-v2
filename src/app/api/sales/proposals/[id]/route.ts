import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { getProposal, updateProposal } from "@/lib/offers/repo";
import type { OfferDraft } from "@/lib/offers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    await requireSalesAuth();
    const { id } = await context.params;
    const proposal = await getProposal(id);
    if (!proposal) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ proposal });
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

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireSalesAuth();
    const { id } = await context.params;

    const current = await getProposal(id);
    if (!current) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (current.status !== "draft") {
      return NextResponse.json(
        { error: "only draft proposals can be edited" },
        { status: 409 },
      );
    }

    let body: { offer?: OfferDraft; price?: number };
    try {
      body = (await req.json()) as { offer?: OfferDraft; price?: number };
    } catch {
      return NextResponse.json({ error: "bad json" }, { status: 400 });
    }

    const patch: { offer?: OfferDraft; price?: number } = {};
    if (body.offer !== undefined) patch.offer = body.offer;
    if (typeof body.price === "number") patch.price = body.price;

    const proposal = await updateProposal(id, patch);
    return NextResponse.json({ proposal });
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
