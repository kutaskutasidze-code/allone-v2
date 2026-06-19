import type { BotQuestion } from "@/lib/bots/types";
import {
  buildWebsiteConversationSystem,
  buildWebsiteExtractionSystem,
  buildWebsiteAnswersSchema,
} from "@/lib/bots/website-prompt";

// Single source of truth — imported by route.ts so detection and prompt text
// always use the same string.
export const COMPLETE_MARKER = "<<COMPLETE>>";

// Bridge fallback suffix for the Georgian intake path. Must remain byte-for-byte
// identical to the original so existing bots are unchanged when Gemini is down.
const GEORGIAN_BRIDGE_SUFFIX =
  "დააბრუნე მხოლოდ JSON ობიექტი: თითო კითხვის id→პასუხი ან null, ასევე current_website, social_links, brand_assets, business_description. JSON-ის გარდა აღარაფერი.";

// Bridge fallback suffix for the website (knowledge) path.
const WEBSITE_BRIDGE_SUFFIX =
  "Return ONLY a JSON object mapping each question id→answer or null, plus current_website, social_links, brand_assets, business_description, contact_name, contact_email, contact_phone. Nothing but JSON.";

function buildConversationSystem(
  clientName: string,
  intro: string | null,
  questions: BotQuestion[],
): string {
  const optional = questions
    .map((q, i) => {
      const opts = q.options?.length ? ` (მაგ.: ${q.options.join(" / ")})` : "";
      return `${i + 1}. ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `შენ ხარ AllOne-ის ინტეიქ-აგენტი "${clientName}"-ისთვის. საუბრობ ქართულად, თბილად და პროფესიონალურად.`,
    intro ? `კონტექსტი: ${intro}` : "",
    `შენი მიზანია ბუნებრივ საუბარში გაიგო კლიენტის ბიზნესი და საჭიროებები.`,
    ``,
    `წესები:`,
    `- მისალმება მხოლოდ ერთხელ — შენს პირველ შეტყობინებაში. შემდეგ აღარასოდეს მიესალმო ("გამარჯობა" აღარ თქვა).`,
    `- ერთ ჯერზე მხოლოდ ერთი მოკლე კითხვა (არასდროს სიის სახით).`,
    `- თუ კლიენტი გკითხავს, ჯერ მოკლედ უპასუხე დახმარების მიზნით, მერე ბუნებრივად დაუბრუნდი შენს კითხვას.`,
    `- იყავი მოქნილი. თუ კლიენტმა კონკრეტულ კითხვას არ უპასუხა, მაქსიმუმ ერთხელ ჰკითხე ხელახლა — მერე გადადი შემდეგ თემაზე. არასოდეს გაიმეორო ერთი და იგივე კითხვა რამდენჯერმე.`,
    `- ფასებს ნუ დაასახელებ — შეთავაზებას გუნდი მოამზადებს.`,
    `- თუ კლიენტმა ერთ შეტყობინებაში რამდენიმე მთავარი თემა ერთად მოგაწოდა, ან აღნიშნა რომ მეტი დასამატებელი არ აქვს — ნუ დასვამ დამატებით კითხვებს და პირდაპირ დაასრულე.`,
    `- წერე მხოლოდ სუფთა ქართულად (მხედრული). ნუ აურევ ლათინურ ან კირილურ ასოებს.`,
    ``,
    `მთავარი (აუცილებელი) თემები — ეცადე, რომ დაფარო:`,
    `- რა სჭირდება (პროდუქტი/სეგმენტი) და რა საქმიანობს;`,
    `- მთავარი სასურველი ფუნქციონალი;`,
    `- ბიუჯეტი და სასურველი ვადა;`,
    `- არსებული მასალები: ვებსაიტი / სოციალური ქსელები / ბრენდინგი (ლოგო, ფერები) — ან მოკლე აღწერა, თუ არაფერი აქვს.`,
    ``,
    `დამატებითი თემები (სურვილისამებრ, ყველა არ არის სავალდებულო — ჰკითხე მხოლოდ, თუ საუბარში ბუნებრივად ჩაჯდება):`,
    optional,
    ``,
    `როცა მთავარი თემები დაფარულია, ნუ გააჭიანურებ — ეცადე, ~6-8 მიმოწერაში დაასრულო. დასასრულებლად: დაწერე მოკლე დამამთავრებელი წინადადება (მადლობა + რომ მალე მიიღებენ შეთავაზებას აქვე), შემდეგ ახალ ხაზზე ზუსტად "${COMPLETE_MARKER}". მარკერის შემდეგ აღარაფერი დაამატო — JSON არ დაწერო.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildExtractionSystem(questions: BotQuestion[]): string {
  const list = questions
    .map((q) => {
      const opts = q.options?.length
        ? ` — ვარიანტები (მხოლოდ მინიშნებად): ${q.options.join(" / ")}`
        : "";
      return `[${q.id}] ${q.text}${opts}`;
    })
    .join("\n");
  return [
    `შენ ხარ მონაცემთა ექსტრაქტორი. ქვემოთ მოცემულია ინტეიქ-საუბრის ტრანსკრიპტი კლიენტსა და აგენტს შორის. ამოიღე მხოლოდ ის, რაც კლიენტმა *რეალურად* თქვა.`,
    ``,
    `მკაცრი წესები:`,
    `- თუ თემა საუბარში არ განხილულა ან კლიენტს არ უპასუხია — დააბრუნე null (social_links-ისთვის ცარიელი მასივი []).`,
    `- არასოდეს გამოიგონო, არ ჩასვა ნაგულისხმევი მნიშვნელობა და არ მიუსადაგო უახლოეს ვარიანტს.`,
    `- შეინახე კლიენტის ნამდვილი, კონკრეტული პასუხი მისივე სიტყვებით (მაგ. ბიუჯეტი "2000 ₾", ვადა "3 კვირა") — არა დიაპაზონი ან კატეგორია.`,
    `- ვარიანტები მხოლოდ მინიშნებაა შენთვის — არ ჩათვალო პასუხად.`,
    ``,
    `კითხვები:`,
    list,
  ].join("\n");
}

function buildAnswersSchema(questions: BotQuestion[]): object {
  const properties: Record<string, object> = {};
  for (const q of questions) {
    properties[q.id] = { type: "STRING", nullable: true };
  }
  properties.current_website = { type: "STRING", nullable: true };
  properties.social_links = { type: "ARRAY", items: { type: "STRING" } };
  properties.brand_assets = { type: "STRING", nullable: true };
  properties.business_description = { type: "STRING", nullable: true };
  return { type: "OBJECT", properties };
}

// Pick conversation + extraction prompts by bot type. A bot with a `knowledge`
// block is the public website bot (FAQ-aware, bilingual, contact-capturing);
// without it we keep the exact existing Georgian intake path.
export function selectSystemPrompts(cfg: {
  client_name: string;
  intro: string | null;
  knowledge: string | null;
  questions: BotQuestion[];
}): {
  conversation: string;
  extraction: string;
  schema: object;
  bridgeSuffix: string;
} {
  const questions = cfg.questions ?? [];
  if (cfg.knowledge && cfg.knowledge.trim()) {
    return {
      conversation: buildWebsiteConversationSystem(
        cfg.client_name,
        cfg.intro,
        cfg.knowledge,
        questions,
      ),
      extraction: buildWebsiteExtractionSystem(questions),
      schema: buildWebsiteAnswersSchema(questions),
      bridgeSuffix: WEBSITE_BRIDGE_SUFFIX,
    };
  }
  return {
    conversation: buildConversationSystem(
      cfg.client_name,
      cfg.intro,
      questions,
    ),
    extraction: buildExtractionSystem(questions),
    schema: buildAnswersSchema(questions),
    bridgeSuffix: GEORGIAN_BRIDGE_SUFFIX,
  };
}
