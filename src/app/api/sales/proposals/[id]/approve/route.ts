import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { getProposal, updateProposal } from "@/lib/offers/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_req: NextRequest, context: RouteContext) {
  try {
    await requireSalesAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }

  const { id } = await context.params;

  const current = await getProposal(id);
  if (!current) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (current.status !== "draft") {
    return NextResponse.json(
      { error: "only draft proposals can be approved" },
      { status: 409 },
    );
  }

  // Proxy to the offer-generator service to render the PDF
  let pdf_url: string;
  try {
    const svcRes = await fetch(`${OFFER_API_URL}/api/offers/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({
        offer: current.offer,
        doc_number: current.doc_number,
      }),
    });

    if (!svcRes.ok) {
      const errText = await svcRes.text();
      return NextResponse.json(
        {
          error: `render service error: ${errText || svcRes.statusText}`,
          bridge: "down",
        },
        { status: 502 },
      );
    }

    const svcJson = (await svcRes.json()) as { pdf_url: string };
    pdf_url = svcJson.pdf_url;
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

  const proposal = await updateProposal(id, {
    offer_pdf_url: pdf_url,
    status: "approved",
  });

  return NextResponse.json({ proposal });
}
