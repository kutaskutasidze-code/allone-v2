import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { callBridge, bridgeConfigured } from "@/lib/claude-bridge";
import type { BotQuestion } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM =
  "You design Georgian (ka) requirements questionnaires for client discovery. " +
  "Return ONLY a JSON array of questions. Each question: " +
  "{id: string, text: string, type: 'single'|'multi'|'text', " +
  "options?: string[], allowOther?: boolean, hint?: string}. " +
  "12-18 questions. All text must be in Georgian (ka).";

export async function POST(req: NextRequest) {
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

  let brief: string | undefined;
  try {
    const body = (await req.json()) as { brief?: string };
    brief = body.brief;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!brief) {
    return NextResponse.json({ error: "brief required" }, { status: 400 });
  }

  if (!bridgeConfigured()) {
    return NextResponse.json(
      { error: "chat bridge not configured" },
      { status: 503 },
    );
  }

  // Route through the subscription-billed claude-bridge (same as the offer
  // drafter / sales chat) — no Anthropic API credits.
  let raw: string;
  try {
    raw = await callBridge({
      system: SYSTEM,
      messages: [{ role: "user", content: `Brief: ${brief}` }],
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
      },
      { status: 502 },
    );
  }

  const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);
  let questions: BotQuestion[];
  try {
    questions = JSON.parse(json) as BotQuestion[];
  } catch {
    return NextResponse.json({ error: "draft parse failed" }, { status: 502 });
  }

  return NextResponse.json({ questions });
}
