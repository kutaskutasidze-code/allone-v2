// Shared chat message shape used by both /api/sales/chat and the cloner
// chat. Kept narrower than Anthropic's MessageParam (string-only content)
// because both consumers fan out tool-use blocks on their own.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
