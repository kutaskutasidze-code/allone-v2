import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const KNOWLEDGE = `ALLONE — AI გადაწყვეტილებები ბიზნესისთვის, თბილისი.
4-ეტაპიანი სერვისი: კონსულტაცია, დაგეგმვა, განხორციელება, მხარდაჭერა.
პროდუქტები: ხმოვანი ასისტენტები, ჩათბოტები, ავტომატიზაცია.
ფასი: $300 თვეში კლიენტზე. მარჟა 65%. მეორე თვიდან მოგებიანი.
პირველი წლის შემოსავალი: $444,300. წმინდა მოგება: $195,706.
ინვესტიცია: $1.24M ჯამი 40% წილისთვის, 3 ეტაპად ($40K, $200K, $1M).
3 წელში: 700+ კლიენტი, $2.5M შემოსავალი.`;

const PHONE_PROMPT = `შენ ხარ Allone AI-ის ხმოვანი ასისტენტი. ტელეფონით საუბრობ.

${KNOWLEDGE}

წესები:
- უპასუხე ძალიან მოკლედ, მაქსიმუმ 1 წინადადებით
- სუფთა ქართულით
- იყავი თბილი და მეგობრული
- ნუ ჩამოთვლი — ერთი მთავარი პასუხი მიეცი`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function getAIResponse(messages: ChatMessage[]): Promise<string> {
  if (GEMINI_API_KEY) {
    const contents = [];
    for (const msg of messages) {
      if (msg.role === 'system') {
        contents.push({ role: 'user', parts: [{ text: msg.content }] });
        contents.push({ role: 'model', parts: [{ text: 'გასაგებია.' }] });
      } else {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    for (let i = 0; i < 2; i++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents, generationConfig: { temperature: 0.5, maxOutputTokens: 60 } }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
        if (res.status === 429 && i === 0) { await new Promise(r => setTimeout(r, 2000)); continue; }
      } catch {}
      break;
    }
  }
  if (GROQ_API_KEY) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.5, max_tokens: 60 }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch {}
  }
  return 'ბოდიშით, ტექნიკური ხარვეზია.';
}

function ttsUrl(host: string, protocol: string, text: string): string {
  return `${protocol}://${host}/api/allone-ai/tts-play?text=${encodeURIComponent(text)}`;
}

function twiml(xml: string): NextResponse {
  return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get('status')) return twiml('<Response/>');

  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') as string | null;
  const callSid = formData.get('CallSid') as string || 'unknown';

  let history: ChatMessage[] = [];
  const hp = url.searchParams.get('h');
  if (hp) { try { history = JSON.parse(Buffer.from(hp, 'base64url').toString()); } catch {} }

  const host = request.headers.get('host') || 'www.allone.ge';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const base = `${protocol}://${host}/api/allone-ai/twilio-webhook`;

  if (!speechResult) {
    // First turn — greeting
    const greeting = 'გამარჯობა! მე ვარ Allone-ის ასისტენტი. რით დაგეხმაროთ?';
    const h = Buffer.from(JSON.stringify([{ role: 'assistant', content: greeting }])).toString('base64url');
    console.log(`[voice] ${callSid} greeting`);

    return twiml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${ttsUrl(host, protocol, greeting)}</Play>
  <Gather input="speech" language="ka-GE" speechTimeout="auto" action="${base}?h=${h}" method="POST"/>
  <Play>${ttsUrl(host, protocol, 'ვერ მოვისმინე. ნახვამდის!')}</Play>
</Response>`);
  }

  // Got speech — get AI response
  console.log(`[voice] ${callSid} user: "${speechResult}"`);

  const messages: ChatMessage[] = [
    { role: 'system', content: PHONE_PROMPT },
    ...history.slice(-6),
    { role: 'user', content: speechResult },
  ];

  const aiText = (await getAIResponse(messages)).replace(/\[ACTION:[\w_:]+\]/g, '').trim();
  console.log(`[voice] ${callSid} ai: "${aiText.slice(0, 80)}"`);

  const newHistory = [
    ...history.slice(-4),
    { role: 'user' as const, content: speechResult },
    { role: 'assistant' as const, content: aiText },
  ];
  const h = Buffer.from(JSON.stringify(newHistory)).toString('base64url');
  const actionUrl = `${base}?h=${h}`.length > 3500
    ? `${base}?h=${Buffer.from(JSON.stringify(newHistory.slice(-4))).toString('base64url')}`
    : `${base}?h=${h}`;

  return twiml(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${ttsUrl(host, protocol, aiText)}</Play>
  <Gather input="speech" language="ka-GE" speechTimeout="auto" action="${actionUrl}" method="POST"/>
  <Play>${ttsUrl(host, protocol, 'მადლობა ზარისთვის, ნახვამდის!')}</Play>
</Response>`);
}

export async function GET(request: NextRequest) {
  return POST(request);
}
