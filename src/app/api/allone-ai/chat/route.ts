import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const COMPANY_KNOWLEDGE = `
ALLONE — ხელოვნური ინტელექტის გადაწყვეტილებები და ციფრული ტრანსფორმაცია | თბილისი, საქართველო
ვებგვერდი: allone.ge

=== რა არის Allone ===
ქართული AI კომპანია, რომელიც ბიზნესებს ეხმარება ხელოვნური ინტელექტის დანერგვასა და ციფრულ განვითარებაში.
ვაკეთებთ კონსულტაციას, ვქმნით ვებსაიტებს, AI სისტემებს და ვმართავთ ბრენდის ციფრულ სტრატეგიას.
თითქოს საკონსულტაციო ფირმა + IT დეპარტამენტი — პროექტზე $2,500-დან.

=== სერვისები ===
4-ეტაპიანი ტექნოლოგიური სერვისი:
1. კონსულტაცია — ბიზნეს-პროცესების ანალიზი და AI სტრატეგიის დაგეგმვა
2. დაგეგმვა — ბრენდ-სტრატეგია, UI/UX დიზაინი და არქიტექტურა
3. შესრულება — ვებსაიტების (Next.js), AI აგენტებისა და ავტომატიზაციების აწყობა
4. მხარდაჭერა — სისტემების მართვა, განახლება და ზრდა — ყოველთვიურად

=== პროდუქტები ===
- ვებსაიტების დეველოპმენტი: თანამედროვე, სწრაფი Next.js საიტები SEO ოპტიმიზაციით.
- ხმოვანი აგენტები: AI პასუხობს ტელეფონზე, ჯავშნის შეხვედრებს — 24/7.
- ჭკვიანი ჩატბოტები: AI გაწვრთნილი ბიზნეს-დოკუმენტებსა და ცოდნის ბაზაზე.
- ავტომატიზაციები: AI ამუშავებს მონაცემებს და ზოგავს 130+ საათს თვეში.
- ბრენდ სტრატეგია: ციფრული იდენტობის შექმნა და პოზიციონირება.

=== ფასწარმოქმნა ===
პროექტზე დაფუძნებული მოდელი:
- საშუალო პროექტის ფასი: $2,500–$4,500 (მოიცავს ვებსაიტს + AI ინტეგრაციას)
- მხარდაჭერა (Retainer): $600/თვე-დან
- ინფრასტრუქტურა + API: ~5–10% პროექტის ღირებულებიდან

=== ფინანსური მაჩვენებლები ===
- წელი 1 შემოსავალი: $169,500 (51 პროექტი)
- წელი 1 EBITDA: $40,360
- წელი 2 შემოსავალი: $733,500
- 2-წლიანი ჯამური შემოსავალი: $903,000
- EBITDA დადებითი მე-6 თვიდან
- 8 პროექტი/თვე — მე-12 თვეში

=== გაყიდვების სტრატეგია ===
- აჩვენე, ნუ ხსნი — ცოცხალი დემო კონკრეტული სცენარით
- ერთი პროექტი = 130+ საათის დაზოგვა თვეში
- 7 დღეში არ მუშაობს? თვე უკან — რისკის გარეშე

=== ინვესტიცია ===
$240K სულ, 25% წილი — 2 ეტაპად:
- ეტაპი 1 (ახლა): $40K — 10% წილი (ოფისი, გაყიდვები, ტექ. გუნდი)
- ეტაპი 2 (დადასტურების შემდეგ): $200K — 15% წილი (სერვერები + გუნდის გაფართოება)
- ინვესტიციის ანაზღაურება: მე-19 თვე

=== კონტაქტი ===
ქალაქი: თბილისი, საქართველო
ვებგვერდი: allone.ge
`;

