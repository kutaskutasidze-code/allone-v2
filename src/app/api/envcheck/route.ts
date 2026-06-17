import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// TEMPORARY diagnostic — booleans only, no values. Removed after diagnosis.
export async function GET() {
  return NextResponse.json({
    has_bridge_url: !!process.env.CLAUDE_BRIDGE_URL,
    bridge_url_len: (process.env.CLAUDE_BRIDGE_URL || "").length,
    has_bridge_token: !!process.env.CLAUDE_BRIDGE_TOKEN,
    has_offer_url: !!process.env.OFFER_API_URL,
    has_supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    node_env: process.env.NODE_ENV ?? null,
  });
}
