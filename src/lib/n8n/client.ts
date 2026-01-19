/**
 * n8n API Client
 * Wraps n8n for creating and managing workflow automations
 */

const N8N_API_URL = process.env.N8N_API_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
  settings?: WorkflowSettings;
  staticData?: unknown;
  tags?: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
  credentials?: Record<string, { id: string; name: string }>;
}

export interface WorkflowSettings {
  executionOrder?: 'v0' | 'v1';
  saveManualExecutions?: boolean;
  callerPolicy?: 'any' | 'none' | 'workflowsFromSameOwner';
  errorWorkflow?: string;
}

export interface Execution {
  id: string;
  finished: boolean;
  mode: 'manual' | 'trigger' | 'webhook';
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  data?: unknown;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
  thumbnail?: string;
}

// Pre-built automation templates
export const AUTOMATION_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'lead-notification',
    name: 'Lead Notification',
    description: 'Get Slack/Email notifications when new leads come in',
    category: 'crm',
    thumbnail: '/templates/lead-notification.png',
    nodes: [
      {
        id: 'webhook_1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        position: [250, 300],
        parameters: { path: 'lead-notification', httpMethod: 'POST' },
      },
      {
        id: 'slack_1',
        name: 'Slack',
        type: 'n8n-nodes-base.slack',
        position: [500, 300],
        parameters: {
          channel: '#leads',
          text: 'New lead: {{$json.name}} - {{$json.email}}',
        },
      },
    ],
    connections: { webhook_1: { main: [[{ node: 'slack_1', type: 'main', index: 0 }]] } },
  },
  {
    id: 'daily-report',
    name: 'Daily Report',
    description: 'Send daily summary reports via email',
    category: 'reporting',
    thumbnail: '/templates/daily-report.png',
    nodes: [
      {
        id: 'schedule_1',
        name: 'Schedule',
        type: 'n8n-nodes-base.scheduleTrigger',
        position: [250, 300],
        parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 24 }] } },
      },
      {
        id: 'http_1',
        name: 'Get Data',
        type: 'n8n-nodes-base.httpRequest',
        position: [450, 300],
        parameters: { url: '{{$env.API_URL}}/api/analytics/daily' },
      },
      {
        id: 'email_1',
        name: 'Send Email',
        type: 'n8n-nodes-base.emailSend',
        position: [650, 300],
        parameters: {
          toEmail: '{{$env.REPORT_EMAIL}}',
          subject: 'Daily Report - {{$today}}',
        },
      },
    ],
    connections: {
      schedule_1: { main: [[{ node: 'http_1', type: 'main', index: 0 }]] },
      http_1: { main: [[{ node: 'email_1', type: 'main', index: 0 }]] },
    },
  },
  {
    id: 'social-media-post',
    name: 'Social Media Auto-Post',
    description: 'Automatically post content to multiple social platforms',
    category: 'marketing',
    thumbnail: '/templates/social-post.png',
    nodes: [
      {
        id: 'webhook_1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        position: [250, 300],
        parameters: { path: 'social-post', httpMethod: 'POST' },
      },
      {
        id: 'twitter_1',
        name: 'Twitter',
        type: 'n8n-nodes-base.twitter',
        position: [500, 200],
        parameters: { text: '{{$json.content}}' },
      },
      {
        id: 'linkedin_1',
        name: 'LinkedIn',
        type: 'n8n-nodes-base.linkedIn',
        position: [500, 400],
        parameters: { text: '{{$json.content}}' },
      },
    ],
    connections: {
      webhook_1: {
        main: [
          [
            { node: 'twitter_1', type: 'main', index: 0 },
            { node: 'linkedin_1', type: 'main', index: 0 },
          ],
        ],
      },
    },
  },
  {
    id: 'appointment-reminder',
    name: 'Appointment Reminder',
    description: 'Send SMS/Email reminders before appointments',
    category: 'scheduling',
    thumbnail: '/templates/reminder.png',
    nodes: [
      {
        id: 'schedule_1',
        name: 'Check Appointments',
        type: 'n8n-nodes-base.scheduleTrigger',
        position: [250, 300],
        parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } },
      },
      {
        id: 'postgres_1',
        name: 'Get Appointments',
        type: 'n8n-nodes-base.postgres',
        position: [450, 300],
        parameters: {
          operation: 'executeQuery',
          query: "SELECT * FROM appointments WHERE starts_at BETWEEN NOW() AND NOW() + INTERVAL '24 hours'",
        },
      },
      {
        id: 'twilio_1',
        name: 'Send SMS',
        type: 'n8n-nodes-base.twilio',
        position: [650, 300],
        parameters: {
          to: '={{$json.phone}}',
          message: 'Reminder: Your appointment is tomorrow at {{$json.starts_at}}',
        },
      },
    ],
    connections: {
      schedule_1: { main: [[{ node: 'postgres_1', type: 'main', index: 0 }]] },
      postgres_1: { main: [[{ node: 'twilio_1', type: 'main', index: 0 }]] },
    },
  },
  {
    id: 'invoice-automation',
    name: 'Invoice Automation',
    description: 'Generate and send invoices automatically',
    category: 'finance',
    thumbnail: '/templates/invoice.png',
    nodes: [
      {
        id: 'webhook_1',
        name: 'Order Completed',
        type: 'n8n-nodes-base.webhook',
        position: [250, 300],
        parameters: { path: 'order-completed', httpMethod: 'POST' },
      },
      {
        id: 'stripe_1',
        name: 'Create Invoice',
        type: 'n8n-nodes-base.stripe',
        position: [450, 300],
        parameters: {
          operation: 'create',
          resource: 'invoice',
          customer: '={{$json.customer_id}}',
        },
      },
      {
        id: 'email_1',
        name: 'Send Invoice',
        type: 'n8n-nodes-base.emailSend',
        position: [650, 300],
        parameters: {
          toEmail: '={{$json.email}}',
          subject: 'Invoice #{{$json.invoice_number}}',
        },
      },
    ],
    connections: {
      webhook_1: { main: [[{ node: 'stripe_1', type: 'main', index: 0 }]] },
      stripe_1: { main: [[{ node: 'email_1', type: 'main', index: 0 }]] },
    },
  },
];

