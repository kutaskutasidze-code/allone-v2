// Public click-tracking redirect. Logs engagement then 302s to `?to=<url>`.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const to = request.nextUrl.searchParams.get("to");
  if (!to || !/^https?:\/\//i.test(to)) {
    return NextResponse.json(
      { error: "Missing or invalid ?to" },
      { status: 400 },
    );
  }

  if (SUPABASE_URL && SUPABASE_SERVICE) {
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await db.from("demo_engagements").insert({
        demo_job_id: jobId,
        event_type: "demo_view",
        metadata: {
          to,
          ua: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for"),
        },
      });
    } catch {
      // Don't block the redirect on logging failure.
    }
  }

  return NextResponse.redirect(to, { status: 302 });
}
