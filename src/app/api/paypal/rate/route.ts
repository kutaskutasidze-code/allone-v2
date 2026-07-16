import { NextResponse } from "next/server";
import { gelPerUsd } from "@/lib/paypal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The GEL→USD rate the in-chat payment is actually charged at. The client shows
// its USD estimate from this so it can't diverge from the server-side charge.
export async function GET() {
  return NextResponse.json({ gelPerUsd: gelPerUsd() });
}