class N8nClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl?: string, apiKey?: string) {
    this.apiUrl = apiUrl || N8N_API_URL;
    this.apiKey = apiKey || N8N_API_KEY;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.apiUrl}/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Workflow CRUD
  async createWorkflow(
    name: string,
    options?: {
      nodes?: WorkflowNode[];
      connections?: Record<string, unknown>;
      settings?: WorkflowSettings;
    }
  ): Promise<Workflow> {
    return this.request<Workflow>('/workflows', {
      method: 'POST',
      body: JSON.stringify({
        name,
        nodes: options?.nodes || [],
        connections: options?.connections || {},
        settings: options?.settings || { executionOrder: 'v1' },
      }),
    });
  }

  async createFromTemplate(
    templateId: string,
    name: string
  ): Promise<Workflow> {
    const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.createWorkflow(name, {
      nodes: template.nodes,
      connections: template.connections,
    });
  }

  async getWorkflow(workflowId: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${workflowId}`);
  }

  async listWorkflows(): Promise<{ data: Workflow[] }> {
    return this.request<{ data: Workflow[] }>('/workflows');
  }

  async updateWorkflow(
    workflowId: string,
    updates: Partial<{
      name: string;
      nodes: WorkflowNode[];
      connections: Record<string, unknown>;
      settings: WorkflowSettings;
    }>
  ): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.request(`/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  }

  // Activate/deactivate
  async activateWorkflow(workflowId: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${workflowId}/activate`, {
      method: 'POST',
    });
  }

  async deactivateWorkflow(workflowId: string): Promise<Workflow> {
    return this.request<Workflow>(`/workflows/${workflowId}/deactivate`, {
      method: 'POST',
    });
  }

  // Executions
  async executeWorkflow(
    workflowId: string,
    data?: Record<string, unknown>
  ): Promise<Execution> {
    return this.request<Execution>(`/workflows/${workflowId}/run`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  async getExecution(executionId: string): Promise<Execution> {
    return this.request<Execution>(`/executions/${executionId}`);
  }

  async listExecutions(
    workflowId?: string,
    options?: { limit?: number; status?: string }
  ): Promise<{ data: Execution[] }> {
    const params = new URLSearchParams();
    if (workflowId) params.append('workflowId', workflowId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.status) params.append('status', options.status);

    return this.request<{ data: Execution[] }>(`/executions?${params}`);
  }

  // Templates
  getTemplates(category?: string): WorkflowTemplate[] {
    if (category) {
      return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
    }
    return AUTOMATION_TEMPLATES;
  }

  getTemplateCategories(): string[] {
    return [...new Set(AUTOMATION_TEMPLATES.map((t) => t.category))];
  }

  // Webhook URL generator
  getWebhookUrl(workflowId: string, webhookPath: string): string {
    return `${this.apiUrl}/webhook/${webhookPath}`;
  }

  // Get workflow editor URL (for embedding or redirecting)
  getEditorUrl(workflowId: string): string {
    return `${this.apiUrl}/workflow/${workflowId}`;
  }

  // Embed code for workflow status/trigger widget
  getEmbedCode(workflowId: string, webhookPath?: string): string {
    const webhookUrl = webhookPath
      ? this.getWebhookUrl(workflowId, webhookPath)
      : null;

    return `<!-- ALLONE Automation Widget -->
<div id="allone-automation-${workflowId}" class="allone-automation-widget">
  <style>
    .allone-automation-widget {
      font-family: system-ui, -apple-system, sans-serif;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
    }
    .allone-automation-status { display: flex; align-items: center; gap: 8px; }
    .allone-automation-status .dot { width: 8px; height: 8px; border-radius: 50%; }
    .allone-automation-status .dot.active { background: #10b981; }
    .allone-automation-status .dot.inactive { background: #6b7280; }
    .allone-automation-trigger { margin-top: 12px; }
    .allone-automation-trigger button {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .allone-automation-trigger button:hover { background: #2563eb; }
  </style>
  <div class="allone-automation-status">
    <span class="dot" id="status-dot-${workflowId}"></span>
    <span id="status-text-${workflowId}">Loading...</span>
  </div>
  ${
    webhookUrl
      ? `
  <div class="allone-automation-trigger">
    <button onclick="triggerWorkflow_${workflowId}()">Trigger Automation</button>
  </div>
  <script>
    async function triggerWorkflow_${workflowId}() {
      try {
        await fetch('${webhookUrl}', { method: 'POST' });
        alert('Automation triggered!');
      } catch (e) {
        alert('Failed to trigger automation');
      }
    }
  </script>
  `
      : ''
  }
</div>`;
  }
}

export const n8nClient = new N8nClient();
export default N8nClient;
