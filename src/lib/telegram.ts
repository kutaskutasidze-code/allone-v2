// Telegram Bot API wrapper. Single bot for the team; chat_ids bound per
// sales_user via the /api/telegram/connect → bot /start handshake.
//
// Env:
//   TELEGRAM_BOT_TOKEN      bot token from @BotFather
//   TELEGRAM_BOT_USERNAME   bot username (without @), used to build deep links
//   TELEGRAM_WEBHOOK_SECRET random string; webhook verifies via the
//                           secret_token header Telegram echoes back.

const API = "https://api.telegram.org";

export interface SendMessageOpts {
  chatId: string;
  text: string;
  parseMode?: "MarkdownV2" | "HTML";
  disablePreview?: boolean;
}

export interface SendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
}

export function isTelegramConfigured(): boolean {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME,
  );
}

export function botToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN ?? "";
}

export function botUsername(): string {
  return process.env.TELEGRAM_BOT_USERNAME ?? "";
}

export function webhookSecret(): string {
  return process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
}

export function deepLink(connectToken: string): string {
  const name = botUsername();
  return `https://t.me/${name}?start=${encodeURIComponent(connectToken)}`;
}

export async function sendMessage(opts: SendMessageOpts): Promise<SendResult> {
  const token = botToken();
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN not set" };

  try {
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: opts.chatId,
        text: opts.text,
        parse_mode: opts.parseMode ?? "HTML",
        disable_web_page_preview: opts.disablePreview ?? true,
      }),
    });
    const json = (await res.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };
    if (!json.ok) {
      return { ok: false, error: json.description ?? "unknown" };
    }
    return { ok: true, messageId: json.result?.message_id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// HTML-escape free-form text before embedding in an HTML-parsed message.
export function escapeHTML(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
