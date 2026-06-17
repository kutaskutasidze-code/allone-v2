import { NextRequest, NextResponse } from "next/server";
import {
  getBotConfigBySlug,
  buildResponseRow,
  insertResponse,
} from "@/lib/bots/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let body: { answers?: Record<string, string | string[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }
  // Public endpoint: cap the payload so a known slug can't be used to bloat the
  // table with megabytes of JSON.
  if (JSON.stringify(body.answers).length > 50_000) {
    return NextResponse.json({ error: "answers too large" }, { status: 413 });
  }

  try {
    const cfg = await getBotConfigBySlug(slug);
    if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });

    const row = buildResponseRow(
      slug,
      cfg.lead_id,
      cfg.client_name,
      body.answers,
      req.headers.get("user-agent"),
    );
    const responseId = await insertResponse(row);
    return NextResponse.json({ ok: true, response_id: responseId });
  } catch (err) {
    console.error("[bots/submit] save failed", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}