const SYSTEM_PROMPT = `შენ ხარ Allone AI — კომპანია Allone-ის ხელოვნური ინტელექტის ასისტენტი.

შენი როლი:
- კომპანიის შესახებ ინფორმაციის მიწოდება
- კლიენტებისა და დაინტერესებული პირების კითხვებზე პასუხი
- ბუნებრივი, პროფესიონალური და თბილი კომუნიკაცია

კონტექსტი კომპანიის შესახებ:
${COMPANY_KNOWLEDGE}

წესები:
- ყოველთვის უპასუხე სუფთა, გრამატიკულად სწორი ქართულით
- არასოდეს გამოიყენო ინგლისური სიტყვების ტრანსლიტერაცია (მაგ: "ვორკფლოუ", "სმარტი", "დებაგინგი") — გამოიყენე ქართული შესატყვისები
- იყავი კონკრეტული — გამოიყენე ზუსტი რიცხვები მონაცემებიდან
- ნუ მოიგონებ ინფორმაციას რომელიც კონტექსტში არ არის
- იყავი ბუნებრივი და თბილი, როგორც ადამიანი საუბრობს, არა რობოტული
- მოკლედ და არსებითად უპასუხე (2-4 წინადადება ხმოვანი პასუხისთვის)
- ტექნიკური ტერმინები (AI, EBITDA, LTV) შეგიძლია დატოვო ინგლისურად — ეს ნორმალურია

მოქმედებები:
- თუ მომხმარებელი ითხოვს დარეკვას/ზარს → ჯერ უპასუხე რომ ვრეკავ (მაგ: "რა თქმა უნდა, ვურეკავ ლუკას!") და ბოლოს დაამატე: [ACTION:CALL]
- [ACTION:CALL] ყოველთვის პასუხის ბოლოში უნდა იყოს, არასოდეს დასაწყისში`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Gemini Flash — best Georgian quality, 5xx retry with linear backoff
async function callGemini(messages: ChatMessage[]): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  let systemText = '';
  const geminiContents = [];
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemText = msg.content;
    } else {
      geminiContents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  const body = JSON.stringify({
    ...(systemText && { systemInstruction: { parts: [{ text: systemText }] } }),
    contents: geminiContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      thinkingConfig: { thinkingBudget: 1024 },
    },
  });

  const lastUserMsg = geminiContents[geminiContents.length - 1]?.parts?.[0]?.text || '';
  console.log(`[gemini] sending ${geminiContents.length} messages, last user: "${lastUserMsg.slice(0, 80)}"`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(25000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const candidate = data.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
          console.warn('[gemini] finishReason:', candidate.finishReason);
        }
        const parts = candidate?.content?.parts || [];
        const text = parts.filter((p: any) => p.text && !p.thought).map((p: any) => p.text).join('');
        return text || null;
      }

      const errBody = await res.text().catch(() => '');
      console.error(`[gemini] error ${res.status}:`, errBody.slice(0, 200));

      // Only retry on 5xx server errors
      if (res.status >= 500 && attempt < 3) {
        console.log(`[gemini] retry ${attempt} in ${attempt}s`);
        await new Promise((r) => setTimeout(r, attempt * 1000));
        continue;
      }

      return null;
    } catch (err) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
        continue;
      }
      console.error('Gemini error:', err);
      return null;
    }
  }

  return null;
}

// Groq Llama — fallback when Gemini quota exceeded
async function callGroq(messages: ChatMessage[]): Promise<string | null> {
  if (!GROQ_API_KEY) return null;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.5,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    console.error('Groq error:', res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY && !GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    let userText: string;
    let history: ChatMessage[] = [];

    if (contentType.includes('multipart/form-data')) {
      // Audio input — transcribe with Groq Whisper (still best for STT)
      const formData = await request.formData();
      const audioFile = formData.get('audio') as File;
      const historyJson = formData.get('history') as string;

      if (historyJson) {
        try { history = JSON.parse(historyJson); } catch {}
      }

      if (!audioFile) {
        return NextResponse.json({ error: 'Audio file required' }, { status: 400 });
      }

      const whisperForm = new FormData();
      whisperForm.append('file', audioFile, 'audio.webm');
      whisperForm.append('model', 'whisper-large-v3-turbo');
      whisperForm.append('language', 'ka');
      whisperForm.append('response_format', 'json');
      whisperForm.append('temperature', '0');

      const sttRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: whisperForm,
      });

      if (!sttRes.ok) {
        const err = await sttRes.text();
        console.error('Whisper STT error:', err);
        return NextResponse.json({ error: 'Transcription failed' }, { status: 502 });
      }

      const sttData = await sttRes.json();
      userText = sttData.text || '';
      console.log(`[allone-ai] whisper transcript: "${userText}"`);

      if (!userText.trim()) {
        return NextResponse.json({ error: 'No speech detected' }, { status: 400 });
      }

      // Whisper hallucinates garbage from silence when language is forced.
      // Only catch obvious cases: no spaces in long text, or repeated chars.
      const trimmed = userText.trim();
      const words = trimmed.split(/\s+/);
      const avgWordLen = trimmed.replace(/\s/g, '').length / Math.max(words.length, 1);
      const hasRepeats = /(.)\1{4,}/.test(trimmed);
      if (hasRepeats || (trimmed.length > 15 && avgWordLen > 30)) {
        console.warn('[allone-ai] whisper hallucination detected, discarding:', trimmed.slice(0, 80));
        return NextResponse.json({ error: 'No speech detected' }, { status: 400 });
      }
    } else {
      const body = await request.json();
      userText = body.message || body.text || '';
      history = body.history || [];
    }

    // Build message chain
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (Array.isArray(history)) {
      const recent = history.slice(-10);
      for (const msg of recent) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: userText });

    // Try Gemini first (better Georgian), fall back to Groq
    let model = 'gemini-2.5-flash';
    let fullResponse = await callGemini(messages);
    if (!fullResponse) {
      model = 'llama-3.3-70b (groq)';
      console.log('[allone-ai] Gemini returned null, falling back to Groq');
      fullResponse = await callGroq(messages);
    }
    console.log(`[allone-ai] model=${model}, input="${userText.slice(0, 80)}", response="${fullResponse?.slice(0, 80)}"`);

    if (!fullResponse) {
      return NextResponse.json({ error: 'AI response failed' }, { status: 502 });
    }

    // Extract actions from response
    const actions: string[] = [];
    let cleanResponse = fullResponse;

    const actionRegex = /\[ACTION:([\w_]+)(?::(\d+))?\]/g;
    let match;
    while ((match = actionRegex.exec(fullResponse)) !== null) {
      actions.push(match[2] ? `${match[1]}:${match[2]}` : match[1]);
      cleanResponse = cleanResponse.replace(match[0], '');
    }
    cleanResponse = cleanResponse.trim();

    return NextResponse.json({
      transcript: userText,
      response: cleanResponse,
      actions,
      model,
    });
  } catch (error) {
    console.error('Allone AI chat error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
