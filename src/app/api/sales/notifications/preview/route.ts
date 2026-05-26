// Fire a one-off Telegram preview for the authenticated sales user, so they
// can verify the format end-to-end without waiting for the scheduled cron.
//
//   POST /api/sales/notifications/preview?kind=daily_aim

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { deliverScheduledRun, type MessageKind } from "@/lib/sales-notifier";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const VALID_KINDS: ReadonlySet<MessageKind> = new Set<MessageKind>([
  "daily_aim",
  "daily_report",
  "weekly_aim",
  "weekly_report",
  "monthly_aim",
  "monthly_report",
]);

export async function POST(request: NextRequest) {
  try {
    const { salesUser } = await requireSalesAuth();
    if (!SUPABASE_URL || !SUPABASE_SERVICE) {
      return NextResponse.json(
        { error: "Supabase env missing" },
        { status: 500 },
      );
    }
    const kind = (request.nextUrl.searchParams.get("kind") ??
      "daily_aim") as MessageKind;
    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json(
        { error: `Invalid kind: ${kind}` },
        { status: 400 },
      );
    }

    // Use the service-role client so the notifier can hit sales_users +
    // notification_channels regardless of the caller's RLS scope.
    const service = createSupabase(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const result = await deliverScheduledRun(service, kind, new Date(), {
      salesUserId: salesUser.id,
    });
    return NextResponse.json({ success: true, kind, ...result });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
