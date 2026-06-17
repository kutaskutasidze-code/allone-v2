import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    bridge: !!process.env.CLAUDE_BRIDGE_URL && !!process.env.CLAUDE_BRIDGE_TOKEN,
    offer: !!process.env.OFFER_API_URL,
    supa: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
