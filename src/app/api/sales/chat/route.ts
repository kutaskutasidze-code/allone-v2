// Side-chat backend for the BF-shell side panel + chat-native /sales home.
// Calls the Anthropic HTTP API directly (no SDK dep needed in allone-website).

import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { fetchMetricEventsForUser } from "@/lib/sales-metric-events";
import { computeAllAims } from "@/lib/sales-aims";

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const body = (await request.json()) as { messages?: IncomingMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey) {
      return NextResponse.json({
        text: "Chat isn't configured — ANTHROPIC_API_KEY is missing on the deploy. Once it's set, ask me again and I'll have an answer.",
      });
    }

    const now = new Date();
    const events = await fetchMetricEventsForUser(supabase, salesUser.id, now);
    const todayAims = computeAllAims(events, now, "day");
    const weekAims = computeAllAims(events, now, "week");
    const monthAims = computeAllAims(events, now, "month");

    const system = [
      `You are the Allone Sales assistant. You help ${salesUser.name} (role ${(salesUser as { role?: string }).role ?? "sales"}) move leads through the pipeline and produce personalized demos.`,
      `Date: ${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tbilisi" })} (Asia/Tbilisi).`,
      ``,
      `Live numbers for this user (do not ask, just use them):`,
      formatAimsBrief(todayAims, weekAims, monthAims),
      ``,
      `When the user asks "what should I do today?", reply with a 3-bullet plan grounded in the numbers above + any aim where progress is < 50%.`,
      `Keep responses short and direct. Plain text, no markdown headers, no code blocks. Bullet points OK.`,
      `If asked to do something the platform can do (create a lead, send a demo email, generate a demo), tell the user the route they should click — you do not have tool access yet in v1.`,
    ].join("\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system,
        messages: messages.map((m) => ({
          role: m.role,
          content: String(m.content ?? ""),
        })),
      }),
    });
    const json = (await res.json()) as AnthropicResponse;

    if (!res.ok) {
      return NextResponse.json({
        text: `Anthropic returned ${res.status}: ${json.error?.message ?? "unknown error"}`,
      });
    }

    const text = (json.content ?? [])
      .map((b) => (b.type === "text" && b.text ? b.text : ""))
      .join("")
      .trim();

    return NextResponse.json({ text });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

function formatAimsBrief(
  day: ReturnType<typeof computeAllAims>,
  week: ReturnType<typeof computeAllAims>,
  month: ReturnType<typeof computeAllAims>,
): string {
  const fmt = (rows: ReturnType<typeof computeAllAims>, label: string) => {
    const lines = rows
      .map(
        (r) =>
          `  - ${r.metric}: aim ${r.aim}, actual ${r.actual} (${r.progress_pct}%)`,
      )
      .join("\n");
    return `${label}:\n${lines}`;
  };
  return [
    fmt(day, "Today"),
    fmt(week, "This week"),
    fmt(month, "This month"),
  ].join("\n\n");
}
