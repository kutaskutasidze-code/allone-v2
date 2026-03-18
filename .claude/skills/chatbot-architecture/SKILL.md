---
name: chatbot-architecture
description: Patterns for building production chatbots - conversation flows, context management, message storage, and multi-turn dialogs. Use when building AI chatbot features for clients.
---

# Chatbot Architecture Patterns

## Overview

This skill covers building production-ready chatbots with:
- Conversation flow management
- Context and memory handling
- Message persistence
- Multi-turn dialog support
- Session management

---

## Database Schema

### Supabase Tables for Chat

```sql
-- Chat sessions (one per user conversation)
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    external_user_id TEXT,  -- For anonymous/external users
    title TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',  -- token_count, model, latency, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_external ON chat_sessions(external_user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can manage own sessions" ON chat_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage messages in own sessions" ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM chat_sessions WHERE user_id = auth.uid()
        )
    );
```

---

## Pattern 1: Basic Chat Service

```typescript
// lib/chat/chat-service.ts
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/llm/openai';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
}

export class ChatService {
  private supabase: Awaited<ReturnType<typeof createClient>>;

  constructor(supabase: Awaited<ReturnType<typeof createClient>>) {
    this.supabase = supabase;
  }

  // Create new session
  async createSession(userId?: string, metadata?: Record<string, unknown>) {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        metadata,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return data;
  }

  // Get session with messages
  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data: session } = await this.supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!session) return null;

    const { data: messages } = await this.supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    return {
      id: session.id,
      messages: messages as Message[] ?? [],
    };
  }

  // Send message and get response
  async sendMessage(
    sessionId: string,
    userMessage: string,
    systemPrompt?: string
  ) {
    // Get existing messages for context
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    // Save user message
    await this.supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: userMessage,
    });

    // Build messages array for LLM
    const messages: Message[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add conversation history
    messages.push(...session.messages);
    messages.push({ role: 'user', content: userMessage });

    // Get LLM response
    const startTime = Date.now();
    const response = await chatCompletion(messages);
    const latency = Date.now() - startTime;

    if (response.error) {
      throw new Error(`LLM error: ${response.error}`);
    }

    // Save assistant response
    await this.supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: response.content,
      metadata: {
        latency,
        tokens: response.usage,
      },
    });

    return {
      content: response.content,
      usage: response.usage,
    };
  }

  // List user's sessions
  async listSessions(userId: string, limit = 20) {
    const { data, error } = await this.supabase
      .from('chat_sessions')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        chat_messages (content)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Generate titles from first message if not set
    return data?.map(session => ({
      ...session,
      title: session.title ?? session.chat_messages?.[0]?.content?.slice(0, 50) ?? 'New Chat',
    }));
  }

  // Delete session
  async deleteSession(sessionId: string) {
    const { error } = await this.supabase
      .from('chat_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) throw error;
  }
}
```

---

## Pattern 2: Conversation Context Management

```typescript
// lib/chat/context-manager.ts

interface ContextConfig {
  maxMessages?: number;      // Max messages to keep in context
  maxTokens?: number;        // Max tokens for context
  summaryThreshold?: number; // When to summarize older messages
}

export class ContextManager {
  private config: Required<ContextConfig>;

  constructor(config: ContextConfig = {}) {
    this.config = {
      maxMessages: config.maxMessages ?? 20,
      maxTokens: config.maxTokens ?? 4000,
      summaryThreshold: config.summaryThreshold ?? 15,
    };
  }

  // Trim messages to fit context window
  trimMessages(messages: Message[]): Message[] {
    if (messages.length <= this.config.maxMessages) {
      return messages;
    }

    // Keep system message + recent messages
    const systemMessage = messages.find(m => m.role === 'system');
    const recentMessages = messages
      .filter(m => m.role !== 'system')
      .slice(-this.config.maxMessages);

    return systemMessage
      ? [systemMessage, ...recentMessages]
      : recentMessages;
  }

  // Summarize old messages to save tokens
  async summarizeContext(
    messages: Message[],
    summarize: (text: string) => Promise<string>
  ): Promise<Message[]> {
    if (messages.length < this.config.summaryThreshold) {
      return messages;
    }

    // Split into old and recent
    const splitPoint = messages.length - 10;
    const oldMessages = messages.slice(0, splitPoint);
    const recentMessages = messages.slice(splitPoint);

    // Summarize old messages
    const conversationText = oldMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const summary = await summarize(
      `Summarize this conversation concisely:\n\n${conversationText}`
    );

    // Return summary as system context + recent messages
    return [
      {
        role: 'system',
        content: `Previous conversation summary: ${summary}`,
      },
      ...recentMessages,
    ];
  }

  // Build context with relevant information
  buildContext(
    systemPrompt: string,
    messages: Message[],
    additionalContext?: Record<string, unknown>
  ): Message[] {
    let fullSystemPrompt = systemPrompt;

    // Add additional context (user info, time, etc.)
    if (additionalContext) {
      const contextStr = Object.entries(additionalContext)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('\n');

      fullSystemPrompt += `\n\nContext:\n${contextStr}`;
    }

    const trimmed = this.trimMessages(messages);

    return [
      { role: 'system', content: fullSystemPrompt },
      ...trimmed.filter(m => m.role !== 'system'),
    ];
  }
}
```

