import { callGeminiStructured, geminiConfigured } from "@/lib/gemini";
import { callBridge, bridgeConfigured } from "@/lib/claude-bridge";

// Conversation intelligence: turn a captured intake transcript into a compact
// brief a rep can act on — one summary line, the concrete needs, budget/timeline
// signals, objections/risks, sentiment, and the next best action.

export interface ConversationSummary {
  headline: string;
  needs: string[];
  budget_timeline: string | null;
  objections: string[];
  sentiment: "hot" | "warm" | "cool" | "unknown";
  next_step: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    needs: { type: "array", items: { type: "string" } },
    budget_timeline: { type: "string", nullable: true },
    objections: { type: "array", items: { type: "string" } },
    sentiment: { type: "string", enum: ["hot", "warm", "cool", "unknown"] },
    next_step: { type: "string" },
  },
  required: ["headline", "needs", "objections", "sentiment", "next_step"],
};

const SYSTEM = `You are a sales analyst. Read an intake conversation between a company's chatbot and a prospective client, plus the structured answers extracted from it. Produce a tight, factual brief for the sales rep who will follow up. Be specific and concrete; never invent facts not present. "headline" = one sentence a rep can read in 2 seconds. "needs" = the concrete things the client wants built/done. "budget_timeline" = any budget or deadline signal, else null. "objections" = hesitations, risks, or blockers (empty if none). "sentiment" = how ready-to-buy they read. "next_step" = the single best next action for the rep. Match the client's own wording where useful; the client may write in Georgian — you may answer in English.`;

function transcriptText(
  transcript: { role: string; content: string }[] | null | undefined,
  answers: Record<string, unknown>,
): string {
  const convo = (transcript ?? [])
    .filter((m) => m.content && m.role !== "system")
    .map((m) => `${m.role === "user" ? "Client" : "Bot"}: ${m.content}`)
    .join("\n");
  const ans = Object.entries(answers ?? {})
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");
  return `# Conversation\n${convo || "(no transcript captured)"}\n\n# Extracted answers\n${ans || "(none)"}`;
}

export async function summarizeConversation(
  transcript: { role: string; content: string }[] | null | undefined,
  answers: Record<string, unknown>,
): Promise<ConversationSummary> {
  const userText = transcriptText(transcript, answers);

  if (geminiConfigured()) {
    try {
      const out = (await callGeminiStructured({
        system: SYSTEM,
        userText,
        schema: SCHEMA,
      })) as ConversationSummary;
      return normalize(out);
    } catch {
      // fall through to bridge
    }
  }
  if (bridgeConfigured()) {
    const raw = await callBridge({
      system: `${SYSTEM}\n\nReturn ONLY minified JSON matching: {"headline":string,"needs":string[],"budget_timeline":string|null,"objections":string[],"sentiment":"hot"|"warm"|"cool"|"unknown","next_step":string}`,
      messages: [{ role: "user", content: userText }],
    });
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return normalize(JSON.parse(raw.slice(start, end + 1)));
    }
  }
  throw new Error("no LLM configured for conversation summary");
}

function normalize(o: Partial<ConversationSummary>): ConversationSummary {
  const s = o.sentiment;
  return {
    headline: String(o.headline ?? "").slice(0, 400),
    needs: Array.isArray(o.needs) ? o.needs.map(String).slice(0, 12) : [],
    budget_timeline: o.budget_timeline ? String(o.budget_timeline) : null,
    objections: Array.isArray(o.objections)
      ? o.objections.map(String).slice(0, 12)
      : [],
    sentiment: s === "hot" || s === "warm" || s === "cool" ? s : "unknown",
    next_step: String(o.next_step ?? "").slice(0, 400),
  };
}
