import { NextResponse } from "next/server";
import { vertexConfigured, callGeminiStructured } from "@/lib/gemini";
import { selectSystemPrompts } from "@/app/api/bots/[slug]/chat/select-prompts";
import type { BotQuestion } from "@/lib/bots/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — runs the REAL production extraction (full schema)
// against a realistic transcript so we can see the exact error.
export async function GET() {
  const out: Record<string, unknown> = { vertexConfigured: vertexConfigured() };

  const ids = [
    "services",
    "specialization",
    "patients",
    "products",
    "website_goal",
    "app_goal",
    "chatbot_goal",
    "booking",
    "patient_portal",
    "integrations",
    "data_sensitivity",
    "content_ready",
    "existing_site",
    "branding",
    "references",
    "languages",
    "budget",
    "timeline",
    "success",
  ];
  const questions: BotQuestion[] = ids.map((id) => ({
    id,
    text: "?",
    type: "text",
  }));
  const prompts = selectSystemPrompts({
    client_name: "Longevity Institute",
    intro: null,
    knowledge: null,
    questions,
  });
  out.schemaKeys = Object.keys(
    (prompts.schema as { properties?: object }).properties ?? {},
  ).length;
  out.schema = prompts.schema;

  // A long, detailed Georgian transcript — the kind "deep adaptive intake"
  // produces, and the kind that pushes the extraction output past 4096 tokens.
  const transcript = [
    "კლიენტი: ჩვენ ვართ Longevity Institute — პრევენციული და რეგენერაციული მედიცინის ცენტრი თბილისში, ვაკეში. დაარსდა 2023 წელს, 12 თანამშრომელი, 4 ექიმი.",
    "კლიენტი: სერვისები: სრული ბიომარკერული სკრინინგი 120+ მაჩვენებელი, ჰორმონული პროფილი, გენეტიკური ტესტირება, IV ვიტამინური თერაპია, NAD+ ინფუზიები, პერსონალური კვების და ვარჯიშის გეგმა, ძილის მონიტორინგი.",
    "კლიენტი: სამიზნე აუდიტორია 30-55 წლის შეძლებული პროფესიონალები, ტოპ-მენეჯერები, მეწარმეები. ასევე უცხოელი პაციენტები ისრაელიდან, ყაზახეთიდან.",
    "კლიენტი: გვინდა ვებსაიტი: მთავარი, სერვისების აღწერა, პაკეტების შედარება, ექიმების პროფილები, ბლოგი, ონლაინ ჩაწერა კალენდარით, პაციენტის კაბინეტი ანალიზებით. ორენოვანი ქართული-ინგლისური.",
    "კლიენტი: ინტეგრაციები: ლაბორატორიის სისტემა, CRM, SMS შეხსენებები, TBC ან BOG გადახდა, Google Calendar. ბრენდბუქი მზად გვაქვს. ბიუჯეტი 4000-6000 ლარი, ვადა ორი თვე.",
    "კლიენტი: კონკურენტები Vita Clinic, Regenerate Tbilisi. წარმატება: თვეში 50 ონლაინ ჩაწერა, უცხოელი პაციენტების წილის ზრდა.",
  ].join("\n");
  try {
    const ex = await callGeminiStructured({
      system: prompts.extraction,
      userText: `ტრანსკრიპტი:\n${transcript}`,
      schema: prompts.schema,
    });
    out.extraction = ex;
    out.extractionOk = true;
  } catch (err) {
    out.extractionOk = false;
    out.extractionError = err instanceof Error ? err.message : String(err);
  }
  return NextResponse.json(out);
}
