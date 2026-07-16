import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/bots/repo";
import {
  getProposalByResponseId,
  updateProposal,
  markInstallmentPaid,
} from "@/lib/offers/repo";
import { captureOrder, gelToUsd } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; rid: string }> },
) {
  const { slug, rid } = await params;
  let body: { orderID?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body.orderID) {
    return NextResponse.json({ error: "orderID required" }, { status: 400 });
  }

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
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const cap = await captureOrder(body.orderID);
    if (!cap.ok) {
      // Diagnostic trail: which proposal, what PayPal said, and the debug_id to
      // quote to PayPal support. (captureOrder already logged the raw reason.)
      console.error("[pay/capture] not completed", {
        proposalId: proposal.id,
        docNumber: proposal.doc_number,
        orderID: body.orderID,
        status: cap.status,
        reason: cap.reason,
        debugId: cap.debugId,
      });
      return NextResponse.json(
        {
          error: `payment not completed (${cap.reason ?? cap.status ?? "unknown"})`,
          status: cap.status,
          debugId: cap.debugId,
        },
        { status: 402 },
      );
    }

    const gel = proposal.offer?.schedule?.[0]?.amount ?? proposal.price ?? 0;
    await updateProposal(proposal.id, {
      paid_at: new Date().toISOString(),
      paid_amount_usd: cap.amountUsd ?? gelToUsd(gel),
      paid_amount_gel: gel,
      paypal_order_id: body.orderID,
      paypal_capture_id: cap.captureId ?? null,
    });

    // Reflect the advance in the lead's payment ledger so Paid/Owed is correct
    // (best-effort — never blocks the payment response).
    await markInstallmentPaid(proposal.lead_id, gel);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[pay/capture] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "capture failed" },
      { status: 502 },
    );
  }
}
