// Vercel cron entry for follow-up reminders.
//   /api/cron/followups   (every 5 min — see vercel.json)
//
// Scans open tasks whose due_at has passed and, once per task, creates an
// in-app notification for the owning rep and emails them. Gated by CRON_SECRET
// in production; open on localhost so the reminder can be triggered while
// testing (there is no cron runner in dev).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runFollowupReminders } from "@/lib/followup-reminders";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function handle(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    const auth = request.headers.get("authorization");
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    return NextResponse.json({ error: "Supabase env missing" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const summary = await runFollowupReminders(supabase);
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

// Allow POST too, so the reminder can be fired manually from a script/tool.
export async function POST(request: NextRequest) {
  return handle(request);
}
