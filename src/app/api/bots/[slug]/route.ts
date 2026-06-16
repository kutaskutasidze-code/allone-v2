import { NextRequest, NextResponse } from "next/server";
import { getBotConfigBySlug } from "@/lib/bots/repo";
import type { PublicBotConfig } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params; // Next 16: params is async
  const cfg = await getBotConfigBySlug(slug);
  if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });
  const pub: PublicBotConfig = {
    slug: cfg.slug,
    title: cfg.title,
    intro: cfg.intro,
    language: cfg.language,
    questions: cfg.questions,
  };
  return NextResponse.json(pub);
}
