// Vercel cron: outbound email campaigns.
//   /api/cron/campaigns   (see vercel.json)
// Gated by CRON_SECRET in production. SENDING is additionally gated by
// CAMPAIGNS_SENDING_ENABLED=true — until that is set, this only DRY-RUNS
// (counts candidates, sends nothing). Flip it on when you're ready to send.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runCampaigns } from "@/lib/campaign-sender";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

async function handle(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const auth = request.headers.get("authorization");
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    return NextResponse.json(
      { error: "Supabase env missing" },
      { status: 500 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY ?? "";
  const from =
    process.env.CAMPAIGNS_FROM ||
    process.env.SMTP_FROM ||
    "AllOne <team@allonelabs.com>";
  // Fail-safe default: OFF. Sending requires an explicit opt-in AND a key.
  const enabled =
    process.env.CAMPAIGNS_SENDING_ENABLED === "true" && apiKey.length > 0;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const summary = await runCampaigns(supabase, { enabled, apiKey, from });
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
