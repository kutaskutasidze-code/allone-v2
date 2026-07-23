import { NextResponse } from "next/server";
import {
  vertexConfigured,
  geminiConfigured,
  callGeminiStructured,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — reports what the Gemini module sees at runtime and
// attempts one Vertex-backed extraction. Delete after debugging.
export async function GET() {
  const out: Record<string, unknown> = {
    vertexConfigured: vertexConfigured(),
    geminiConfigured: geminiConfigured(),
    saEnvPresent: !!process.env.GEMINI_VERTEX_SA_JSON,
    saEnvLen: (process.env.GEMINI_VERTEX_SA_JSON || "").length,
    saStartsWithBrace: (process.env.GEMINI_VERTEX_SA_JSON || "").startsWith(
      "{",
    ),
    aiStudioKeys: [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ].filter(Boolean).length,
  };
  try {
    const ex = await callGeminiStructured({
      system: "Extract fields; null if unstated.",
      userText: "კლიენტი: ბიუჯეტი 5000 ლარი.",
      schema: {
        type: "OBJECT",
        properties: { budget: { type: "STRING", nullable: true } },
      },
    });
    out.extraction = ex;
    out.extractionOk = true;
  } catch (err) {
    out.extractionOk = false;
    out.extractionError = err instanceof Error ? err.message : String(err);
  }
  return NextResponse.json(out);
}
