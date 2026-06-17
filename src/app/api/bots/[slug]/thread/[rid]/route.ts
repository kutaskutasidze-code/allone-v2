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

  const response = await getResponse(rid);
  if (!response || response.bot_slug !== slug) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const proposal = await getProposalByResponseId(rid);

  const hasDocuments = (proposal?.chat_documents?.length ?? 0) > 0;

  return NextResponse.json({
    status: proposal?.status ?? "received",
    intro: hasDocuments
      ? "თქვენი დოკუმენტები მზადაა — იხილეთ ქვემოთ."
      : "მადლობა! თქვენი მოთხოვნა მიღებულია. შეთავაზებას მალე მოგაწვდით აქვე.",
    documents: proposal?.chat_documents ?? [],
  });
}
