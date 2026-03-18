/**
 * b0t Workflow Automation API Client
 * Wraps the b0t backend for creating and managing workflow automations
 * Replaces n8n with Ken Kai's more powerful 900+ function platform
 */

const B0T_API_URL = process.env.B0T_API_URL || 'http://localhost:3123';
const B0T_API_KEY = process.env.B0T_API_KEY || '';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  trigger: WorkflowTrigger;
  config: WorkflowConfig;
  createdAt: string;
  lastRun?: string;
  lastRunStatus?: 'success' | 'error' | 'pending';
  lastRunOutput?: unknown;
  runCount: number;
  conversationCount?: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'webhook' | 'schedule' | 'event';
  config: Record<string, unknown>;
}

export interface WorkflowConfig {
  steps: WorkflowStep[];
  variables?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  module: string;
  function: string;
  parameters: Record<string, unknown>;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'exists';
  value: unknown;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'queued' | 'running' | 'success' | 'error';
  trigger: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  errorStep?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  trigger?: WorkflowTrigger;
  config?: WorkflowConfig;
  organizationId?: string;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalRuns: number;
  successRate: number;
  averageDuration: number;
}

// Pre-built automation templates for common use cases
export const B0T_TEMPLATES = {
  'lead-capture': {
    name: 'Lead Capture',
    description: 'Capture leads from webhook, store in database, notify team',
    category: 'crm',
    steps: [
      {
        id: 'trigger',
        name: 'Webhook Trigger',
        module: 'core',
        function: 'webhookTrigger',
        parameters: { path: '/lead-capture' },
      },
      {
        id: 'validate',
        name: 'Validate Data',
        module: 'data',
        function: 'validateSchema',
        parameters: {
          schema: {
            email: { type: 'email', required: true },
            name: { type: 'string', required: true },
          },
        },
      },
      {
        id: 'store',
        name: 'Store Lead',
        module: 'database',
        function: 'insert',
        parameters: { table: 'leads' },
      },
      {
        id: 'notify',
        name: 'Notify Team',
        module: 'slack',
        function: 'sendMessage',
        parameters: {
          channel: '#leads',
          message: 'New lead: {{name}} ({{email}})',
        },
      },
    ],
  },
  'email-sequence': {
    name: 'Email Drip Sequence',
    description: 'Send automated email sequences with delays',
    category: 'marketing',
    steps: [
      {
        id: 'trigger',
        name: 'Event Trigger',
        module: 'core',
        function: 'eventTrigger',
        parameters: { event: 'user.signup' },
      },
      {
        id: 'email1',
        name: 'Welcome Email',
        module: 'email',
        function: 'send',
        parameters: { template: 'welcome' },
      },
      {
        id: 'delay1',
        name: 'Wait 2 Days',
        module: 'core',
        function: 'delay',
        parameters: { duration: '2d' },
      },
      {
        id: 'email2',
        name: 'Follow-up Email',
        module: 'email',
        function: 'send',
        parameters: { template: 'followup' },
      },
    ],
  },
  'social-scheduler': {
    name: 'Social Media Scheduler',
    description: 'Schedule and post content across multiple social platforms',
    category: 'social',
    steps: [
      {
        id: 'trigger',
        name: 'Schedule Trigger',
        module: 'core',
        function: 'scheduleTrigger',
        parameters: { cron: '0 9 * * *' },
      },
      {
        id: 'fetch',
        name: 'Fetch Content Queue',
        module: 'database',
        function: 'query',
        parameters: { query: 'SELECT * FROM content_queue WHERE status = pending LIMIT 1' },
      },
      {
        id: 'twitter',
        name: 'Post to Twitter',
        module: 'twitter',
        function: 'tweet',
        parameters: { text: '{{content}}' },
      },
      {
        id: 'linkedin',
        name: 'Post to LinkedIn',
        module: 'linkedin',
        function: 'createPost',
        parameters: { text: '{{content}}' },
      },
    ],
  },
  'invoice-automation': {
    name: 'Invoice Automation',
    description: 'Create invoices, send reminders, track payments',
    category: 'finance',
    steps: [
      {
        id: 'trigger',
        name: 'Webhook Trigger',
        module: 'core',
        function: 'webhookTrigger',
        parameters: { path: '/order-completed' },
      },
      {
        id: 'create',
        name: 'Create Invoice',
        module: 'stripe',
        function: 'createInvoice',
        parameters: { customerId: '{{customer_id}}' },
      },
      {
        id: 'send',
        name: 'Send Invoice Email',
        module: 'email',
        function: 'send',
        parameters: { template: 'invoice', to: '{{customer_email}}' },
      },
    ],
  },
  'customer-support': {
    name: 'Customer Support Routing',
    description: 'Route support requests to the right team member',
    category: 'support',
    steps: [
      {
        id: 'trigger',
        name: 'Email Trigger',
        module: 'email',
        function: 'onReceive',
        parameters: { inbox: 'support@' },
      },
      {
        id: 'classify',
        name: 'Classify Request',
        module: 'ai',
        function: 'classify',
        parameters: { categories: ['billing', 'technical', 'general'] },
      },
      {
        id: 'route',
        name: 'Route to Team',
        module: 'core',
        function: 'switch',
        parameters: {
          cases: {
            billing: { action: 'assign', team: 'billing' },
            technical: { action: 'assign', team: 'engineering' },
            general: { action: 'assign', team: 'support' },
          },
        },
      },
    ],
  },
  'data-sync': {
    name: 'Data Sync Pipeline',
    description: 'Sync data between systems on a schedule',
    category: 'data',
    steps: [
      {
        id: 'trigger',
        name: 'Schedule Trigger',
        module: 'core',
        function: 'scheduleTrigger',
        parameters: { cron: '0 */6 * * *' },
      },
      {
        id: 'fetch',
        name: 'Fetch Source Data',
        module: 'http',
        function: 'request',
        parameters: { url: '{{source_api}}', method: 'GET' },
      },
      {
        id: 'transform',
        name: 'Transform Data',
        module: 'data',
        function: 'transform',
        parameters: { mapping: '{{field_mapping}}' },
      },
      {
        id: 'sync',
        name: 'Sync to Destination',
        module: 'http',
        function: 'request',
        parameters: { url: '{{dest_api}}', method: 'POST', body: '{{transformed}}' },
      },
    ],
  },
};

