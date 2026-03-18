---
name: llm-integration
description: Patterns for integrating LLM APIs (OpenAI, Claude, Gemini) into applications. Covers streaming, token management, error handling, and cost optimization. Use when building AI-powered features.
---

# LLM Integration Patterns

## Supported Providers

| Provider | Models | Best For |
|----------|--------|----------|
| **OpenAI** | GPT-4o, GPT-4o-mini, GPT-4-turbo | General purpose, function calling |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus/Haiku | Long context, reasoning, safety |
| **Google** | Gemini 1.5 Pro, Gemini 1.5 Flash | Multimodal, large context |

## Installation

```bash
# OpenAI
npm install openai

# Anthropic (Claude)
npm install @anthropic-ai/sdk

# Google Gemini
npm install @google/generative-ai

# Vercel AI SDK (unified interface)
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

## Environment Variables

```env
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

---

## Pattern 1: Basic Chat Completion

### OpenAI

```typescript
// lib/llm/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const { model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 1000 } = options ?? {};

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content ?? '',
      usage: response.usage,
      error: null,
    };
  } catch (error) {
    console.error('OpenAI error:', error);
    return {
      content: null,
      usage: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Anthropic (Claude)

```typescript
// lib/llm/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function chatCompletion(
  messages: Anthropic.MessageParam[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    system?: string;
  }
) {
  const {
    model = 'claude-3-5-sonnet-20241022',
    temperature = 0.7,
    maxTokens = 1000,
    system
  } = options ?? {};

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    });

    const textContent = response.content.find(block => block.type === 'text');

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      error: null,
    };
  } catch (error) {
    console.error('Anthropic error:', error);
    return {
      content: null,
      usage: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

### Google Gemini

```typescript
// lib/llm/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function chatCompletion(
  messages: Array<{ role: 'user' | 'model'; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) {
  const { model = 'gemini-1.5-flash', temperature = 0.7, maxTokens = 1000 } = options ?? {};

  try {
    const geminiModel = genAI.getGenerativeModel({ model });

    const chat = geminiModel.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role,
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return {
      content: response.text(),
      usage: null, // Gemini doesn't return token usage directly
      error: null,
    };
  } catch (error) {
    console.error('Gemini error:', error);
    return {
      content: null,
      usage: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## Pattern 2: Streaming Responses

### OpenAI Streaming

```typescript
// lib/llm/openai-stream.ts
import OpenAI from 'openai';

const openai = new OpenAI();

export async function* streamChatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: { model?: string; temperature?: number }
) {
  const { model = 'gpt-4o-mini', temperature = 0.7 } = options ?? {};

  const stream = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Usage
async function handleStream() {
  const messages = [{ role: 'user' as const, content: 'Hello!' }];

  for await (const chunk of streamChatCompletion(messages)) {
    process.stdout.write(chunk);
  }
}
```

### Anthropic Streaming

```typescript
// lib/llm/anthropic-stream.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function* streamChatCompletion(
  messages: Anthropic.MessageParam[],
  options?: { model?: string; system?: string }
) {
  const { model = 'claude-3-5-sonnet-20241022', system } = options ?? {};

  const stream = await anthropic.messages.stream({
    model,
    max_tokens: 1024,
    system,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
```

### Next.js API Route with Streaming

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    stream: true,
  });

  // Create a TransformStream for streaming response
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
        }
      }
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

### Client-Side Stream Consumption

```typescript
// hooks/useChat.ts
'use client';

import { useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const data = JSON.parse(line.slice(6));
            assistantContent += data.content;

            // Update the last message
            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: 'assistant', content: assistantContent },
            ]);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, sendMessage, isLoading };
}
```

---

## Pattern 3: Vercel AI SDK (Recommended for Next.js)

The cleanest way to handle streaming in Next.js:

```bash
npm install ai @ai-sdk/openai @ai-sdk/anthropic
```

### API Route

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(request: Request) {
  const { messages, provider = 'openai' } = await request.json();

  const model = provider === 'anthropic'
    ? anthropic('claude-3-5-sonnet-20241022')
    : openai('gpt-4o-mini');

  const result = streamText({
    model,
    messages,
  });

  return result.toDataStreamResponse();
}
```

### Client Component

```typescript
// components/Chat.tsx
'use client';

import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Pattern 4: Function Calling / Tool Use

### OpenAI Function Calling

```typescript
// lib/llm/functions.ts
import OpenAI from 'openai';

const openai = new OpenAI();

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and country, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search for products in the catalog',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          category: { type: 'string', description: 'Product category' },
          maxPrice: { type: 'number', description: 'Maximum price' },
        },
        required: ['query'],
      },
    },
  },
];

// Function implementations
const functionHandlers: Record<string, (args: unknown) => Promise<unknown>> = {
  get_weather: async (args: { location: string; unit?: string }) => {
    // Call weather API
    return { temperature: 22, condition: 'sunny', location: args.location };
  },
  search_products: async (args: { query: string; category?: string }) => {
    // Search database
    return [{ id: 1, name: 'Product', price: 99 }];
  },
};

