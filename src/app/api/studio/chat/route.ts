import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are an AI assistant helping users build AI products on the ALLONE platform. You help them create:

1. **Voice AI Agents** - AI phone/web assistants that handle calls, book appointments, answer questions
2. **RAG Chatbots** - Knowledge-base chatbots that answer questions from uploaded documents
3. **Automation Bots** - Workflow automations that connect apps and automate tasks

Your job is to:
1. Understand what the user wants to build
2. Ask clarifying questions to gather requirements
3. When you have enough info, generate a configuration for their AI product

When you're ready to create the product, respond with a JSON block in this exact format:

\`\`\`json
{
  "action": "create_project",
  "type": "voice_agent" | "rag_bot" | "automation",
  "config": {
    "name": "Project Name",
    "description": "What the AI does",
    "systemPrompt": "The AI's personality and instructions",
    "templateId": "template-id (for automations only)"
  }
}
\`\`\`

Guidelines:
- Be conversational and helpful
- Ask one question at a time
- Give examples when helpful
- Keep responses concise (2-3 sentences max unless explaining something)
- When the user describes what they want, confirm your understanding before creating
- If unsure what they need, ask if they want a Voice AI, Chatbot, or Automation

Available automation templates:
- lead-notification: Slack/Email alerts for new leads
- daily-report: Automated daily summary emails
- social-media-post: Auto-post to multiple platforms
- appointment-reminder: SMS/Email reminders
- invoice-automation: Generate and send invoices`;

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const groqMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map((m: Message) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || '';

    // Check if the response contains a create action
    const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
    let createAction = null;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.action === 'create_project') {
          createAction = parsed;
        }
      } catch {
        // Not valid JSON, ignore
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      createAction,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Studio chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
