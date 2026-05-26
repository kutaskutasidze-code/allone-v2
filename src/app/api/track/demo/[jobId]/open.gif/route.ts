// Public email-open beacon. Logs an engagement event then returns a 1x1
// transparent GIF. No auth — recipient mail clients hit this directly.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  if (SUPABASE_URL && SUPABASE_SERVICE) {
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      await db.from("demo_engagements").insert({
        demo_job_id: jobId,
        event_type: "email_open",
        metadata: {
          ua: request.headers.get("user-agent"),
          ip: request.headers.get("x-forwarded-for"),
        },
      });
    } catch {
      // Don't let logging failures block the pixel response.
    }
  }
  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(TRANSPARENT_GIF.length),
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
