import { z } from "zod";
import { callBridge } from "@/lib/claude-bridge";
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
- Set confidence low if the CV is thin, unparseable, or the fit is genuinely borderline.

You MUST respond with ONLY a valid JSON object matching this schema (no prose, no markdown fences):
{
  "score": <number 0-100>,
  "decision": <"meeting"|"reject">,
  "confidence": <number 0.0-1.0>,
  "language": <ISO-639-1 code, e.g. "en">,
  "strengths": [<string>, ...],
  "gaps": [<string>, ...],
  "rationale": <string>,
  "emailSubject": <string>,
  "emailBody": <string>
}`;

export async function evaluateCandidate(args: {
  vacancy: Vacancy;
  cvText: string;
  note?: string | null;
  projects?: string | null;
}): Promise<Verdict> {
  const userContent = [
    `# Role: ${args.vacancy.title}`,
    `## Job description\n${args.vacancy.description_md ?? "(none provided)"}`,
    `## Candidate CV (extracted text)\n${args.cvText.slice(0, 24000)}`,
    args.note ? `## Candidate note ("how you use AI")\n${args.note}` : "",
    args.projects ? `## Candidate projects\n${args.projects}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await callBridge({
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });

  // Strip markdown fences if the model wraps the JSON anyway
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(
      `evaluateCandidate: bridge returned non-JSON — ${(e as Error).message} — raw: ${cleaned.slice(0, 200)}`,
    );
  }

  const result = VerdictSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `evaluateCandidate: schema mismatch — ${result.error.message}`,
    );
  }
  return result.data;
}
