import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import type { BotQuestion } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const msg = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system:
      "You design Georgian (ka) requirements questionnaires for client discovery. " +
      "Return ONLY a JSON array of questions. Each question: " +
      "{id: string, text: string, type: 'single'|'multi'|'text', " +
      "options?: string[], allowOther?: boolean, hint?: string}. " +
      "12-18 questions. All text must be in Georgian (ka).",
    messages: [{ role: "user", content: `Brief: ${brief}` }],
  });

  const block = msg.content.find((b) => b.type === "text");
  const raw = block && "text" in block ? block.text : "[]";
  const json = raw.slice(raw.indexOf("["), raw.lastIndexOf("]") + 1);

  let questions: BotQuestion[];
  try {
    questions = JSON.parse(json) as BotQuestion[];
  } catch {
    return NextResponse.json({ error: "draft parse failed" }, { status: 502 });
  }

  return NextResponse.json({ questions });
}