export async function chatWithTools(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    tools,
    tool_choice: 'auto',
  });

  const message = response.choices[0].message;

  // Check if model wants to call a function
  if (message.tool_calls) {
    const toolResults = await Promise.all(
      message.tool_calls.map(async (toolCall) => {
        const handler = functionHandlers[toolCall.function.name];
        const args = JSON.parse(toolCall.function.arguments);
        const result = await handler(args);

        return {
          tool_call_id: toolCall.id,
          role: 'tool' as const,
          content: JSON.stringify(result),
        };
      })
    );

    // Get final response with tool results
    const finalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [...messages, message, ...toolResults],
    });

    return finalResponse.choices[0].message.content;
  }

  return message.content;
}
```

### Claude Tool Use

```typescript
// lib/llm/claude-tools.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: 'Get the current weather in a location',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and country',
        },
      },
      required: ['location'],
    },
  },
];

export async function chatWithTools(messages: Anthropic.MessageParam[]) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    tools,
    messages,
  });

  // Handle tool use
  const toolUseBlock = response.content.find(block => block.type === 'tool_use');

  if (toolUseBlock && toolUseBlock.type === 'tool_use') {
    // Execute tool
    const result = await executeFunction(toolUseBlock.name, toolUseBlock.input);

    // Continue conversation with tool result
    const finalResponse = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      tools,
      messages: [
        ...messages,
        { role: 'assistant', content: response.content },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(result),
            },
          ],
        },
      ],
    });

    return finalResponse;
  }

  return response;
}
```

---

## Pattern 5: Token Counting & Cost Management

```typescript
// lib/llm/tokens.ts
import { encoding_for_model, TiktokenModel } from 'tiktoken';

// Token counting for OpenAI models
export function countTokens(text: string, model: TiktokenModel = 'gpt-4o'): number {
  const encoder = encoding_for_model(model);
  const tokens = encoder.encode(text);
  encoder.free();
  return tokens.length;
}

// Cost calculation
const PRICING = {
  'gpt-4o': { input: 0.0025, output: 0.01 },        // per 1K tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
};

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: keyof typeof PRICING
): number {
  const pricing = PRICING[model];
  return (
    (inputTokens / 1000) * pricing.input +
    (outputTokens / 1000) * pricing.output
  );
}

// Usage tracking in Supabase
export async function trackUsage(
  supabase: SupabaseClient,
  data: {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }
) {
  await supabase.from('llm_usage').insert({
    user_id: data.userId,
    model: data.model,
    input_tokens: data.inputTokens,
    output_tokens: data.outputTokens,
    cost: data.cost,
    created_at: new Date().toISOString(),
  });
}
```

---

## Pattern 6: Error Handling & Retries

```typescript
// lib/llm/resilient.ts
import OpenAI from 'openai';

const openai = new OpenAI();

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function resilientCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options: RetryOptions = {}
) {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });

      return {
        content: response.choices[0]?.message?.content,
        error: null,
      };
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (error instanceof OpenAI.APIError) {
        // 400 Bad Request - don't retry
        if (error.status === 400) {
          return { content: null, error: error.message };
        }

        // 401 Unauthorized - don't retry
        if (error.status === 401) {
          return { content: null, error: 'Invalid API key' };
        }

        // 429 Rate Limited - retry with backoff
        if (error.status === 429) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        // 500+ Server Error - retry
        if (error.status && error.status >= 500) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`Server error. Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }

      // Unknown error - retry with backoff
      if (attempt < maxRetries) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await sleep(delay);
      }
    }
  }

  return {
    content: null,
    error: lastError?.message ?? 'Max retries exceeded',
  };
}
```

---

## Pattern 7: Prompt Templates

```typescript
// lib/llm/prompts.ts

export const SYSTEM_PROMPTS = {
  customerSupport: `You are a helpful customer support assistant for Allone, an AI automation company.
Be concise, friendly, and professional. If you don't know something, say so.
Always try to help the customer solve their problem.`,

  codeAssistant: `You are an expert software engineer assistant.
Provide clear, well-documented code examples.
Always explain your reasoning and suggest best practices.
Use TypeScript when applicable.`,

  dataAnalyst: `You are a data analysis assistant.
Help users understand their data through clear explanations.
Suggest relevant visualizations and statistical methods.
Be precise with numbers and always cite your sources.`,
};

export function buildPrompt(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => variables[key] ?? `{{${key}}}`
  );
}

// Usage
const prompt = buildPrompt(
  'Hello {{name}}, your order #{{orderId}} is {{status}}.',
  { name: 'John', orderId: '12345', status: 'shipped' }
);
```

---

## Model Selection Guide

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Quick responses, high volume | GPT-4o-mini, Gemini Flash | Fast, cheap |
| Complex reasoning | Claude 3.5 Sonnet, GPT-4o | Best quality |
| Long documents (>50K tokens) | Claude 3.5 Sonnet, Gemini 1.5 Pro | Large context |
| Code generation | Claude 3.5 Sonnet, GPT-4o | Best at code |
| Function calling | GPT-4o-mini, GPT-4o | Most reliable |
| Cost-sensitive | GPT-4o-mini, Claude Haiku | Cheapest |
| Vision/images | GPT-4o, Claude 3.5 Sonnet, Gemini | Multimodal |

---

## Security Best Practices

1. **Never expose API keys to client** - Always call LLM from server/API routes
2. **Validate user input** - Sanitize before sending to LLM
3. **Rate limit API routes** - Prevent abuse
4. **Set max tokens** - Prevent runaway costs
5. **Log usage** - Track for billing and debugging
6. **Use environment variables** - Never hardcode keys

```typescript
// middleware.ts - Rate limiting example
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }
}
```
