// Vercel cron entry for all scheduled sales notifications.
//   /api/cron/notifications?kind=daily_aim       (Mon-Fri 09:00 Tbilisi = 05:00 UTC)
//   /api/cron/notifications?kind=daily_report    (Mon-Fri 19:00 Tbilisi = 15:00 UTC)
//   /api/cron/notifications?kind=weekly_aim      (Mon 09:00 Tbilisi)
//   /api/cron/notifications?kind=weekly_report   (Sun 19:00 Tbilisi)
//   /api/cron/notifications?kind=monthly_aim     (1st 09:00 Tbilisi)
//   /api/cron/notifications?kind=monthly_report  (28th-31st 19:00 Tbilisi; route filters to actual last day)
//
// Gated by the CRON_SECRET header Vercel sets automatically on scheduled hits.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deliverScheduledRun, type MessageKind } from "@/lib/sales-notifier";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const CRON_SECRET = process.env.CRON_SECRET ?? "";

const VALID_KINDS: ReadonlySet<MessageKind> = new Set<MessageKind>([
  "daily_aim",
  "daily_report",
  "weekly_aim",
  "weekly_report",
  "monthly_aim",
  "monthly_report",
]);

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    return NextResponse.json(
      { error: "Supabase env missing" },
      { status: 500 },
    );
  }
  const kind = request.nextUrl.searchParams.get("kind") as MessageKind | null;
  if (!kind || !VALID_KINDS.has(kind)) {
    return NextResponse.json(
      { error: `Invalid kind: ${kind ?? "(none)"}` },
      { status: 400 },
    );
  }

  // Monthly report only fires on the actual last day of the month, even if the
  // cron schedule pings us every evening from the 28th onward.
  if (kind === "monthly_report" && !isLastDayOfMonthTbilisi()) {
    return NextResponse.json({ skipped: "not last day" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const summary = await deliverScheduledRun(supabase, kind);
  return NextResponse.json({ kind, ...summary });
}

function isLastDayOfMonthTbilisi(): boolean {
  // Compute "today in Tbilisi", check if its tomorrow is in the next month.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tbilisi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = fmt.format(new Date());
  const tomorrow = fmt.format(new Date(Date.now() + 86_400_000));
  return today.slice(0, 7) !== tomorrow.slice(0, 7);
}
