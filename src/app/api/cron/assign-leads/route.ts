// Vercel cron: auto-assign the unowned `new` lead pool by specialty.
//   /api/cron/assign-leads   (see vercel.json)
// Gated by CRON_SECRET in production; open on localhost for testing.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { assignNewLeadPool } from "@/lib/lead-assignment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // Cap per run so a single invocation stays well under maxDuration; the cron
  // drains the backlog gradually across runs.
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "500");
  const summary = await assignNewLeadPool(supabase, limit);
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
