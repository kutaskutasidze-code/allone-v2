import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/bots/repo";
import { getProposalByResponseId } from "@/lib/offers/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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
    const hasDocuments = (proposal?.chat_documents?.length ?? 0) > 0;
    // Once the offer is approved/sent, expose the structured offer so the
    // client sees it rendered in-chat (autolab style), not just a PDF link.
    const offerReady =
      proposal &&
      (proposal.status === "approved" || proposal.status === "sent") &&
      proposal.offer;

    return NextResponse.json({
      status: proposal?.status ?? "received",
      intro: offerReady
        ? "თქვენი შეთავაზება მზადაა 👇"
        : hasDocuments
          ? "თქვენი დოკუმენტები მზადაა — იხილეთ ქვემოთ."
          : "მადლობა! თქვენი მოთხოვნა მიღებულია. შეთავაზებას მალე მოგაწვდით აქვე.",
      documents: proposal?.chat_documents ?? [],
      offer: offerReady ? proposal.offer : null,
      doc_number: offerReady ? (proposal.doc_number ?? "") : null,
      // e-sign: surface the contract for in-chat signing + prefill the signer's
      // identity from the recipient/client so they don't retype it (#13).
      contract_url: proposal?.contract_pdf_url ?? null,
      signed: !!proposal?.contract_signed_at,
      signer_name: proposal?.signer_name ?? null,
      signer_prefill_name:
        proposal?.recipient?.name ?? proposal?.client_name ?? null,
      signer_prefill_id: proposal?.recipient?.id_code ?? null,
      // payment
      invoice_url: proposal?.invoice_pdf_url ?? null,
      paid: !!proposal?.paid_at,
      pay_gel: offerReady
        ? (proposal.offer?.schedule?.[0]?.amount ?? proposal.price ?? 0)
        : 0,
    });
  } catch (err) {
    // Public client-facing endpoint: never hard-500 the client's thread on a
    // transient DB hiccup — degrade to the neutral "received" state.
    console.error("[bots/thread] error", err);
    return NextResponse.json({
      status: "received",
      intro: "მადლობა! თქვენი მოთხოვნა მიღებულია.",
      documents: [],
    });
  }
}
