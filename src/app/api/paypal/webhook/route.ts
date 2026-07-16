import { NextRequest, NextResponse } from "next/server";
import {
  getProposalByDocNumber,
  updateProposal,
  markInstallmentPaid,
} from "@/lib/offers/repo";
import { captureOrder, gelToUsd, verifyWebhookSignature } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PayPal webhook. The in-chat payment captures from the buyer's browser, so a
// closed tab between "approved" and "capture" leaves the order approved-but-not-
// captured and the proposal unpaid. This receiver captures server-side on
// CHECKOUT.ORDER.APPROVED and records it, independent of the browser.
//
// Config required: register the webhook in the PayPal dashboard (event
// CHECKOUT.ORDER.APPROVED) pointing at /api/paypal/webhook, and set
// PAYPAL_WEBHOOK_ID. Until that env is set, verification fails closed (401).

interface OrderApprovedResource {
  id?: string;
  purchase_units?: { reference_id?: string }[];
}

export async function POST(req: NextRequest) {
  const raw = await req.text();

  const verified = await verifyWebhookSignature(req.headers, raw);
  if (!verified) {
    return NextResponse.json({ error: "unverified" }, { status: 401 });
  }

  let event: { event_type?: string; resource?: OrderApprovedResource };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  // We only act on approval; capture-completed etc. are acked as no-ops (our own
  // capture below, or the browser's, already recorded the payment).
  if (event.event_type !== "CHECKOUT.ORDER.APPROVED") {
    return NextResponse.json({ ok: true, ignored: event.event_type });
  }

  const orderId = event.resource?.id;
  const docNumber = event.resource?.purchase_units?.[0]?.reference_id;
  if (!orderId || !docNumber) {
    return NextResponse.json({ ok: true, note: "no order/reference" });
  }

  try {
    const proposal = await getProposalByDocNumber(docNumber);
    if (!proposal) return NextResponse.json({ ok: true, note: "no proposal" });
    if (proposal.paid_at) {
      // Browser capture already won — nothing to do.
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const cap = await captureOrder(orderId);
    if (!cap.ok) {
      // Already captured elsewhere (race) or a genuine decline — log and ack so
      // PayPal doesn't retry forever; the diagnostic trail is in captureOrder.
      console.error("[paypal/webhook] capture not completed", {
        docNumber,
        orderId,
        status: cap.status,
        reason: cap.reason,
      });
      return NextResponse.json({ ok: true, captured: false });
    }

    const gel = proposal.offer?.schedule?.[0]?.amount ?? proposal.price ?? 0;
    await updateProposal(proposal.id, {
      paid_at: new Date().toISOString(),
      paid_amount_usd: cap.amountUsd ?? gelToUsd(gel),
      paid_amount_gel: gel,
      paypal_order_id: orderId,
      paypal_capture_id: cap.captureId ?? null,
    });
    await markInstallmentPaid(proposal.lead_id, gel);

    return NextResponse.json({ ok: true, captured: true });
  } catch (err) {
    console.error("[paypal/webhook] error", err);
    // Ack anyway: a 5xx makes PayPal retry, which just re-hits the paid_at guard.
    return NextResponse.json({ ok: true, error: "handled" });
  }
}
