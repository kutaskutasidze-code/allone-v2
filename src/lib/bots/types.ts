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
}

/** Shape sent to the public bot page (no internal columns). */
export type PublicBotConfig = Pick<
  BotConfig,
  "slug" | "title" | "intro" | "language" | "questions"
>;

export interface QuestionnaireResponse {
  id: string;
  bot_slug: string;
  lead_id: string | null;
  client_name: string | null;
  respondent_name: string | null;
  answers: Record<string, string | string[]>;
  completed_at: string;
}
