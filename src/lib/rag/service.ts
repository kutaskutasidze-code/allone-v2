/**
 * RAG (Retrieval Augmented Generation) Service
 * Uses Supabase pgvector for document embeddings and semantic search
 * Provides knowledge base management and AI-powered Q&A
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// Create admin client for server-side operations
const supabaseAdmin = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export interface KnowledgeBase {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  document_count: number;
  total_chunks: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  knowledge_base_id: string;
  name: string;
  file_type?: string;
  file_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  chunk_count: number;
  token_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  processed_at?: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  knowledge_base_id: string;
  content: string;
  chunk_index: number;
  token_count: number;
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  content: string;
  similarity: number;
  document_name: string;
  chunk_index: number;
  metadata: Record<string, unknown>;
}

export interface CreateKnowledgeBaseInput {
  user_id: string;
  name: string;
  description?: string;
}

export interface UploadDocumentInput {
  knowledge_base_id: string;
  name: string;
  content: string;
  file_type?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatWithKnowledgeInput {
  knowledge_base_id: string;
  message: string;
  session_id?: string;
  system_prompt?: string;
  max_tokens?: number;
}

// Text chunking configuration
const CHUNK_SIZE = 1000; // characters
const CHUNK_OVERLAP = 200; // overlap between chunks

/**
 * Split text into overlapping chunks for better retrieval
 */
function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence or paragraph boundaries
    if (end < text.length) {
      const breakPoints = ['\n\n', '\n', '. ', '! ', '? ', '; '];
      for (const breakPoint of breakPoints) {
        const lastBreak = text.lastIndexOf(breakPoint, end);
        if (lastBreak > start + chunkSize / 2) {
          end = lastBreak + breakPoint.length;
          break;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter(chunk => chunk.length > 50); // Filter out tiny chunks
}

/**
 * Count tokens (rough estimate: ~4 chars per token for English)
 */
function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generate embeddings using OpenAI's API
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}

/**
 * Generate AI response using Groq (faster) or OpenAI
 */
async function generateResponse(
  context: string,
  question: string,
  systemPrompt?: string
): Promise<string> {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  // Default system prompt for RAG
  const defaultPrompt = `You are a helpful AI assistant. Answer the user's question based ONLY on the provided context.
If the context doesn't contain relevant information, say "I don't have enough information to answer that question."
Be concise and direct in your answers.`;

  const messages = [
    { role: 'system', content: systemPrompt || defaultPrompt },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
  ];

  // Try Groq first (faster), fall back to OpenAI
  if (GROQ_API_KEY) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }
  }

  // Fallback to OpenAI
  if (OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }
  }

  throw new Error('No AI provider available');
}

class RAGService {
  // ==================== Knowledge Base Management ====================

