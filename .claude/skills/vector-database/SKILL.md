---
name: vector-database
description: Patterns for vector embeddings, similarity search, and RAG (Retrieval Augmented Generation) using pgvector with Supabase. Use when building semantic search, document Q&A, or AI-powered knowledge bases.
---

# Vector Database & RAG Patterns

## Overview

This skill covers:
- Vector embeddings with OpenAI/Voyage
- pgvector with Supabase
- Semantic search
- RAG (Retrieval Augmented Generation)
- Document processing

---

## Pattern 1: Setup pgvector in Supabase

### Enable Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### Documents Table Schema

```sql
-- Documents with embeddings
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),  -- OpenAI ada-002 dimension
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks for large documents
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast similarity search
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
```

### Similarity Search Function

```sql
-- Function to search similar documents
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        documents.id,
        documents.title,
        documents.content,
        1 - (documents.embedding <=> query_embedding) AS similarity
    FROM documents
    WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    ORDER BY documents.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function for chunk search
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    content TEXT,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_chunks.id AS chunk_id,
        document_chunks.document_id,
        document_chunks.content,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity
    FROM document_chunks
    WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## Pattern 2: Embedding Generation

### OpenAI Embeddings

```typescript
// lib/embeddings/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI();

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.replace(/\n/g, ' ').trim(),
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts.map(t => t.replace(/\n/g, ' ').trim()),
  });

  return response.data.map(d => d.embedding);
}
```

### Voyage AI Embeddings (Alternative)

```typescript
// lib/embeddings/voyage.ts

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-2',
      input: text,
    }),
  });

  const data = await response.json();
  return data.data[0].embedding;
}
```

---

## Pattern 3: Document Processing & Chunking

### Text Chunker

```typescript
// lib/embeddings/chunker.ts

interface ChunkOptions {
  maxTokens?: number;
  overlap?: number;
  separator?: string;
}

