import { createAdminClient } from "@/lib/supabase/admin";
import type { BotConfig, BotSession, QuestionnaireResponse } from "./types";

/** Hidden opening seed — not a real visitor turn, so it never counts toward
 *  `turns` and is stripped before a rep reads the transcript. */
export const SEED_PREFIX = "(ვიზიტორმა";

/** Cap on what we persist per session, mirroring the submit-route limits so a
 *  known slug can't be used to bloat the table. */
const MAX_TURNS_STORED = 200;
const MAX_CONTENT_CHARS = 8000;

export function sanitizeTranscript(
  messages: unknown,
): { role: string; content: string }[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        typeof (m as { role?: unknown })?.role === "string" &&
        typeof (m as { content?: unknown })?.content === "string",
    )
    .slice(0, MAX_TURNS_STORED)
    .map((m) => ({
      role: String((m as { role: string }).role),
      content: String((m as { content: string }).content).slice(
        0,
        MAX_CONTENT_CHARS,
      ),
    }));
}

/** Real visitor turns, excluding the hidden opening seed. */
export function countRealTurns(
  transcript: { role: string; content: string }[],
): number {
  return transcript.filter(
    (m) => m.role === "user" && !m.content.startsWith(SEED_PREFIX),
  ).length;
}

/** Stable URL slug; non-latin titles fall back to a generic stem. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "bot";
}

export function buildResponseRow(
  botSlug: string,
  leadId: string | null,
  clientName: string | null,
  answers: Record<string, string | string[]>,
  userAgent: string | null,
  transcript?: { role: string; content: string }[] | null,
) {
  const respondent =
    typeof answers.respondent === "string"
      ? answers.respondent.slice(0, 200)
      : null;
  return {
    bot_slug: botSlug,
    lead_id: leadId,
    client_name: clientName,
    respondent_name: respondent,
    answers,
    user_agent: userAgent?.slice(0, 500) ?? null,
    transcript: transcript ?? null,
  };
}

export async function getBotConfigBySlug(
  slug: string,
): Promise<BotConfig | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_configs")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as BotConfig) ?? null;
}

export async function listBotConfigs(): Promise<BotConfig[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_configs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as BotConfig[]) ?? [];
}

export async function createBotConfig(input: {
  slug: string;
  client_name: string;
  title: string;
  intro: string | null;
  language: string;
  questions: unknown;
  lead_id: string | null;
  created_by: string | null;
  knowledge?: string | null;
}): Promise<BotConfig> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_configs")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as BotConfig;
}

export async function insertResponse(
  row: ReturnType<typeof buildResponseRow>,
): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("questionnaire_responses")
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function getResponse(
  id: string,
): Promise<QuestionnaireResponse | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("questionnaire_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as QuestionnaireResponse) ?? null;
}

/**
 * Save the conversation so far. Called on every turn, so an abandoned chat is
 * still readable by the sales team and resumable by the visitor.
 *
 * `sessionId` is minted by the client; we upsert on it rather than insert so a
 * refresh continues the same row instead of spawning duplicates. Returns the
 * session id, or null if the write failed — persistence is best-effort and must
 * never break the conversation itself.
 */
export async function saveSession(input: {
  sessionId: string;
  botSlug: string;
  leadId: string | null;
  clientName: string | null;
  transcript: { role: string; content: string }[];
  userAgent?: string | null;
}): Promise<string | null> {
  const db = createAdminClient();
  const transcript = sanitizeTranscript(input.transcript);
  const { error } = await db.from("bot_sessions").upsert(
    {
      id: input.sessionId,
      bot_slug: input.botSlug,
      lead_id: input.leadId,
      client_name: input.clientName,
      transcript,
      turns: countRealTurns(transcript),
      user_agent: input.userAgent?.slice(0, 500) ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) {
    console.error("[bots] session save failed", error);
    return null;
  }
  return input.sessionId;
}

/** Link a completed session to the response row it produced. */
export async function closeSession(
  sessionId: string,
  responseId: string,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("bot_sessions")
    .update({ response_id: responseId, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) console.error("[bots] session close failed", error);
}

export async function getSession(id: string): Promise<BotSession | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("bot_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as BotSession) ?? null;
}

/**
 * Sessions that never produced a response — someone started answering and
 * dropped off. `minTurns` filters out the tyre-kickers who opened the link and
 * typed nothing useful.
 */
export async function listAbandonedSessions(opts?: {
  botSlug?: string;
  minTurns?: number;
  limit?: number;
}): Promise<BotSession[]> {
  const db = createAdminClient();
  let q = db
    .from("bot_sessions")
    .select("*")
    .is("response_id", null)
    .gte("turns", opts?.minTurns ?? 1)
    .order("updated_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.botSlug) q = q.eq("bot_slug", opts.botSlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data as BotSession[]) ?? [];
}

export async function listResponses(
  botSlug?: string,
): Promise<QuestionnaireResponse[]> {
  const db = createAdminClient();
  let q = db
    .from("questionnaire_responses")
    .select("*")
    .order("completed_at", { ascending: false });
  if (botSlug) q = q.eq("bot_slug", botSlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data as QuestionnaireResponse[]) ?? [];
}
