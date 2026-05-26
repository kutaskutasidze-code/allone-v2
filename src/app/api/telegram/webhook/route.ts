// Public Telegram webhook. Configure once via:
//   curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
//        -d "url=https://allonelabs.com/api/telegram/webhook" \
//        -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
//
// Telegram echoes the secret_token via the X-Telegram-Bot-Api-Secret-Token
// header on every webhook call; we verify it before processing.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessage, webhookSecret, escapeHTML } from "@/lib/telegram";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

interface TelegramMessage {
  message_id: number;
  from?: { id: number; username?: string; first_name?: string };
  chat: { id: number; type: string };
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function POST(request: NextRequest) {
  // Verify secret token header
  const expected = webhookSecret();
  const got = request.headers.get("x-telegram-bot-api-secret-token");
  if (expected && got !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const msg = update.message;
  if (!msg || !msg.text || !SUPABASE_URL || !SUPABASE_SERVICE) {
    return NextResponse.json({ ok: true });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const text = msg.text.trim();
  const chatId = String(msg.chat.id);
  const username = msg.from?.username;

  // /start <token> — bind chat to sales_user
  if (text.startsWith("/start ")) {
    const token = text.slice("/start ".length).trim();
    const { data: row } = await db
      .from("notification_connect_tokens")
      .select("id, sales_user_id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (!row) {
      await sendMessage({
        chatId,
        text: "Invalid or expired connect link. Open Allone Sales → Connect Telegram to get a fresh one.",
      });
      return NextResponse.json({ ok: true });
    }
    if (row.used_at) {
      await sendMessage({
        chatId,
        text: "This connect link has already been used.",
      });
      return NextResponse.json({ ok: true });
    }
    if (new Date(row.expires_at) < new Date()) {
      await sendMessage({
        chatId,
        text: "This connect link expired. Click Connect Telegram again to get a fresh one.",
      });
      return NextResponse.json({ ok: true });
    }

    await db.from("notification_channels").upsert(
      {
        sales_user_id: row.sales_user_id,
        channel_type: "telegram",
        telegram_chat_id: chatId,
        telegram_username: username ?? null,
        is_active: true,
      },
      { onConflict: "sales_user_id,channel_type" },
    );

    await db
      .from("notification_connect_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

    const { data: user } = await db
      .from("sales_users")
      .select("name")
      .eq("id", row.sales_user_id)
      .maybeSingle();
    const greeting = user?.name
      ? `Hi ${escapeHTML(user.name.split(" ")[0])}`
      : "Connected";
    await sendMessage({
      chatId,
      text: `<b>${greeting}.</b>\n\nYou're connected to Allone Sales. I'll send:\n• 09:00 — daily aim\n• 19:00 — daily report\n• Mon 09:00 — weekly aim\n• Sun 19:00 — weekly report\n• 1st 09:00 — monthly aim\n• Last 19:00 — monthly report\n\nReply /disconnect to stop.`,
    });
    return NextResponse.json({ ok: true });
  }

  // /disconnect — unbind
  if (text === "/disconnect") {
    const { data: ch } = await db
      .from("notification_channels")
      .update({ is_active: false })
      .eq("telegram_chat_id", chatId)
      .select("id")
      .maybeSingle();
    await sendMessage({
      chatId,
      text: ch
        ? "Disconnected. You can reconnect anytime via /sales → Connect Telegram."
        : "No active connection found on this chat.",
    });
    return NextResponse.json({ ok: true });
  }

  // Anything else — short help.
  await sendMessage({
    chatId,
    text: "Send /disconnect to stop notifications, or reconnect via /sales → Connect Telegram.",
  });
  return NextResponse.json({ ok: true });
}
