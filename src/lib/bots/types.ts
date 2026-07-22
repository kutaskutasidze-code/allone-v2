export const OTHER_LABEL = "სხვა (ჩაწერეთ)";

export type QuestionType = "single" | "multi" | "text";

export interface BotQuestion {
  id: string;
  text: string;
  hint?: string;
  type: QuestionType;
  options?: string[];
  allowOther?: boolean;
}

export interface BotConfig {
  id: string;
  slug: string;
  client_name: string;
  title: string;
  intro: string | null;
  language: string;
  questions: BotQuestion[];
  lead_id: string | null;
  active: boolean;
  created_at: string;
  /** Optional FAQ/knowledge block. When present, the /chat route runs the
   *  FAQ-aware bilingual website bot instead of the Georgian intake bot. */
  knowledge: string | null;
}

/** Shape sent to the public bot page (no internal columns). */
export type PublicBotConfig = Pick<
  BotConfig,
  "slug" | "title" | "intro" | "language" | "questions"
>;

/** A live (or abandoned) intake conversation, saved on every turn so an
 *  unfinished chat is never lost. `response_id` is set only once the session
 *  completes; NULL means still open or abandoned. */
export interface BotSession {
  id: string;
  bot_slug: string;
  lead_id: string | null;
  client_name: string | null;
  transcript: { role: string; content: string }[];
  turns: number;
  response_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponse {
  id: string;
  bot_slug: string;
  lead_id: string | null;
  client_name: string | null;
  respondent_name: string | null;
  answers: Record<string, string | string[]>;
  completed_at: string;
}