---

## Pattern 3: Multi-Agent / Routing

```typescript
// lib/chat/router.ts

interface Agent {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
}

const AGENTS: Record<string, Agent> = {
  support: {
    name: 'Customer Support',
    description: 'Handles customer inquiries, complaints, and general support',
    systemPrompt: `You are a helpful customer support agent...`,
    model: 'gpt-4o-mini',
    temperature: 0.3,
  },
  sales: {
    name: 'Sales Assistant',
    description: 'Helps with product information, pricing, and sales inquiries',
    systemPrompt: `You are a knowledgeable sales assistant...`,
    model: 'gpt-4o-mini',
    temperature: 0.5,
  },
  technical: {
    name: 'Technical Support',
    description: 'Handles technical issues, debugging, and integration help',
    systemPrompt: `You are a technical support engineer...`,
    model: 'gpt-4o',
    temperature: 0.2,
  },
};

// Router prompt
const ROUTER_PROMPT = `You are a routing assistant. Based on the user's message, determine which agent should handle this conversation.

Available agents:
${Object.entries(AGENTS)
  .map(([key, agent]) => `- ${key}: ${agent.description}`)
  .join('\n')}

Respond with just the agent key (support, sales, or technical).`;

export class ChatRouter {
  async routeMessage(userMessage: string): Promise<Agent> {
    const response = await chatCompletion([
      { role: 'system', content: ROUTER_PROMPT },
      { role: 'user', content: userMessage },
    ], { temperature: 0 });

    const agentKey = response.content?.trim().toLowerCase() ?? 'support';
    return AGENTS[agentKey] ?? AGENTS.support;
  }

  async handleMessage(
    sessionId: string,
    userMessage: string,
    currentAgent?: string
  ) {
    // Route to appropriate agent
    const agent = currentAgent
      ? AGENTS[currentAgent]
      : await this.routeMessage(userMessage);

    // Process with selected agent
    const response = await chatCompletion([
      { role: 'system', content: agent.systemPrompt },
      { role: 'user', content: userMessage },
    ], {
      model: agent.model,
      temperature: agent.temperature,
    });

    return {
      agent: agent.name,
      content: response.content,
    };
  }
}
```

---

## Pattern 4: Chat API Routes

### Create Session

```typescript
// app/api/chat/sessions/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatService } from '@/lib/chat/chat-service';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const chatService = new ChatService(supabase);
    const session = await chatService.createSession(user?.id);

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatService = new ChatService(supabase);
    const sessions = await chatService.listSessions(user.id);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('List sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
```

### Send Message (Streaming)

```typescript
// app/api/chat/[sessionId]/route.ts
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const SYSTEM_PROMPT = `You are a helpful assistant for Allone...`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const { message } = await request.json();

  const supabase = await createClient();

  // Get conversation history
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  // Save user message
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: message,
  });

  // Build messages for LLM
  const llmMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...(messages ?? []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  // Stream response
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: llmMessages,
    stream: true,
  });

  let fullResponse = '';
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
          );
        }
      }

      // Save complete response
      await supabase.from('chat_messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: fullResponse,
      });

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

---

## Pattern 5: Embeddable Chat Widget

### Widget Component

```typescript
// components/chat/ChatWidget.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  apiEndpoint?: string;
  title?: string;
  placeholder?: string;
  primaryColor?: string;
}

