// Shared claude-bridge client for the offer-generator service. Routes Claude
// calls through the subscription-billed bridge (chat.allonelabs.com) instead
// of the Anthropic API, so demo enrichment/classification don't need API
// credits. POST {CLAUDE_BRIDGE_URL}/chat {system, messages} -> {text}.

export function bridgeConfigured(): boolean {
  return (
    (process.env.CLAUDE_BRIDGE_URL || "").length > 0 &&
    (process.env.CLAUDE_BRIDGE_TOKEN || "").length > 0
  );
}

export async function bridgeChat(
  system: string,
  userContent: string,
): Promise<string> {
  const url = process.env.CLAUDE_BRIDGE_URL || "";
  const token = process.env.CLAUDE_BRIDGE_TOKEN || "";
  if (!url || !token) throw new Error("claude bridge not configured");
  const res = await fetch(`${url.replace(/\/$/, "")}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      system,
      messages: [{ role: "user", content: userContent }],
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  let data: { text?: string; error?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`bridge bad json — ${text.slice(0, 200)}`);
  }
  if (!res.ok || typeof data.text !== "string") {
    throw new Error(data.error || `bridge HTTP ${res.status}`);
  }
  return data.text;
}
