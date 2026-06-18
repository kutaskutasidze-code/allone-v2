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

    await updateProposal(proposal.id, {
      contract_signed_at: new Date().toISOString(),
      signer_name: name.slice(0, 200),
      signer_id_code: (body.id_code ?? "").trim().slice(0, 60) || null,
      signature_image: body.signature_image || null,
      signer_ip: ip,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bots/thread/sign] error", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
