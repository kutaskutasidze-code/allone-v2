import { NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";

export async function POST() {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const { error } = await supabase
      .from("notification_channels")
      .update({ is_active: false })
      .eq("sales_user_id", salesUser.id)
      .eq("channel_type", "telegram");
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true });
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