export function chunkText(
  text: string,
  options: ChunkOptions = {}
): string[] {
  const {
    maxTokens = 500,
    overlap = 50,
    separator = '\n\n',
  } = options;

  // Simple token estimation (4 chars ~= 1 token)
  const maxChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  // Split by separator first
  const paragraphs = text.split(separator);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If single paragraph is too long, split it
    if (paragraph.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // Split long paragraph into sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) ?? [paragraph];
      let subChunk = '';

      for (const sentence of sentences) {
        if ((subChunk + sentence).length > maxChars) {
          if (subChunk) chunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += sentence;
        }
      }
      if (subChunk) chunks.push(subChunk.trim());
    }
    // Normal case: add to current chunk
    else if ((currentChunk + separator + paragraph).length <= maxChars) {
      currentChunk = currentChunk
        ? currentChunk + separator + paragraph
        : paragraph;
    }
    // Chunk full, start new one with overlap
    else {
      chunks.push(currentChunk.trim());

      // Add overlap from end of previous chunk
      const overlapText = currentChunk.slice(-overlapChars);
      currentChunk = overlapText + separator + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Estimate token count
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

### Document Ingestion Service

```typescript
// lib/embeddings/ingestion.ts
import { createClient } from '@/lib/supabase/admin';
import { generateEmbedding, generateEmbeddings } from './openai';
import { chunkText, estimateTokens } from './chunker';

interface IngestOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export async function ingestDocument(
  title: string,
  content: string,
  metadata: Record<string, unknown> = {},
  options: IngestOptions = {}
) {
  const supabase = createClient();
  const { chunkSize = 500, chunkOverlap = 50 } = options;

  // Create document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .insert({
      title,
      content,
      metadata,
    })
    .select()
    .single();

  if (docError) throw docError;

  // Generate document-level embedding (first 8000 chars)
  const docEmbedding = await generateEmbedding(content.slice(0, 8000));

  await supabase
    .from('documents')
    .update({ embedding: docEmbedding })
    .eq('id', doc.id);

  // Chunk content
  const chunks = chunkText(content, {
    maxTokens: chunkSize,
    overlap: chunkOverlap,
  });

  // Generate embeddings for chunks (batch)
  const chunkEmbeddings = await generateEmbeddings(chunks);

  // Store chunks
  const chunkRecords = chunks.map((chunk, index) => ({
    document_id: doc.id,
    chunk_index: index,
    content: chunk,
    token_count: estimateTokens(chunk),
    embedding: chunkEmbeddings[index],
  }));

  const { error: chunkError } = await supabase
    .from('document_chunks')
    .insert(chunkRecords);

  if (chunkError) throw chunkError;

  return {
    documentId: doc.id,
    chunksCreated: chunks.length,
  };
}

// Batch ingest multiple documents
export async function ingestDocuments(
  documents: Array<{
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>
) {
  const results = [];

  for (const doc of documents) {
    const result = await ingestDocument(doc.title, doc.content, doc.metadata);
    results.push(result);
  }

  return results;
}
```

---

## Pattern 4: Semantic Search

### Search Service

```typescript
// lib/embeddings/search.ts
import { createClient } from '@/lib/supabase/admin';
import { generateEmbedding } from './openai';

interface SearchOptions {
  threshold?: number;
  limit?: number;
  filter?: Record<string, unknown>;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export async function searchDocuments(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { threshold = 0.7, limit = 5 } = options;

  const supabase = createClient();

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);

  // Search using the function
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) throw error;

  return data ?? [];
}

export async function searchChunks(
  query: string,
  options: SearchOptions = {}
): Promise<Array<{
  chunkId: string;
  documentId: string;
  content: string;
  similarity: number;
}>> {
  const { threshold = 0.7, limit = 10 } = options;

  const supabase = createClient();

  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  if (error) throw error;

  return data ?? [];
}

// Hybrid search (semantic + keyword)
export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { threshold = 0.7, limit = 10 } = options;

  const supabase = createClient();
  const queryEmbedding = await generateEmbedding(query);

  // Semantic search
  const { data: semanticResults } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  });

  // Keyword search
  const { data: keywordResults } = await supabase
    .from('documents')
    .select('id, title, content')
    .textSearch('content', query.split(' ').join(' & '))
    .limit(limit);

  // Merge and deduplicate
  const resultMap = new Map<string, SearchResult>();

  // Add semantic results
  for (const result of semanticResults ?? []) {
    resultMap.set(result.id, {
      ...result,
      similarity: result.similarity,
    });
  }

  // Add keyword results (lower similarity score)
  for (const result of keywordResults ?? []) {
    if (!resultMap.has(result.id)) {
      resultMap.set(result.id, {
        ...result,
        similarity: 0.5, // Base score for keyword matches
      });
    }
  }

  return Array.from(resultMap.values()).sort(
    (a, b) => b.similarity - a.similarity
  );
}
```

---

## Pattern 5: RAG (Retrieval Augmented Generation)

### RAG Service

```typescript
// lib/rag/index.ts
import { searchChunks } from '@/lib/embeddings/search';
import { chatCompletion } from '@/lib/llm/openai';

interface RAGOptions {
  maxChunks?: number;
  threshold?: number;
  systemPrompt?: string;
}

interface RAGResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    content: string;
    similarity: number;
  }>;
}

export async function askQuestion(
  question: string,
  options: RAGOptions = {}
): Promise<RAGResponse> {
  const {
    maxChunks = 5,
    threshold = 0.7,
    systemPrompt = 'You are a helpful assistant. Answer questions based on the provided context. If the context doesn\'t contain relevant information, say so.',
  } = options;

  // Retrieve relevant chunks
  const chunks = await searchChunks(question, {
    threshold,
    limit: maxChunks,
  });

  if (chunks.length === 0) {
    return {
      answer: 'I couldn\'t find any relevant information to answer your question.',
      sources: [],
    };
  }

  // Build context from chunks
  const context = chunks
    .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
    .join('\n\n');

  // Generate answer with context
  const response = await chatCompletion([
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer based on the context above. Cite sources using [1], [2], etc.`,
    },
  ]);

  return {
    answer: response.content ?? 'Unable to generate answer',
    sources: chunks.map(c => ({
      documentId: c.documentId,
      content: c.content,
      similarity: c.similarity,
    })),
  };
}

