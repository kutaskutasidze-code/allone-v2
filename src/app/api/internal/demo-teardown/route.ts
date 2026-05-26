// Vercel cron endpoint — forwards to offer-generator's internal teardown pass.
// Authorized by the CRON_SECRET header Vercel automatically sets on cron pings.
// Configured in vercel.json under crons.

import { NextRequest, NextResponse } from "next/server";

const OFFER_API_URL = process.env.OFFER_API_URL || "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: NextRequest) {
  // Vercel cron jobs include this header automatically. Reject anything else.
  const auth = request.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${OFFER_API_URL}/api/internal/teardown`, {
      method: "POST",
      headers: { Authorization: `Bearer ${OFFER_API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
