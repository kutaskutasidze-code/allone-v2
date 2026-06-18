import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/bots/repo";
import { getProposalByResponseId } from "@/lib/offers/repo";
import { createOrder, gelToUsd } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Compute the amount due (GEL) for a proposal: the advance/deposit = first
// payment-schedule stage if present, else the full price.
function amountGel(
  price: number | null,
  schedule?: { amount: number }[],
): number {
  if (schedule && schedule.length > 0) return schedule[0]!.amount;
  return price ?? 0;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; rid: string }> },
) {
  const { slug, rid } = await params;
  try {
    const response = await getResponse(rid);
    if (!response || response.bot_slug !== slug) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const proposal = await getProposalByResponseId(rid);
    if (!proposal) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (proposal.paid_at) {
      return NextResponse.json({ error: "already paid" }, { status: 409 });
    }
    const gel = amountGel(proposal.price, proposal.offer?.schedule);
    if (gel <= 0) {
      return NextResponse.json({ error: "no amount due" }, { status: 409 });
    }
    const usd = gelToUsd(gel);
    const order = await createOrder({
      amountUsd: usd,
      reference: proposal.doc_number ?? proposal.id,
      description: `AllOne — ${proposal.client_name} (${proposal.doc_number ?? ""})`,
    });
    return NextResponse.json({
      orderID: order.id,
      amountUsd: usd,
      amountGel: gel,
    });
  } catch (err) {
    console.error("[pay/create] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "payment init failed" },
      { status: 502 },
    );
  }
}
