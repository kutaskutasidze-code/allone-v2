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
  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });

  const row = buildResponseRow(
    slug,
    cfg.lead_id,
    cfg.client_name,
    body.answers,
    req.headers.get("user-agent"),
  );
  await insertResponse(row);
  return NextResponse.json({ ok: true });
}
