// Sales user clicks "Connect Telegram" → this endpoint issues a one-time
// token and returns a deep link. User taps the link, Telegram opens the bot
// with /start <token>, the webhook handler resolves the token to bind their
// chat_id to the sales_user row.

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { deepLink, isTelegramConfigured } from "@/lib/telegram";

export async function POST() {
  try {
    const { supabase, salesUser } = await requireSalesAuth();

    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { success: false, error: "Telegram bot not configured" },
        { status: 503 },
      );
    }

    const token = randomBytes(24).toString("base64url");
    const { error } = await supabase
      .from("notification_connect_tokens")
      .insert({
        sales_user_id: salesUser.id,
        channel_type: "telegram",
        token,
      });
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: deepLink(token),
        token,
        expires_in_minutes: 15,
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
