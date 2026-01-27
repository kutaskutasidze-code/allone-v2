import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // System prompt for partnership questions
    const systemPrompt = `You are a helpful assistant for Allone's partnership program. Answer questions about the partnership based on the following knowledge base. Be concise, friendly, and professional.

${language === 'ka' ? 'Respond in Georgian language.' : 'Respond in English.'}

KNOWLEDGE BASE:
${context}

RULES:
- Answer based only on the provided knowledge base
- Keep responses concise (2-3 sentences when possible)
- Be helpful and encourage next steps
- If asked about specific commission rates, say they are negotiable
- If you don't know something, say you'd be happy to connect them with the team`;

    // Try to use the chat API
    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    const apiUrl = process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.OPENAI_API_KEY
      ? 'gpt-4o-mini'
      : 'llama-3.1-8b-instant';

    if (!apiKey) {
      // Fallback to simple keyword matching if no API key
      return NextResponse.json({
        reply: getSimpleResponse(message, language)
      });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('API error:', await response.text());
      return NextResponse.json({
        reply: getSimpleResponse(message, language)
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || getSimpleResponse(message, language);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Partnership chat error:', error);
    return NextResponse.json({
      reply: 'Sorry, I encountered an error. Please try again or contact us directly at www.allone.ge'
    });
  }
}

function getSimpleResponse(message: string, language: string): string {
  const msg = message.toLowerCase();

  const responses = {
    en: {
      commission: 'Commission rates are negotiable based on involvement level, project complexity, and exclusivity. We\'re flexible and focused on terms that work for both parties.',
      howItWorks: 'Simple: You identify AI/tech opportunities with your clients, introduce them to Allone, we build the solution, and you earn commission when the project closes.',
      services: 'We build AI assistants, process automation, voice AI, RAG systems, custom software, and analytics solutions.',
      next: 'Next steps are: 1) Discovery call (30 min), 2) Partnership agreement, 3) Team training (1 hour), 4) First referral. Ready to schedule a call?',
      default: 'I\'d be happy to help! For detailed questions about the partnership, let\'s schedule a call. You can reach us at www.allone.ge',
    },
    ka: {
      commission: 'საკომისიო განაკვეთები მოლაპარაკებადია ჩართულობის დონის, პროექტის სირთულისა და ექსკლუზიურობის მიხედვით.',
      howItWorks: 'მარტივია: თქვენ იდენტიფიცირებთ AI/ტექ შესაძლებლობებს კლიენტებთან, გვაცნობთ Allone-ს, ჩვენ ვაშენებთ გადაწყვეტას, და თქვენ იღებთ საკომისიოს.',
      services: 'ჩვენ ვაშენებთ AI ასისტენტებს, პროცესების ავტომატიზაციას, ხმოვან AI-ს, RAG სისტემებს, პროგრამულ უზრუნველყოფას და ანალიტიკას.',
      next: 'შემდეგი ნაბიჯები: 1) საწყისი ზარი (30 წთ), 2) პარტნიორობის შეთანხმება, 3) გუნდის ტრენინგი (1 საათი), 4) პირველი რეფერალი.',
      default: 'სიამოვნებით დაგეხმარებით! დეტალური კითხვებისთვის, დავგეგმოთ ზარი. დაგვიკავშირდით: www.allone.ge',
    },
  };

  const r = responses[language as 'en' | 'ka'] || responses.en;

  if (msg.includes('commission') || msg.includes('საკომისიო') || msg.includes('earn') || msg.includes('money')) {
    return r.commission;
  }
  if (msg.includes('how') || msg.includes('work') || msg.includes('როგორ') || msg.includes('მუშაობ')) {
    return r.howItWorks;
  }
  if (msg.includes('service') || msg.includes('build') || msg.includes('სერვის') || msg.includes('აშენ')) {
    return r.services;
  }
  if (msg.includes('next') || msg.includes('start') || msg.includes('begin') || msg.includes('შემდეგ') || msg.includes('დაწყ')) {
    return r.next;
  }

  return r.default;
}
