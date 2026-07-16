import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/bots/repo";
import { getProposalByResponseId, updateProposal } from "@/lib/offers/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, rid-keyed e-signature of the contract. The client signs in-chat;
// we record the signer name, ID, signature image, timestamp and IP against
// the proposal. Only allowed once a contract has been generated.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; rid: string }> },
) {
  const { slug, rid } = await params;

  let body: {
    name?: string;
    id_code?: string;
    signature_image?: string;
    agree?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "სახელი სავალდებულოა" }, { status: 400 });
  }
  if (!body.agree) {
    return NextResponse.json(
      { error: "გთხოვთ დაეთანხმოთ პირობებს" },
      { status: 400 },
    );
  }
  // bound the signature image
  if (body.signature_image && body.signature_image.length > 400_000) {
    return NextResponse.json({ error: "signature too large" }, { status: 413 });
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
    if (!proposal.contract_pdf_url) {
      return NextResponse.json(
        { error: "contract not ready" },
        { status: 409 },
      );
    }
    if (proposal.contract_signed_at) {
      return NextResponse.json({ ok: true, alreadySigned: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const signedAt = new Date().toISOString();
    const idCode = (body.id_code ?? "").trim().slice(0, 60) || null;
    await updateProposal(proposal.id, {
      contract_signed_at: signedAt,
      signer_name: name.slice(0, 200),
      signer_id_code: idCode,
      signature_image: body.signature_image || null,
      signer_ip: ip,
    });

    // Re-render the contract PDF with the signature embedded, so the "signed"
    // contract actually shows the signature. Best-effort: the signature is
    // already recorded above, so a render hiccup must not fail the signing.
    try {
      const OFFER_API_URL =
        process.env.OFFER_API_URL ?? "http://localhost:3100";
      const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";
      const r = await fetch(`${OFFER_API_URL}/api/docs/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OFFER_API_KEY}`,
        },
        body: JSON.stringify({
          proposal: {
            doc_number: proposal.doc_number,
            language: proposal.language,
            offer: proposal.offer,
            client_name: proposal.client_name,
            recipient: proposal.recipient,
          },
          recipient: proposal.recipient ?? { name: proposal.client_name },
          signature: {
            name: name.slice(0, 200),
            id_code: idCode,
            signature_image: body.signature_image || null,
            signed_at: signedAt,
            ip,
          },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (r.ok) {
        const { contract_pdf_url } = (await r.json()) as {
          contract_pdf_url?: string;
        };
        if (contract_pdf_url) {
          await updateProposal(proposal.id, { contract_pdf_url });
        }
      }
    } catch {
      // best-effort re-render; signature already persisted
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bots/thread/sign] error", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
