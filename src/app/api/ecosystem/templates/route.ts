/**
 * GET /api/ecosystem/templates
 * Get available templates for all product types
 */

import { NextRequest, NextResponse } from 'next/server';
import { B0T_TEMPLATES } from '@/lib/b0t/client';

// Voice agent templates
const VOICE_AGENT_TEMPLATES = {
  'receptionist': {
    name: 'AI Receptionist',
    description: 'Answer calls, take messages, and transfer to the right person',
    category: 'business',
    system_prompt: `You are a professional AI receptionist. Your job is to:
1. Greet callers warmly and professionally
2. Determine the purpose of their call
3. Take detailed messages including caller name, phone number, and reason for calling
4. Transfer calls to the appropriate department when requested
5. Schedule callbacks if the person is unavailable

Always be polite, patient, and helpful. Ask clarifying questions when needed.`,
    voice_id: 'alloy',
    ai_tier: 'balanced',
    tools: ['transfer_call', 'take_message', 'schedule_callback', 'end_call'],
  },
  'appointment-booking': {
    name: 'Appointment Scheduler',
    description: 'Book, reschedule, and manage appointments via phone',
    category: 'scheduling',
    system_prompt: `You are an AI appointment scheduling assistant. Your job is to:
1. Help callers book new appointments
2. Reschedule or cancel existing appointments
3. Provide available time slots
4. Confirm appointment details
5. Send reminders

Always verify the caller's information and confirm all details before finalizing.`,
    voice_id: 'nova',
    ai_tier: 'premium_mini',
    tools: ['check_availability', 'book_appointment', 'reschedule', 'cancel', 'end_call'],
  },
  'customer-service': {
    name: 'Customer Service Agent',
    description: 'Handle common customer inquiries and support requests',
    category: 'support',
    system_prompt: `You are a helpful customer service AI agent. Your job is to:
1. Listen to customer concerns patiently
2. Answer common questions about products/services
3. Help troubleshoot basic issues
4. Escalate complex issues to human agents
5. Log all interactions for follow-up

Be empathetic, solution-focused, and professional at all times.`,
    voice_id: 'shimmer',
    ai_tier: 'premium',
    tools: ['lookup_order', 'check_status', 'create_ticket', 'transfer_to_human', 'end_call'],
  },
  'sales-qualifier': {
    name: 'Sales Qualifier',
    description: 'Pre-qualify leads before transferring to sales team',
    category: 'sales',
    system_prompt: `You are a sales qualification AI. Your job is to:
1. Engage potential customers in friendly conversation
2. Understand their needs and pain points
3. Qualify them based on budget, timeline, and decision-making authority
4. Collect contact information
5. Schedule meetings with sales representatives for qualified leads

Be conversational, not pushy. Focus on understanding their needs first.`,
    voice_id: 'echo',
    ai_tier: 'premium',
    tools: ['qualify_lead', 'schedule_meeting', 'transfer_to_sales', 'end_call'],
  },
};

// RAG bot templates
const RAG_BOT_TEMPLATES = {
  'customer-support': {
    name: 'Customer Support Bot',
    description: 'Answer FAQs and help customers find information',
    category: 'support',
    system_prompt: `You are a helpful customer support assistant. Answer questions based on the knowledge base provided.
If you don't know the answer, politely say so and offer to connect them with a human agent.
Always be friendly, professional, and solution-oriented.`,
    welcome_message: "Hello! I'm here to help you with any questions. What can I assist you with today?",
  },
  'documentation': {
    name: 'Documentation Bot',
    description: 'Help users navigate and find information in documentation',
    category: 'docs',
    system_prompt: `You are a documentation assistant. Help users find relevant information in the documentation.
Provide clear, accurate answers with references to specific sections when possible.
If a question is outside the documentation scope, let the user know.`,
    welcome_message: "Hi! I can help you find information in our documentation. What are you looking for?",
  },
  'sales-assistant': {
    name: 'Sales Assistant',
    description: 'Answer product questions and help qualify leads',
    category: 'sales',
    system_prompt: `You are a knowledgeable sales assistant. Answer product questions accurately and help potential customers understand how products can solve their problems.
Gather relevant information about their needs but don't be pushy.
Offer to connect them with a sales representative for detailed discussions.`,
    welcome_message: "Hello! I'm here to help you learn about our products. What questions do you have?",
  },
  'internal-wiki': {
    name: 'Internal Wiki Bot',
    description: 'Help employees find company information and policies',
    category: 'internal',
    system_prompt: `You are an internal company assistant. Help employees find information about company policies, procedures, and resources.
Be helpful and direct. If information isn't available in the wiki, suggest who might be able to help.`,
    welcome_message: "Hi there! I can help you find company information. What do you need to know?",
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const category = searchParams.get('category');

  const templates: Record<string, unknown> = {};

  // Automation templates
  if (!type || type === 'automation') {
    const automationTemplates = Object.entries(B0T_TEMPLATES).map(([id, template]) => ({
      id,
      type: 'automation',
      ...template,
    }));

    templates.automation = category
      ? automationTemplates.filter(t => t.category === category)
      : automationTemplates;
  }

  // Voice agent templates
  if (!type || type === 'voice_agent') {
    const voiceTemplates = Object.entries(VOICE_AGENT_TEMPLATES).map(([id, template]) => ({
      id,
      type: 'voice_agent',
      ...template,
    }));

    templates.voice_agent = category
      ? voiceTemplates.filter(t => t.category === category)
      : voiceTemplates;
  }

  // RAG bot templates
  if (!type || type === 'rag_bot') {
    const ragTemplates = Object.entries(RAG_BOT_TEMPLATES).map(([id, template]) => ({
      id,
      type: 'rag_bot',
      ...template,
    }));

    templates.rag_bot = category
      ? ragTemplates.filter(t => t.category === category)
      : ragTemplates;
  }

  // Get all unique categories
  const allCategories = [
    ...new Set([
      ...Object.values(B0T_TEMPLATES).map(t => t.category),
      ...Object.values(VOICE_AGENT_TEMPLATES).map(t => t.category),
      ...Object.values(RAG_BOT_TEMPLATES).map(t => t.category),
    ]),
  ];

  return NextResponse.json({
    templates,
    categories: allCategories,
    types: ['automation', 'voice_agent', 'rag_bot'],
  });
}

export { VOICE_AGENT_TEMPLATES, RAG_BOT_TEMPLATES };
