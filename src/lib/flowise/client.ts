/**
 * Flowise API Client
 * Wraps Flowise for creating and managing RAG chatbots
 */

const FLOWISE_API_URL = process.env.FLOWISE_API_URL || 'http://localhost:3001';
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY || '';

export interface Chatflow {
  id: string;
  name: string;
  flowData: string;
  deployed: boolean;
  isPublic: boolean;
  apikeyid?: string;
  chatbotConfig?: string;
  createdDate: string;
  updatedDate: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
  sourceDocuments?: Array<{
    pageContent: string;
    metadata: Record<string, unknown>;
  }>;
}

export interface DocumentUpload {
  name: string;
  type: string;
  content: string; // base64 encoded
}

export interface CreateRAGBotInput {
  name: string;
  description?: string;
  welcomeMessage?: string;
  systemPrompt?: string;
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-5-sonnet' | 'llama-3.3-70b';
  documents?: DocumentUpload[];
}

class FlowiseClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || FLOWISE_API_URL;
    this.apiKey = apiKey || FLOWISE_API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Chatflow management
  async createChatflow(input: CreateRAGBotInput): Promise<Chatflow> {
    // Create a basic RAG chatflow configuration
    const flowData = this.generateRAGFlowData(input);

    return this.request<Chatflow>('/api/v1/chatflows', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        flowData: JSON.stringify(flowData),
        deployed: false,
        isPublic: false,
        chatbotConfig: JSON.stringify({
          welcomeMessage: input.welcomeMessage || `Hello! I'm ${input.name}. How can I help you?`,
          botMessage: {
            backgroundColor: '#f0f0f0',
            textColor: '#000000',
          },
          userMessage: {
            backgroundColor: '#3B81F6',
            textColor: '#ffffff',
          },
        }),
      }),
    });
  }

  async getChatflow(chatflowId: string): Promise<Chatflow> {
    return this.request<Chatflow>(`/api/v1/chatflows/${chatflowId}`);
  }

  async listChatflows(): Promise<Chatflow[]> {
    return this.request<Chatflow[]>('/api/v1/chatflows');
  }

  async updateChatflow(
    chatflowId: string,
    updates: Partial<{
      name: string;
      flowData: string;
      deployed: boolean;
      isPublic: boolean;
      chatbotConfig: string;
    }>
  ): Promise<Chatflow> {
    return this.request<Chatflow>(`/api/v1/chatflows/${chatflowId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteChatflow(chatflowId: string): Promise<void> {
    await this.request(`/api/v1/chatflows/${chatflowId}`, {
      method: 'DELETE',
    });
  }

  // Deploy/undeploy
  async deployChatflow(chatflowId: string): Promise<Chatflow> {
    return this.updateChatflow(chatflowId, { deployed: true });
  }

  async undeployChatflow(chatflowId: string): Promise<Chatflow> {
    return this.updateChatflow(chatflowId, { deployed: false });
  }

  // Chat interaction
  async chat(
    chatflowId: string,
    message: string,
    options?: {
      sessionId?: string;
      overrideConfig?: Record<string, unknown>;
    }
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v1/prediction/' + chatflowId, {
      method: 'POST',
      body: JSON.stringify({
        question: message,
        sessionId: options?.sessionId,
        overrideConfig: options?.overrideConfig,
      }),
    });
  }

  // Document management
  async uploadDocument(
    chatflowId: string,
    document: DocumentUpload
  ): Promise<{ id: string; status: string }> {
    // Upload document to vector store associated with chatflow
    return this.request(`/api/v1/vector/upsert/${chatflowId}`, {
      method: 'POST',
      body: JSON.stringify({
        overrideConfig: {
          docs: [
            {
              pageContent: Buffer.from(document.content, 'base64').toString('utf-8'),
              metadata: {
                source: document.name,
                type: document.type,
              },
            },
          ],
        },
      }),
    });
  }

  async deleteDocuments(chatflowId: string): Promise<void> {
    await this.request(`/api/v1/vector/${chatflowId}`, {
      method: 'DELETE',
    });
  }

  // Generate basic RAG flow data
  private generateRAGFlowData(input: CreateRAGBotInput) {
    // This generates a basic RAG chatflow structure for Flowise
    // In production, this would be more sophisticated
    return {
      nodes: [
        {
          id: 'chatOpenAI_0',
          type: 'customNode',
          data: {
            id: 'chatOpenAI_0',
            label: 'Chat Model',
            name: 'chatOpenAI',
            inputs: {
              modelName: input.model || 'gpt-4o-mini',
              temperature: 0.7,
            },
          },
          position: { x: 400, y: 200 },
        },
        {
          id: 'vectorStore_0',
          type: 'customNode',
          data: {
            id: 'vectorStore_0',
            label: 'Vector Store',
            name: 'supabaseVectorStore',
            inputs: {},
          },
          position: { x: 100, y: 200 },
        },
        {
          id: 'conversationalChain_0',
          type: 'customNode',
          data: {
            id: 'conversationalChain_0',
            label: 'Conversational Chain',
            name: 'conversationalRetrievalQAChain',
            inputs: {
              systemMessage: input.systemPrompt || `You are a helpful AI assistant for ${input.name}. Answer questions based on the provided context.`,
            },
          },
          position: { x: 250, y: 400 },
        },
      ],
      edges: [
        { source: 'vectorStore_0', target: 'conversationalChain_0' },
        { source: 'chatOpenAI_0', target: 'conversationalChain_0' },
      ],
    };
  }

  // Widget embed code generator
  getEmbedCode(
    chatflowId: string,
    options?: {
      position?: 'bottom-right' | 'bottom-left';
      theme?: 'light' | 'dark';
      width?: number;
      height?: number;
    }
  ): string {
    const config = {
      chatflowId,
      apiHost: this.apiUrl,
      theme: {
        button: {
          backgroundColor: '#3B81F6',
          right: options?.position === 'bottom-left' ? undefined : 20,
          left: options?.position === 'bottom-left' ? 20 : undefined,
          bottom: 20,
          size: 'medium',
          iconColor: 'white',
        },
        chatWindow: {
          title: 'Chat with us',
          backgroundColor: options?.theme === 'dark' ? '#1a1a1a' : '#ffffff',
          width: options?.width || 400,
          height: options?.height || 600,
        },
      },
    };

    return `<!-- ALLONE RAG Chatbot Widget -->
<script type="module">
  import Chatbot from 'https://cdn.jsdelivr.net/npm/flowise-embed/dist/web.js';
  Chatbot.init(${JSON.stringify(config, null, 2)});
</script>`;
  }

  // Alternative: iframe embed
  getIframeEmbed(chatflowId: string, options?: { width?: string; height?: string }): string {
    const width = options?.width || '100%';
    const height = options?.height || '600px';

    return `<!-- ALLONE RAG Chatbot (iframe) -->
<iframe
  src="${this.apiUrl}/chatbot/${chatflowId}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="microphone"
  style="border: none; border-radius: 8px;"
></iframe>`;
  }
}

export const flowiseClient = new FlowiseClient();
export default FlowiseClient;
