import { NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeConversation } from "@/lib/conversation-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/sales/responses/[id]/summary
// Returns the AI conversation brief for an intake response, generating + caching
// it on first request (stored in questionnaire_responses.ai_summary).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSalesAuth();
    const { id } = await params;
    const db = createAdminClient();

    const { data, error } = await db
      .from("questionnaire_responses")
      .select("id, answers, transcript, ai_summary")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    if (data.ai_summary) {
      return NextResponse.json({ summary: data.ai_summary, cached: true });
    }

    const summary = await summarizeConversation(
      data.transcript as { role: string; content: string }[] | null,
      (data.answers ?? {}) as Record<string, unknown>,
    );
    // Cache it (best-effort — return it regardless of the write).
    await db
      .from("questionnaire_responses")
      .update({ ai_summary: summary })
      .eq("id", id);

    return NextResponse.json({ summary, cached: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "summary failed" },
      { status: 500 },
    );
  }
}
