import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Input validation constants
const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 50;

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are ALLONE AI, an intelligent assistant that helps non-technical founders build business automations and AI agents through conversation.

## CRITICAL: What You CAN and CANNOT Do

### You CAN:
- Create products by outputting a JSON config block (the system will process it)
- Help users describe what they want to build
- Explain how each product type works

### You CANNOT:
- Connect phone numbers manually - phone numbers are assigned AUTOMATICALLY when creating voice agents
- Make test calls - users must test by calling their assigned number
- Access external systems directly
- Modify products after creation (users do this in their dashboard)

## Your Capabilities

You can create these types of products:

### 1. AUTOMATIONS (type: "automation")
Workflows that connect systems and automate tasks:
- Lead Capture: Collect form data → Store in database → Send notifications
- Email Sequences: Trigger events → Send personalized emails
- Data Sync: Watch for changes → Transform → Update destination
- Social Media: Schedule → Post to multiple platforms

### 2. RAG CHATBOTS (type: "rag_bot")
AI chatbots that answer questions from uploaded documents:
- Customer Support: Answer FAQs from knowledge base
- Documentation Bot: Help users find info in docs
- Sales Assistant: Answer product questions, qualify leads

### 3. VOICE AI AGENTS (type: "voice_agent")
AI that handles phone calls and voice interactions:
- Receptionist: Answer calls, take messages, transfer
- Appointment Booking: Schedule meetings via phone
- Customer Service: Handle common inquiries by voice
- A phone number is AUTOMATICALLY assigned when the agent is created

## Conversation Guidelines

1. **Understand the goal**: What business problem are they solving?
2. **Ask ONE clarifying question at a time** - don't overwhelm
3. **Give examples** when the user seems unsure
4. **Confirm understanding** before creating anything
5. **Keep responses concise** (2-3 sentences unless explaining)
6. **NEVER pretend to do things** - if something requires dashboard action, tell them

## When Ready to Create

When you have enough information to create a product, include this JSON block. The system will automatically process it and create the product:

\`\`\`json
{
  "action": "create_product",
  "type": "automation" | "rag_bot" | "voice_agent",
  "config": {
    "name": "Clear, descriptive name",
    "description": "What it does in one sentence",
    "system_prompt": "AI personality and instructions (for bots/agents)",
    "template": "template-id (for automations)",
    "assign_phone": true
  }
}
\`\`\`

For voice_agent type, ALWAYS include "assign_phone": true to automatically assign a phone number.

## Automation Templates

Available templates (use these IDs):
- \`lead-capture\`: Webhook → Store lead → Notify team
- \`email-sequence\`: Trigger → Delay → Send emails
- \`data-sync\`: Source → Transform → Destination
- \`social-scheduler\`: Queue → Schedule → Post

## Example Conversations

**User**: "I need something to capture leads from my website"
**You**: "I can set up a lead capture automation for you. When someone fills out your form, where should the lead info be stored - in a spreadsheet, your CRM, or a database?"

**User**: "I want a chatbot that knows about my products"
**You**: "Perfect, a RAG chatbot can answer questions about your products. Do you have product documentation or a FAQ page I can train it on, or would you like to upload documents after it's created?"

**User**: "Can you make something to answer my phone"
**You**: "I can create a Voice AI agent that answers calls for you. A phone number will be automatically assigned when it's created. What should the AI do when someone calls - take messages, book appointments, or answer common questions?"

## After Product Creation

When a product is successfully created, tell the user:
- For Voice AI: "Your voice agent is ready! A phone number has been assigned. You can see it in your Voice AI dashboard and test it by calling that number."
- For RAG Bot: "Your chatbot is ready! You can upload documents and get the embed code from your RAG Bots dashboard."
- For Automation: "Your automation is ready! Configure the trigger and actions in your Workflows dashboard."

Remember: You're helping non-technical people. Avoid jargon. Be helpful and encouraging. NEVER pretend to do actions you can't actually perform.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      );
    }

    // Input validation
    if (messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `Too many messages. Maximum ${MAX_MESSAGES} messages allowed.` },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      if (typeof msg.content !== 'string') {
        return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json(
          { error: `Message too long. Maximum ${MAX_MESSAGE_LENGTH} characters allowed.` },
          { status: 400 }
        );
      }
    }

    // Get user's existing products for context
    const { data: userProducts } = await supabase
      .from('user_products')
      .select('name, type, status')
      .eq('user_id', user.id)
      .limit(10);

    // Add context about user's products
    let contextMessage = '';
    if (userProducts && userProducts.length > 0) {
      contextMessage = `\n\nUser's existing products:\n${userProducts.map(p => `- ${p.name} (${p.type}, ${p.status})`).join('\n')}`;
    }

    const groqMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextMessage },
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
    const usage = data.usage;

    // Track AI token usage (don't fail if tracking fails)
    if (usage?.total_tokens) {
      try {
        await supabase.rpc('record_usage', {
          p_user_id: user.id,
          p_product_id: null,
          p_event_type: 'ai_tokens',
          p_quantity: usage.total_tokens,
          p_metadata: { model: GROQ_MODEL, action: 'studio_chat' }
        });
      } catch (usageError) {
        console.error('Usage tracking error:', usageError);
      }
    }

    // Check if the response contains a create action
    const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
    let createAction = null;

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.action === 'create_product' || parsed.action === 'create_project') {
          createAction = {
            action: 'create_product',
            type: parsed.type,
            config: {
              name: parsed.config?.name || 'Untitled Product',
              description: parsed.config?.description || '',
              system_prompt: parsed.config?.system_prompt || parsed.config?.systemPrompt,
              template: parsed.config?.template || parsed.config?.templateId,
              settings: parsed.config?.settings || {}
            }
          };
        }
      } catch {
        // Not valid JSON, ignore
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      createAction,
      usage: usage ? {
        tokens: usage.total_tokens,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens
      } : null
    });
  } catch (error) {
    console.error('Studio chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