class B0tClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || B0T_API_URL;
    this.apiKey = apiKey || B0T_API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // ==================== Workflow CRUD ====================

  async createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
    return this.request<{ workflow: Workflow }>('/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        trigger: input.trigger || { type: 'manual', config: {} },
        config: input.config || { steps: [] },
        organizationId: input.organizationId,
      }),
    }).then(res => res.workflow);
  }

  async createFromTemplate(
    templateId: keyof typeof B0T_TEMPLATES,
    name: string,
    customizations?: Partial<WorkflowConfig>
  ): Promise<Workflow> {
    const template = B0T_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const config: WorkflowConfig = {
      steps: template.steps.map((step, index) => ({
        ...step,
        id: `step_${index}`,
        ...(customizations?.steps?.[index] || {}),
      })),
      variables: customizations?.variables,
    };

    return this.createWorkflow({
      name,
      description: template.description,
      config,
    });
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    return this.request<{ workflow: Workflow }>(`/workflows/${workflowId}`)
      .then(res => res.workflow);
  }

  async listWorkflows(options?: {
    organizationId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ workflows: Workflow[]; pagination: { totalCount: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (options?.organizationId) params.append('organizationId', options.organizationId);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    return this.request(`/workflows?${params}`);
  }

  async updateWorkflow(
    workflowId: string,
    updates: Partial<CreateWorkflowInput>
  ): Promise<Workflow> {
    return this.request<{ workflow: Workflow }>(`/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }).then(res => res.workflow);
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  }

  // ==================== Workflow Execution ====================

  async runWorkflow(
    workflowId: string,
    options?: {
      triggerData?: Record<string, unknown>;
      triggerType?: string;
      priority?: number;
    }
  ): Promise<WorkflowRun> {
    return this.request<WorkflowRun>(`/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({
        triggerData: options?.triggerData || {},
        triggerType: options?.triggerType || 'manual',
        priority: options?.priority,
      }),
    });
  }

  async getWorkflowRuns(
    workflowId: string,
    options?: { limit?: number; status?: string }
  ): Promise<{ runs: WorkflowRun[] }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);

    return this.request(`/workflows/${workflowId}/runs?${params}`);
  }

  // ==================== Webhook Management ====================

  getWebhookUrl(workflowId: string, path?: string): string {
    return `${this.apiUrl}/api/workflows/${workflowId}/webhook${path ? `/${path}` : ''}`;
  }

  async triggerWebhook(
    workflowId: string,
    data: Record<string, unknown>
  ): Promise<{ success: boolean; runId?: string }> {
    return this.request(`/workflows/${workflowId}/webhook`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== AI Chat (for workflow building) ====================

  async chatWithWorkflow(
    workflowId: string,
    message: string,
    sessionId?: string
  ): Promise<{ response: string; actions?: unknown[] }> {
    return this.request(`/workflows/${workflowId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async buildFromDescription(
    description: string,
    options?: { organizationId?: string }
  ): Promise<Workflow> {
    // Use b0t's AI-powered workflow builder
    return this.request<{ workflow: Workflow }>('/workflows/build-from-plan', {
      method: 'POST',
      body: JSON.stringify({
        description,
        organizationId: options?.organizationId,
      }),
    }).then(res => res.workflow);
  }

  // ==================== Organization/Client Management ====================

  async createClient(
    name: string,
    metadata?: Record<string, unknown>
  ): Promise<{ id: string; name: string }> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify({ name, metadata }),
    });
  }

  async listClients(): Promise<{ clients: Array<{ id: string; name: string; workflowCount: number }> }> {
    return this.request('/clients');
  }

  // ==================== Credentials Management ====================

  async createCredential(
    name: string,
    type: string,
    data: Record<string, unknown>
  ): Promise<{ id: string }> {
    return this.request('/credentials', {
      method: 'POST',
      body: JSON.stringify({ name, type, data }),
    });
  }

  async listCredentials(): Promise<{ credentials: Array<{ id: string; name: string; type: string }> }> {
    return this.request('/credentials');
  }

  // ==================== Dashboard Stats ====================

  async getStats(): Promise<WorkflowStats> {
    return this.request('/dashboard/stats');
  }

  // ==================== Templates ====================

  getTemplates(category?: string) {
    const templates = Object.entries(B0T_TEMPLATES).map(([id, template]) => ({
      id,
      ...template,
    }));

    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  getTemplateCategories(): string[] {
    return [...new Set(Object.values(B0T_TEMPLATES).map(t => t.category))];
  }

  // ==================== Available Modules ====================

  async searchModules(query: string): Promise<{
    modules: Array<{
      name: string;
      description: string;
      functions: Array<{ name: string; description: string; parameters: unknown }>;
    }>;
  }> {
    return this.request('/modules/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  }
}

export const b0tClient = new B0tClient();
export default B0tClient;
