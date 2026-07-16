import { createAdminClient } from "@/lib/supabase/admin";
import type { BotConfig, QuestionnaireResponse } from "./types";

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
