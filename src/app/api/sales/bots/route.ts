import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { listBotConfigs, createBotConfig, slugify } from "@/lib/bots/repo";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSalesAuth();
    return NextResponse.json({ bots: await listBotConfigs() });
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

export async function POST(req: NextRequest) {
  let salesUser: Awaited<ReturnType<typeof requireSalesAuth>>["salesUser"];
  try {
    ({ salesUser } = await requireSalesAuth());
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }

  let body: {
    client_name?: unknown;
    questions?: unknown;
    title?: unknown;
    intro?: unknown;
    language?: unknown;
    lead_id?: unknown;
    knowledge?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (
    typeof body?.client_name !== "string" ||
    !Array.isArray(body?.questions)
  ) {
    return NextResponse.json(
      { error: "client_name + questions required" },
      { status: 400 },
    );
  }

  const client_name = body.client_name;
  const slug = `${slugify(client_name)}-${randomBytes(3).toString("hex")}`;

  const bot = await createBotConfig({
    slug,
    client_name,
    title:
      typeof body.title === "string" ? body.title : `${client_name} — კითხვარი`,
    intro: typeof body.intro === "string" ? body.intro : null,
    language: typeof body.language === "string" ? body.language : "ka",
    questions: body.questions,
    lead_id: typeof body.lead_id === "string" ? body.lead_id : null,
    created_by: salesUser?.id ?? null,
    // When set, the bot becomes a bilingual FAQ/website bot answering from this
    // knowledge (and must capture contact) instead of the Georgian intake bot.
    knowledge:
      typeof body.knowledge === "string" && body.knowledge.trim()
        ? body.knowledge.trim()
        : null,
  });

  return NextResponse.json({ bot });
}
