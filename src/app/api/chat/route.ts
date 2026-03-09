import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Lazy-initialize Groq client to avoid build-time errors
let groq: Groq | null = null;

function getGroqClient(): Groq | null {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

// ALLONE knowledge base - this is the context the AI will use
const ALLONE_KNOWLEDGE = `
# About ALLONE

ALLONE is a technology company specializing in AI automation solutions for businesses. We help companies transform their operations through intelligent automation systems.

## Our Services

### 1. AI Chatbots
We build custom AI chatbots that handle customer support, lead qualification, and sales assistance 24/7.
- Reduce response times by 90%
- Handle unlimited concurrent conversations
- Integrate with existing systems (CRM, helpdesk, etc.)
- Support multiple languages
- Learn and improve over time

### 2. Custom AI Solutions
We develop tailored AI solutions for specific business needs:
- Document processing and extraction
- Predictive analytics
- Recommendation systems
- Computer vision applications
- Natural language processing

### 3. Workflow Automation
We automate repetitive business processes:
- Data entry and migration
- Report generation
- Email processing
- Invoice handling
- Lead routing and assignment

### 4. Website Development
Modern, high-performance websites with AI integration:
- Next.js / React applications
- E-commerce platforms
- Admin dashboards
- API development
- Real-time features

### 5. Strategy & Consulting
We help businesses develop their AI strategy:
- AI readiness assessment
- Process optimization
- Technology selection
- Implementation roadmap
- Training and support

## Why Choose ALLONE

- **Expertise**: Deep experience in AI and automation
- **Custom Solutions**: Tailored to your specific needs
- **Fast Delivery**: Rapid implementation and iteration
- **Ongoing Support**: We're with you for the long term
- **Proven Results**: Measurable ROI for our clients

## How We Work

1. **Discovery**: We learn about your business and challenges
2. **Strategy**: We design the optimal solution
3. **Build**: We develop and test the solution
4. **Deploy**: We launch and monitor performance
5. **Optimize**: We continuously improve based on data

## ROI Calculator - Help Users Estimate Savings

When users ask about ROI, potential savings, or costs, help them calculate using this formula:

**Inputs to ask for:**
- Hours saved per week (typical: 5-40 hours)
- Monthly cost reduction (typical: $1,000-$20,000)
- Number of employees affected (typical: 5-100)
- Expected revenue increase % (typical: 5-25%)

**Calculations:**
- Annual Time Savings = Hours saved weekly × 52 weeks
- Annual Cost Savings = Monthly cost reduction × 12 months
- Productivity Gain = Annual time savings × employees × $50/hour (average rate)
- Revenue Gain = Revenue increase % × estimated annual revenue (use $100,000 as baseline if not provided)
- Total Annual Value = Cost savings + Productivity gain + Revenue gain

**Example calculation:**
If a business saves 10 hours/week, reduces costs by $5,000/month, affects 10 employees, and expects 15% revenue increase:
- Annual Time Savings: 520 hours
- Annual Cost Savings: $60,000
- Productivity Gain: 520 × 10 × $50 = $260,000
- Revenue Gain: 15% × $100,000 = $15,000
- Total Annual Value: $335,000

Always present the calculation step by step and explain how automation achieves these savings.

## Scheduling a Demo Call

**Calendly Link:** https://calendly.com/allone-demo/30min

When users want to schedule a demo or consultation, share the Calendly link directly so they can book instantly. Say something like:

"Perfect! You can book a demo call directly here: https://calendly.com/allone-demo/30min - Just pick a time that works for you and we'll see you there!"

If they can't use Calendly, offer to collect their email and have the team reach out.

## Contact

To get started with ALLONE:
- Visit our website: allone.ge
- Email: info@allone.ge
- Schedule a consultation through our contact page

## Pricing

We offer flexible pricing models:
- Project-based pricing for specific implementations
- Monthly retainers for ongoing support
- Custom enterprise agreements

Contact us for a personalized quote based on your needs.
`;

const SYSTEM_PROMPT = `You are the ALLONE AI Assistant on allone.ge. You're a live chat assistant — be conversational, not formal.

Your role: Answer questions about ALLONE's AI automation services, help potential clients, calculate ROI, and schedule demos.

${ALLONE_KNOWLEDGE}

Guidelines:
- Keep responses concise: 2-3 sentences for simple questions, up to 4-5 for detailed ones
- Be conversational — this is live chat, not email
- For pricing: mention it's customized, encourage scheduling a call
- Stay positive and solution-oriented
- For ROI questions: ask for their numbers and calculate step by step
- For demos: share https://calendly.com/allone-demo/30min
- For contact: direct to info@allone.ge`;

// Search services from Supabase based on user query
async function searchServices(query: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    const { data } = await supabase
      .from('services')
      .select('id, title, description, icon, card_type, features, cta_url')
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (!data || data.length === 0) return [];

    // Keyword matching — check if user query relates to any service
    const queryLower = query.toLowerCase();
    const serviceKeywords: Record<string, string[]> = {
      chatbot: ['chatbot', 'chat', 'bot', 'support', 'customer service', 'ჩატბოტ', 'ბოტ'],
      custom_ai: ['ai', 'artificial', 'machine learning', 'ml', 'nlp', 'vision', 'ხელოვნური'],
      workflow: ['automation', 'automate', 'workflow', 'process', 'ავტომატიზაცია'],
      website: ['website', 'web', 'site', 'app', 'application', 'ვებსაიტ', 'საიტ'],
      consulting: ['strategy', 'consulting', 'consult', 'advice', 'plan', 'კონსულტაცია', 'სტრატეგია'],
    };

    const matched = data.filter(service => {
      const type = service.card_type || '';
      const keywords = serviceKeywords[type] || [];
      const serviceText = `${service.title} ${service.description}`.toLowerCase();

      // Check if query matches service keywords or service text
      return keywords.some(kw => queryLower.includes(kw)) ||
        queryLower.split(/\s+/).filter(w => w.length > 2).some(w => serviceText.includes(w));
    });

    return matched.slice(0, 3);
  } catch (error) {
    console.error('Service search error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const client = getGroqClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Chat service not configured' },
        { status: 500 }
      );
    }

    // Build conversation with system prompt
    const conversationMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ];

    // Get user's last message for service search
    const lastUserMessage = messages.filter((m: { role: string }) => m.role === 'user').pop()?.content || '';

    // Start service search in parallel with LLM stream
    const serviceSearchPromise = searchServices(lastUserMessage);

    // Start Groq streaming
    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Stream text chunks from Groq
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const line = JSON.stringify({ type: 'text', content }) + '\n';
              controller.enqueue(encoder.encode(line));
            }
          }

          // After text stream completes, send service cards
          const services = await serviceSearchPromise;
          for (const service of services) {
            const line = JSON.stringify({
              type: 'service',
              data: {
                id: service.id,
                title: service.title,
                description: service.description,
                icon: service.icon,
                card_type: service.card_type,
                features: service.features?.slice(0, 3) || [],
                cta_url: service.cta_url,
              },
            }) + '\n';
            controller.enqueue(encoder.encode(line));
          }

          // Signal completion
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorLine = JSON.stringify({
            type: 'error',
            content: 'Sorry, something went wrong. Please try again.',
          }) + '\n';
          controller.enqueue(encoder.encode(errorLine));
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