export function ChatWidget({
  apiEndpoint = '/api/chat',
  title = 'Chat with us',
  placeholder = 'Type a message...',
  primaryColor = '#000',
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session
  useEffect(() => {
    if (isOpen && !sessionId) {
      fetch(`${apiEndpoint}/sessions`, { method: 'POST' })
        .then(res => res.json())
        .then(data => setSessionId(data.id))
        .catch(console.error);
    }
  }, [isOpen, sessionId, apiEndpoint]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiEndpoint}/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.body) throw new Error('No response');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              assistantContent += data.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-transform hover:scale-110',
          isOpen && 'hidden'
        )}
        style={{ backgroundColor: primaryColor }}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="font-medium">{title}</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 text-sm">
                Send a message to start chatting
              </p>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={cn(
                  'max-w-[80%] p-3 rounded-2xl text-sm',
                  message.role === 'user'
                    ? 'ml-auto bg-black text-white rounded-br-md'
                    : 'mr-auto bg-gray-100 text-gray-800 rounded-bl-md'
                )}
              >
                {message.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <form
              onSubmit={e => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:border-black"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-full text-white disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

### Embed Script (for client websites)

```typescript
// public/widget.js
(function() {
  const config = window.AlloneChatConfig || {};
  const apiUrl = config.apiUrl || 'https://your-domain.com/api/chat';
  const primaryColor = config.primaryColor || '#000';

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `https://your-domain.com/widget?color=${encodeURIComponent(primaryColor)}`;
  iframe.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 400px;
    height: 550px;
    border: none;
    z-index: 999999;
  `;

  document.body.appendChild(iframe);
})();

// Usage in client's HTML:
// <script>
//   window.AlloneChatConfig = { apiUrl: '...', primaryColor: '#3B82F6' };
// </script>
// <script src="https://your-domain.com/widget.js"></script>
```

---

## Pattern 6: Intent Detection

```typescript
// lib/chat/intents.ts

interface Intent {
  name: string;
  confidence: number;
  entities?: Record<string, string>;
}

const INTENT_PROMPT = `Analyze the user message and extract the intent.

Possible intents:
- greeting: User is saying hello or starting conversation
- product_inquiry: User asking about products or services
- pricing: User asking about costs or pricing
- support: User needs help with an issue
- complaint: User is unhappy or complaining
- booking: User wants to schedule or book something
- goodbye: User is ending conversation
- other: Doesn't fit other categories

Also extract any entities (names, dates, product names, etc.)

Respond in JSON format:
{ "intent": "...", "confidence": 0.0-1.0, "entities": { ... } }`;

export async function detectIntent(message: string): Promise<Intent> {
  const response = await chatCompletion([
    { role: 'system', content: INTENT_PROMPT },
    { role: 'user', content: message },
  ], { temperature: 0 });

  try {
    return JSON.parse(response.content ?? '{}');
  } catch {
    return { name: 'other', confidence: 0.5 };
  }
}

// Use intent for routing or analytics
export async function handleWithIntent(message: string) {
  const intent = await detectIntent(message);

  // Log for analytics
  console.log('Detected intent:', intent);

  // Route based on intent
  switch (intent.name) {
    case 'pricing':
      return handlePricingInquiry(message, intent.entities);
    case 'support':
      return handleSupportRequest(message, intent.entities);
    case 'booking':
      return handleBookingRequest(message, intent.entities);
    default:
      return handleGeneralChat(message);
  }
}
```

---

## Best Practices

1. **Always persist messages** - Don't rely on client state alone
2. **Limit context size** - Trim or summarize old messages
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Implement typing indicators** - Improve perceived responsiveness
5. **Add rate limiting** - Prevent abuse
6. **Log conversations** - For debugging and improvement
7. **Support offline messages** - Queue messages when disconnected
8. **Test with long conversations** - Ensure context management works
