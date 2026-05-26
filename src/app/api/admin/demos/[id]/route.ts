import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;

    const { data: job, error } = await supabase
      .from("demo_jobs")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !job) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }

    let draft = null;
    if (job.email_draft_id) {
      const { data } = await supabase
        .from("email_drafts")
        .select("*")
        .eq("id", job.email_draft_id)
        .maybeSingle();
      draft = data ?? null;
    }

    return NextResponse.json({ success: true, data: { ...job, draft } });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
