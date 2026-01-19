/**
 * Voice-noob API Client
 * Wraps the voice-noob backend for creating and managing Voice AI agents
 */

const VOICE_NOOB_API_URL = process.env.VOICE_NOOB_API_URL || 'http://localhost:8000';
const VOICE_NOOB_API_KEY = process.env.VOICE_NOOB_API_KEY || '';

export interface VoiceAgent {
  id: string;
  name: string;
  system_prompt: string;
  voice_id: string;
  ai_tier: 'premium' | 'premium_mini' | 'balanced' | 'budget';
  phone_number?: string;
  tools: string[];
  integrations: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentInput {
  name: string;
  system_prompt: string;
  voice_id?: string;
  ai_tier?: 'premium' | 'premium_mini' | 'balanced' | 'budget';
  tools?: string[];
}

export interface AgentStats {
  total_calls: number;
  total_minutes: number;
  avg_call_duration: number;
  success_rate: number;
}

class VoiceNoobClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || VOICE_NOOB_API_URL;
    this.apiKey = apiKey || VOICE_NOOB_API_KEY;
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
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Agent CRUD
  async createAgent(input: CreateAgentInput): Promise<VoiceAgent> {
    return this.request<VoiceAgent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        system_prompt: input.system_prompt,
        voice_id: input.voice_id || 'alloy',
        ai_tier: input.ai_tier || 'balanced',
        tools: input.tools || ['end_call'],
      }),
    });
  }

  async getAgent(agentId: string): Promise<VoiceAgent> {
    return this.request<VoiceAgent>(`/api/agents/${agentId}`);
  }

  async listAgents(): Promise<VoiceAgent[]> {
    return this.request<VoiceAgent[]>('/api/agents');
  }

  async updateAgent(
    agentId: string,
    updates: Partial<CreateAgentInput>
  ): Promise<VoiceAgent> {
    return this.request<VoiceAgent>(`/api/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/api/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  // Phone number management
  async assignPhoneNumber(agentId: string): Promise<{ phone_number: string }> {
    return this.request<{ phone_number: string }>(
      `/api/agents/${agentId}/phone`,
      { method: 'POST' }
    );
  }

  async releasePhoneNumber(agentId: string): Promise<void> {
    await this.request(`/api/agents/${agentId}/phone`, {
      method: 'DELETE',
    });
  }

  // Agent stats
  async getAgentStats(agentId: string): Promise<AgentStats> {
    return this.request<AgentStats>(`/api/agents/${agentId}/stats`);
  }

  // Call history
  async getCallHistory(
    agentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{
    calls: Array<{
      id: string;
      caller_number: string;
      duration: number;
      status: string;
      recording_url?: string;
      transcript?: string;
      created_at: string;
    }>;
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return this.request(`/api/agents/${agentId}/calls?${params}`);
  }

  // Test call
  async initiateTestCall(
    agentId: string,
    phoneNumber: string
  ): Promise<{ call_id: string }> {
    return this.request<{ call_id: string }>(
      `/api/agents/${agentId}/test-call`,
      {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneNumber }),
      }
    );
  }

  // Available voices
  async getAvailableVoices(): Promise<
    Array<{
      id: string;
      name: string;
      language: string;
      preview_url?: string;
    }>
  > {
    return this.request('/api/voices');
  }

  // Available tools/integrations
  async getAvailableTools(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      config_schema?: Record<string, unknown>;
    }>
  > {
    return this.request('/api/tools');
  }

  // Widget embed code generator
  getEmbedCode(agentId: string, options?: {
    position?: 'bottom-right' | 'bottom-left';
    theme?: 'light' | 'dark';
    buttonText?: string;
  }): string {
    const config = {
      agentId,
      position: options?.position || 'bottom-right',
      theme: options?.theme || 'light',
      buttonText: options?.buttonText || 'Talk to AI',
    };

    return `<!-- ALLONE Voice AI Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ALLONE_Voice']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id='allone-voice-widget';js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','alloneVoice','https://cdn.allone.ge/voice-widget.js'));
  alloneVoice('init', ${JSON.stringify(config)});
</script>`;
  }
}

export const voiceNoobClient = new VoiceNoobClient();
export default VoiceNoobClient;
