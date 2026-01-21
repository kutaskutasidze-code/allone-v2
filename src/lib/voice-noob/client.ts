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

  // Agent CRUD - using /api/v1/ prefix
  async createAgent(input: CreateAgentInput): Promise<VoiceAgent> {
    return this.request<VoiceAgent>('/api/v1/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        system_prompt: input.system_prompt,
        voice: input.voice_id || 'alloy',
        pricing_tier: input.ai_tier || 'balanced',
        enabled_tools: input.tools || [],
      }),
    });
  }

  async getAgent(agentId: string): Promise<VoiceAgent> {
    return this.request<VoiceAgent>(`/api/v1/agents/${agentId}`);
  }

  async listAgents(): Promise<VoiceAgent[]> {
    return this.request<VoiceAgent[]>('/api/v1/agents');
  }

  async updateAgent(
    agentId: string,
    updates: Partial<CreateAgentInput>
  ): Promise<VoiceAgent> {
    return this.request<VoiceAgent>(`/api/v1/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/api/v1/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  // Phone number management
  async searchPhoneNumbers(areaCode?: string): Promise<Array<{ phone_number: string; region: string; monthly_cost: number }>> {
    const params = new URLSearchParams();
    if (areaCode) params.append('area_code', areaCode);
    return this.request(`/api/v1/telephony/phone-numbers/search?${params}`);
  }

  async purchasePhoneNumber(phoneNumber: string): Promise<{ id: string; phone_number: string }> {
    return this.request('/api/v1/telephony/phone-numbers/purchase', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  }

  async assignPhoneNumber(agentId: string): Promise<{ phone_number: string }> {
    // First search for available numbers
    const available = await this.searchPhoneNumbers();
    if (!available || available.length === 0) {
      throw new Error('No phone numbers available');
    }
    // Purchase the first available number
    const purchased = await this.purchasePhoneNumber(available[0].phone_number);
    // Update agent with the phone number
    await this.updateAgent(agentId, {});  // This might need to link the number to the agent
    return { phone_number: purchased.phone_number };
  }

  async listPhoneNumbers(): Promise<Array<{ id: string; phone_number: string; agent_id?: string }>> {
    return this.request('/api/v1/phone-numbers');
  }

  async releasePhoneNumber(phoneNumberId: string): Promise<void> {
    await this.request(`/api/v1/telephony/phone-numbers/${phoneNumberId}`, {
      method: 'DELETE',
    });
  }

  // Agent stats
  async getAgentStats(agentId: string): Promise<AgentStats> {
    return this.request<AgentStats>(`/api/v1/calls/agent/${agentId}/stats`);
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

    return this.request(`/api/v1/calls?agent_id=${agentId}&${params}`);
  }

  // Initiate outbound call
  async initiateTestCall(
    agentId: string,
    phoneNumber: string
  ): Promise<{ call_id: string }> {
    return this.request<{ call_id: string }>(
      `/api/v1/telephony/calls`,
      {
        method: 'POST',
        body: JSON.stringify({
          agent_id: agentId,
          to_number: phoneNumber,
        }),
      }
    );
  }

  // Get agent embed info
  async getAgentEmbed(agentId: string): Promise<{ public_id: string; embed_url: string }> {
    return this.request(`/api/v1/agents/${agentId}/embed`);
  }

  // Widget embed code generator - uses voice-noob's embed system
  getEmbedCode(agentId: string, publicId?: string): string {
    const embedUrl = publicId
      ? `${this.apiUrl}/api/public/embed/${publicId}`
      : `${this.apiUrl}/api/v1/agents/${agentId}/embed`;

    return `<!-- ALLONE Voice AI Widget -->
<iframe
  src="${embedUrl}"
  style="position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); z-index: 9999;"
  allow="microphone"
></iframe>`;
  }
}

export const voiceNoobClient = new VoiceNoobClient();
export default VoiceNoobClient;