// Conversational RAG with history
export async function conversationalRAG(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: RAGOptions = {}
): Promise<RAGResponse> {
  const {
    maxChunks = 5,
    threshold = 0.7,
    systemPrompt = 'You are a helpful assistant with access to a knowledge base. Answer questions based on the provided context and conversation history.',
  } = options;

  // Retrieve relevant chunks
  const chunks = await searchChunks(question, {
    threshold,
    limit: maxChunks,
  });

  const context = chunks.length > 0
    ? chunks.map((chunk, i) => `[${i + 1}] ${chunk.content}`).join('\n\n')
    : 'No relevant context found.';

  // Build messages with history
  const messages = [
    { role: 'system' as const, content: `${systemPrompt}\n\nContext:\n${context}` },
    ...history,
    { role: 'user' as const, content: question },
  ];

  const response = await chatCompletion(messages);

  return {
    answer: response.content ?? 'Unable to generate answer',
    sources: chunks.map(c => ({
      documentId: c.documentId,
      content: c.content,
      similarity: c.similarity,
    })),
  };
}
```

### RAG API Route

```typescript
// app/api/rag/route.ts
import { NextResponse } from 'next/server';
import { askQuestion, conversationalRAG } from '@/lib/rag';

export async function POST(request: Request) {
  try {
    const { question, history } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const response = history
      ? await conversationalRAG(question, history)
      : await askQuestion(question);

    return NextResponse.json(response);
  } catch (error) {
    console.error('RAG error:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
```

---

## Pattern 6: Document Q&A Component

```typescript
// components/DocumentQA.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, FileText } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    documentId: string;
    content: string;
    similarity: number;
  }>;
}

export function DocumentQA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const askQuestion = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-500">
            Ask a question about your documents
          </p>
        )}

        {messages.map((message, index) => (
          <div key={index} className="space-y-2">
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'ml-auto bg-black text-white'
                  : 'mr-auto bg-gray-100'
              }`}
            >
              {message.content}
            </div>

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="ml-4 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Sources:</p>
                {message.sources.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs"
                  >
                    <FileText className="h-3 w-3 mt-0.5 text-gray-400" />
                    <span className="line-clamp-2">{source.content}</span>
                    <span className="text-gray-400 whitespace-nowrap">
                      {(source.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          askQuestion();
        }}
        className="p-4 border-t"
      >
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-black"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## Pattern 7: File Upload & Processing

```typescript
// app/api/documents/upload/route.ts
import { NextResponse } from 'next/server';
import { ingestDocument } from '@/lib/embeddings/ingestion';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Read file content
  const text = await file.text();

  // Extract title from filename
  const title = file.name.replace(/\.[^/.]+$/, '');

  // Ingest document
  const result = await ingestDocument(title, text, {
    filename: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  return NextResponse.json(result);
}
```

---

## Best Practices

1. **Chunk intelligently** - Respect document structure (paragraphs, sections)
2. **Add overlap** - Prevent losing context at chunk boundaries
3. **Store metadata** - Source, date, author for filtering
4. **Use hybrid search** - Combine semantic + keyword for best results
5. **Set appropriate thresholds** - Too low = noise, too high = missed results
6. **Cache embeddings** - Don't regenerate for unchanged content
7. **Monitor costs** - Embedding generation costs add up
8. **Test retrieval quality** - Measure recall and precision
9. **Handle long documents** - Break into chunks before embedding
10. **Version your embeddings** - Track which model generated them