  async createKnowledgeBase(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_bases')
      .insert({
        user_id: input.user_id,
        name: input.name,
        description: input.description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge base: ${error.message}`);
    }

    return data;
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase | null> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_bases')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async listKnowledgeBases(userId: string): Promise<KnowledgeBase[]> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_bases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list knowledge bases: ${error.message}`);
    }

    return data || [];
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('knowledge_bases')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete knowledge base: ${error.message}`);
    }
  }

  // ==================== Document Management ====================

  async uploadDocument(input: UploadDocumentInput): Promise<KnowledgeDocument> {
    // Create document record
    const { data: document, error: docError } = await supabaseAdmin
      .from('knowledge_documents')
      .insert({
        knowledge_base_id: input.knowledge_base_id,
        name: input.name,
        file_type: input.file_type,
        status: 'processing',
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Failed to create document: ${docError.message}`);
    }

    try {
      // Chunk the document
      const chunks = chunkText(input.content);

      // Generate embeddings for all chunks
      const embeddings = await generateEmbeddings(chunks);

      // Store chunks with embeddings
      const chunkRecords = chunks.map((content, index) => ({
        document_id: document.id,
        knowledge_base_id: input.knowledge_base_id,
        content,
        embedding: JSON.stringify(embeddings[index]),
        chunk_index: index,
        token_count: countTokens(content),
        metadata: { source: input.name },
      }));

      const { error: embedError } = await supabaseAdmin
        .from('knowledge_embeddings')
        .insert(chunkRecords);

      if (embedError) {
        throw new Error(`Failed to store embeddings: ${embedError.message}`);
      }

      // Update document status
      const totalTokens = chunks.reduce((sum, chunk) => sum + countTokens(chunk), 0);
      const { data: updatedDoc, error: updateError } = await supabaseAdmin
        .from('knowledge_documents')
        .update({
          status: 'completed',
          chunk_count: chunks.length,
          token_count: totalTokens,
          processed_at: new Date().toISOString(),
        })
        .eq('id', document.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update document: ${updateError.message}`);
      }

      // Update knowledge base stats
      await this.updateKnowledgeBaseStats(input.knowledge_base_id);

      return updatedDoc;
    } catch (error) {
      // Mark document as failed
      await supabaseAdmin
        .from('knowledge_documents')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', document.id);

      throw error;
    }
  }

  async listDocuments(knowledgeBaseId: string): Promise<KnowledgeDocument[]> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_documents')
      .select('*')
      .eq('knowledge_base_id', knowledgeBaseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list documents: ${error.message}`);
    }

    return data || [];
  }

  async deleteDocument(documentId: string): Promise<void> {
    // Get knowledge_base_id before deleting
    const { data: doc } = await supabaseAdmin
      .from('knowledge_documents')
      .select('knowledge_base_id')
      .eq('id', documentId)
      .single();

    const { error } = await supabaseAdmin
      .from('knowledge_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    // Update knowledge base stats
    if (doc) {
      await this.updateKnowledgeBaseStats(doc.knowledge_base_id);
    }
  }

  // ==================== Semantic Search ====================

  async search(
    knowledgeBaseId: string,
    query: string,
    limit = 5
  ): Promise<SearchResult[]> {
    // Generate embedding for the query
    const [queryEmbedding] = await generateEmbeddings([query]);

    // Perform vector similarity search
    const { data, error } = await supabaseAdmin.rpc('match_knowledge_embeddings', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_knowledge_base_id: knowledgeBaseId,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error) {
      // If the function doesn't exist, fall back to manual search
      console.error('Vector search function error:', error.message);
      return this.fallbackSearch(knowledgeBaseId, queryEmbedding, limit);
    }

    return (data || []).map((item: {
      content: string;
      similarity: number;
      metadata: Record<string, unknown>;
      chunk_index: number;
    }) => ({
      content: item.content,
      similarity: item.similarity,
      document_name: item.metadata?.source as string || 'Unknown',
      chunk_index: item.chunk_index,
      metadata: item.metadata,
    }));
  }

  private async fallbackSearch(
    knowledgeBaseId: string,
    queryEmbedding: number[],
    limit: number
  ): Promise<SearchResult[]> {
    // Fetch all embeddings for the knowledge base
    const { data, error } = await supabaseAdmin
      .from('knowledge_embeddings')
      .select('content, embedding, chunk_index, metadata')
      .eq('knowledge_base_id', knowledgeBaseId);

    if (error || !data) {
      return [];
    }

    // Calculate cosine similarity manually
    const results = data.map(item => {
      const embedding = JSON.parse(item.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      return {
        content: item.content,
        similarity,
        document_name: item.metadata?.source as string || 'Unknown',
        chunk_index: item.chunk_index,
        metadata: item.metadata,
      };
    });

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .filter(r => r.similarity > 0.5);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ==================== Chat with Knowledge Base ====================

  async chat(input: ChatWithKnowledgeInput): Promise<{
    response: string;
    sources: SearchResult[];
    tokens_used: number;
  }> {
    // Search for relevant context
    const sources = await this.search(input.knowledge_base_id, input.message, 5);

    if (sources.length === 0) {
      return {
        response: "I don't have enough information to answer that question. Please upload relevant documents to the knowledge base.",
        sources: [],
        tokens_used: 0,
      };
    }

    // Build context from search results
    const context = sources
      .map((s, i) => `[${i + 1}] ${s.content}`)
      .join('\n\n');

    // Generate response
    const response = await generateResponse(context, input.message, input.system_prompt);

    // Save conversation if session_id provided
    if (input.session_id) {
      await this.saveConversation(input.knowledge_base_id, input.session_id, [
        { role: 'user', content: input.message },
        { role: 'assistant', content: response },
      ]);
    }

    return {
      response,
      sources,
      tokens_used: countTokens(context) + countTokens(response),
    };
  }

  private async saveConversation(
    knowledgeBaseId: string,
    sessionId: string,
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    // Get the user_product that uses this knowledge base
    const { data: product } = await supabaseAdmin
      .from('user_products')
      .select('id')
      .eq('knowledge_base_id', knowledgeBaseId)
      .single();

    if (!product) return;

    const records = messages.map(msg => ({
      project_id: product.id,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
    }));

    await supabaseAdmin
      .from('rag_conversations')
      .insert(records);
  }

  // ==================== Stats ====================

  private async updateKnowledgeBaseStats(knowledgeBaseId: string): Promise<void> {
    // Get document count
    const { count: docCount } = await supabaseAdmin
      .from('knowledge_documents')
      .select('*', { count: 'exact', head: true })
      .eq('knowledge_base_id', knowledgeBaseId)
      .eq('status', 'completed');

    // Get chunk and token totals
    const { data: stats } = await supabaseAdmin
      .from('knowledge_documents')
      .select('chunk_count, token_count')
      .eq('knowledge_base_id', knowledgeBaseId)
      .eq('status', 'completed');

    const totalChunks = stats?.reduce((sum, d) => sum + (d.chunk_count || 0), 0) || 0;
    const totalTokens = stats?.reduce((sum, d) => sum + (d.token_count || 0), 0) || 0;

    await supabaseAdmin
      .from('knowledge_bases')
      .update({
        document_count: docCount || 0,
        total_chunks: totalChunks,
        total_tokens: totalTokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', knowledgeBaseId);
  }

  // ==================== Widget Embed Code ====================

  getEmbedCode(
    botId: string,
    options?: {
      position?: 'bottom-right' | 'bottom-left';
      theme?: 'light' | 'dark';
      title?: string;
    }
  ): string {
    const config = {
      botId,
      apiUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.allone.ge',
      position: options?.position || 'bottom-right',
      theme: options?.theme || 'light',
      title: options?.title || 'Chat with us',
    };

    return `<!-- ALLONE RAG Chatbot Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ALLONE_RAG']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id='allone-rag-widget';js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','alloneRAG','${config.apiUrl}/rag-widget.js'));
  alloneRAG('init', ${JSON.stringify(config)});
</script>`;
  }
}

export const ragService = new RAGService();
export default RAGService;
