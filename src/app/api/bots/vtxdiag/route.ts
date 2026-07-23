import { NextResponse } from "next/server";
import { vertexConfigured, callGeminiStructured } from "@/lib/gemini";
import { selectSystemPrompts } from "@/app/api/bots/[slug]/chat/select-prompts";
import type { BotQuestion } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — runs the REAL production extraction (full schema)
// against a realistic transcript so we can see the exact error.
export async function GET() {
  const out: Record<string, unknown> = { vertexConfigured: vertexConfigured() };

  const questions: BotQuestion[] = [
    { id: "services", text: "?", type: "text" },
    { id: "patients", text: "?", type: "text" },
    { id: "budget", text: "?", type: "text" },
  ];
  const prompts = selectSystemPrompts({
    client_name: "Longevity Institute",
    intro: null,
    knowledge: null,
    questions,
  });
  out.schemaKeys = Object.keys(
    (prompts.schema as { properties?: object }).properties ?? {},
  ).length;
  out.schema = prompts.schema;

  const transcript =
    "კლიენტი: ჩვენ ვართ კლინიკა თბილისში, სერვისები: სკრინინგი. ბიუჯეტი 5000 ლარი, ვადა ორი თვე.";
  try {
    const ex = await callGeminiStructured({
      system: prompts.extraction,
      userText: `ტრანსკრიპტი:\n${transcript}`,
      schema: prompts.schema,
    });
    out.extraction = ex;
    out.extractionOk = true;
  } catch (err) {
    out.extractionOk = false;
    out.extractionError = err instanceof Error ? err.message : String(err);
  }
  return NextResponse.json(out);
}
