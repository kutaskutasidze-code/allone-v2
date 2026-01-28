import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // System prompt for company/services questions
    const systemPrompt = `You are a helpful assistant for Allone, an AI solutions and digital transformation company. Answer questions about the company and its services based on the following knowledge base. Be concise, friendly, and professional.

${language === 'ka' ? 'Respond in Georgian language.' : 'Respond in English.'}

KNOWLEDGE BASE:
${context}

RULES:
- Answer based only on the provided knowledge base
- Keep responses concise (2-3 sentences when possible)
- Be helpful and encourage scheduling a consultation
- Focus on the benefits and results Allone delivers
- If you don't know something, offer to connect them with the team`;

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
    console.error('Presentation chat error:', error);
    return NextResponse.json({
      reply: 'Sorry, I encountered an error. Please try again or contact us directly at www.allone.ge'
    });
  }
}

function getSimpleResponse(message: string, language: string): string {
  const msg = message.toLowerCase();

  const responses = {
    en: {
      services: 'We build AI chatbots, custom AI solutions, workflow automation, voice AI agents, web applications, and analytics dashboards. Each solution is tailored to your specific needs.',
      pricing: 'Our pricing varies based on project complexity and scope. We offer transparent pricing with no hidden costs. Schedule a free consultation to get a detailed proposal.',
      process: 'Our process: 1) Discovery call to understand your needs, 2) Detailed proposal with timeline and pricing, 3) Agile development with regular demos, 4) Launch and ongoing support.',
      results: 'Our clients typically see: 80% reduction in response times, 20+ hours saved per week, 35% increase in conversions. Results vary by project but ROI is usually visible within the first month.',
      chatbot: 'Our AI chatbots are context-aware and learn your business. They handle customer support, sales inquiries, and onboarding with 94% resolution rate and 24/7 availability.',
      automation: 'We connect your existing tools into seamless automated pipelines, eliminating manual data entry and missed handoffs. Perfect for repetitive tasks that drain your team\'s time.',
      consultation: 'We offer free consultations with no commitment. We\'ll discuss your challenges and show you what\'s possible with AI. Visit www.allone.ge to schedule.',
      default: 'I\'d be happy to help! For detailed questions about our services, let\'s schedule a free consultation. Visit www.allone.ge to get started.',
    },
    ka: {
      services: 'ვქმნით AI ჩატბოტებს, მორგებულ AI გადაწყვეტილებებს, სამუშაო პროცესების ავტომატიზაციას, ხმოვან AI აგენტებს, ვებ აპლიკაციებს და ანალიტიკურ დაშბორდებს.',
      pricing: 'ფასები დამოკიდებულია პროექტის სირთულესა და მოცულობაზე. გთავაზობთ გამჭვირვალე ფასებს. დაჯავშნეთ უფასო კონსულტაცია დეტალური წინადადებისთვის.',
      process: 'პროცესი: 1) საწყისი ზარი საჭიროებების გასაგებად, 2) დეტალური წინადადება ვადებითა და ფასებით, 3) Agile განვითარება რეგულარული დემოებით, 4) გაშვება და მხარდაჭერა.',
      results: 'ჩვენი კლიენტები ჩვეულებრივ ხედავენ: 80% შემცირებას პასუხის დროში, 20+ დაზოგილ საათს კვირაში, 35% ზრდას კონვერსიებში.',
      chatbot: 'ჩვენი AI ჩატბოტები კონტექსტის მცოდნეა და სწავლობენ თქვენს ბიზნესს. ამუშავებენ მხარდაჭერას, გაყიდვებს და ონბორდინგს 94% გადაწყვეტის მაჩვენებლით.',
      automation: 'ვაკავშირებთ თქვენს არსებულ ხელსაწყოებს ავტომატიზებულ პროცესებში, ვაუქმებთ ხელით მონაცემთა შეყვანას და გამოტოვებულ გადაცემებს.',
      consultation: 'გთავაზობთ უფასო კონსულტაციას ვალდებულების გარეშე. განვიხილავთ თქვენს გამოწვევებს და გაჩვენებთ რა არის შესაძლებელი AI-ით.',
      default: 'სიამოვნებით დაგეხმარებით! დეტალური კითხვებისთვის, დავგეგმოთ უფასო კონსულტაცია. ეწვიეთ www.allone.ge დასაწყებად.',
    },
  };

  const r = responses[language as 'en' | 'ka'] || responses.en;

  if (msg.includes('service') || msg.includes('what do you') || msg.includes('სერვის') || msg.includes('რას აკეთ')) {
    return r.services;
  }
  if (msg.includes('price') || msg.includes('cost') || msg.includes('ფას') || msg.includes('ღირ')) {
    return r.pricing;
  }
  if (msg.includes('process') || msg.includes('how do you work') || msg.includes('პროცეს') || msg.includes('როგორ მუშაობ')) {
    return r.process;
  }
  if (msg.includes('result') || msg.includes('roi') || msg.includes('შედეგ')) {
    return r.results;
  }
  if (msg.includes('chatbot') || msg.includes('assistant') || msg.includes('ჩატბოტ') || msg.includes('ასისტენტ')) {
    return r.chatbot;
  }
  if (msg.includes('automat') || msg.includes('workflow') || msg.includes('ავტომატ')) {
    return r.automation;
  }
  if (msg.includes('consult') || msg.includes('meeting') || msg.includes('call') || msg.includes('კონსულტ') || msg.includes('ზარ')) {
    return r.consultation;
  }

  return r.default;
}
