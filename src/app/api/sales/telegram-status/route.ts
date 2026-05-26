import { NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";

export async function GET() {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const { data } = await supabase
      .from("notification_channels")
      .select("telegram_username, is_active")
      .eq("sales_user_id", salesUser.id)
      .eq("channel_type", "telegram")
      .maybeSingle();
    return NextResponse.json({
      success: true,
      data: {
        connected: Boolean(data?.is_active),
        username: data?.telegram_username ?? null,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
