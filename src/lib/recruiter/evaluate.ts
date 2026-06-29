import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { recruiterConfig } from "./config";
import type { Verdict, Vacancy } from "./types";

export const VerdictSchema = z.object({
  score: z.number().min(0).max(100),
  decision: z.enum(["meeting", "reject"]),
  confidence: z.number().min(0).max(1),
  language: z.string(), // ISO-639-1, e.g. "en", "ka"
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  rationale: z.string(),
  emailSubject: z.string(),
  emailBody: z.string(),
});

const SYSTEM = `You are a hiring screener for AllOne, an AI company in Tbilisi.
Score the candidate against the role's job description. Be specific and fair.
- "meeting" only if they clearly merit an interview; otherwise "reject".
- Detect the language the candidate wrote in and set "language" to its ISO-639-1 code.
- Write emailSubject/emailBody IN THAT LANGUAGE: a warm meeting-interest note (no times — a human will propose them) for "meeting", or a brief, kind rejection for "reject".
- Set confidence low if the CV is thin, unparseable, or the fit is genuinely borderline.`;

export async function evaluateCandidate(args: {
  vacancy: Vacancy;
  cvText: string;
  note?: string | null;
  projects?: string | null;
}): Promise<Verdict> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const userContent = [
    `# Role: ${args.vacancy.title}`,
    `## Job description\n${args.vacancy.description_md ?? "(none provided)"}`,
    `## Candidate CV (extracted text)\n${args.cvText.slice(0, 24000)}`,
    args.note ? `## Candidate note ("how you use AI")\n${args.note}` : "",
    args.projects ? `## Candidate projects\n${args.projects}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await client.messages.parse({
    model: recruiterConfig.model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(VerdictSchema) },
  });

  if (!res.parsed_output) {
    throw new Error(
      `evaluateCandidate: no parsed output (stop_reason=${res.stop_reason})`,
    );
  }
  return res.parsed_output as Verdict;
}
