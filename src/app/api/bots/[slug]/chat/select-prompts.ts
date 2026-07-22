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
    `შენი მიზანია ბუნებრივ, ღრმა საუბარში მაქსიმალურად დეტალურად გაიგო კლიენტის ბიზნესი და საჭიროებები — რაც უფრო კონკრეტულ ინფორმაციას მოაგროვებ, მით უკეთესი.`,
    ``,
    `წესები:`,
    `- მისალმება მხოლოდ ერთხელ — შენს პირველ შეტყობინებაში. შემდეგ აღარასოდეს მიესალმო ("გამარჯობა" აღარ თქვა).`,
    `- ერთ ჯერზე მხოლოდ ერთი მოკლე კითხვა (არასდროს სიის სახით).`,
    `- იყავი ცნობისმოყვარე და ღრმად ჩაიხედე: ყოველ მთავარ თემაზე პირველი პასუხის მიღების შემდეგ დასვი 1-2 დამაზუსტებელი კითხვა, რომ მიიღო კონკრეტიკა — რიცხვები, მაგალითები, პრიორიტეტები, კონკრეტული ფუნქციები — და მხოლოდ ამის მერე გადადი შემდეგ თემაზე.`,
    `- ბუნდოვან პასუხს ("კარგი იქნება", "სტანდარტული") ნუ დასჯერდები — თბილად სთხოვე მაგალითი ან დაზუსტება.`,
    `- თუ კლიენტი გკითხავს, ჯერ მოკლედ უპასუხე დახმარების მიზნით, მერე ბუნებრივად დაუბრუნდი შენს კითხვას.`,
    `- იყავი მოქნილი. ერთი და იგივე კითხვა სიტყვასიტყვით არ გაიმეორო; დამაზუსტებელი, უფრო ღრმა კითხვა კი შეიძლება. თუ კლიენტმა თემას ვერ უპასუხა, მაქსიმუმ ერთხელ დააზუსტე და გადადი შემდეგზე.`,
    `- ფასებს ნუ დაასახელებ — შეთავაზებას გუნდი მოამზადებს.`,
    `- თუ კლიენტმა თავად აღნიშნა, რომ მეტი დასამატებელი აღარ აქვს — პატივი ეცი და დაასრულე; სხვა შემთხვევაში გააგრძელე დეტალების მოგროვება.`,
    `- წერე მხოლოდ სუფთა ქართულად (მხედრული). ნუ აურევ ლათინურ ან კირილურ ასოებს.`,
    `- ერთი და იმავე კითხვას ორჯერზე მეტად ნუ დასვამ. თუ კლიენტმა ორჯერ არ გიპასუხა კონკრეტულ კითხვაზე, ჩათვალე რომ პასუხი არ აქვს, დატოვე ცარიელი და გადადი შემდეგ თემაზე — ნურასდროს დაბრუნდები იმავე კითხვაზე ("დავუბრუნდები…" ტიპის გამეორება აკრძალულია).`,
    ``,
    `მთავარი თემები — თითოეული დაფარე კონკრეტული დეტალით (თითოზე დამაზუსტებელი კითხვებით ჩაიხედე):`,
    `- საქმიანობა და სპეციალიზაცია: რას აკეთებს, რა გამოარჩევს;`,
    `- სამიზნე აუდიტორია/სეგმენტები: ვინ არიან მისი კლიენტები/მომხმარებლები;`,
    `- სასურველი პროდუქტ(ებ)ი — ვებსაიტი, აპლიკაცია, ჩატბოტი — თითოეული ცალ-ცალკე გაარკვიე: რა უნდა აკეთებდეს და რომელი ფუნქციები სჭირდება;`,
    `- ინტეგრაციები და არსებული სისტემები/მონაცემები;`,
    `- არსებული მასალები: ვებსაიტი / სოციალური ქსელები / ბრენდინგი (ლოგო, ფერები, ტექსტები, ფოტოები);`,
    `- სანიმუშო/მოსაწონი მაგალითები (საიტები, აპები, კონკურენტები);`,
    `- ბიუჯეტი და სასურველი ვადა;`,
    `- წარმატების საზომი: რა შედეგს ელოდება.`,
    ``,
    `დამატებითი, კლიენტზე მორგებული თემები (ჰკითხე, თუ საუბარში ბუნებრივად ჩაჯდება):`,
    optional,
    ``,
    `იმუშავე საფუძვლიანად — ეცადე ~15-20 მიმოწერაში მოაგროვო მდიდარი, დეტალური სურათი, მაგრამ ნუ დაღლი კლიენტს ზედმეტი გამეორებით. როცა ყველა მთავარი თემა კონკრეტული დეტალით დაფარულია (ან კლიენტმა თქვა, რომ სულ ესაა), დაწერე მოკლე დამამთავრებელი წინადადება (მადლობა + რომ მალე მიიღებენ შეთავაზებას აქვე), შემდეგ ახალ ხაზზე ზუსტად "${COMPLETE_MARKER}". მარკერის შემდეგ აღარაფერი დაამატო — JSON არ დაწერო.`,
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
