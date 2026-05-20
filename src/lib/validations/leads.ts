import { z } from 'zod';

export const leadStatusSchema = z.enum(['new', 'contacted', 'callback', 'qualified', 'won', 'lost', 'not_interested', 'unavailable']);

export const leadServiceSchema = z.enum(['chatbots', 'custom_ai', 'automation', 'website', 'consulting']);

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(val => val || null),
  phone: z.string().max(50).optional().transform(val => val || null),
  company: z.string().max(255).optional().transform(val => val || null),
  status: leadStatusSchema.default('new'),
  value: z.number().min(0, 'Value cannot be negative').default(0),
  source: z.string().max(100).optional().transform(val => val || null),
  notes: z.string().optional().transform(val => val || null),
  city: z.string().max(100).optional().transform(val => val || null),
  country: z.string().max(2).optional().transform(val => val || 'GE'),
  website: z.string().url('Invalid URL').max(500).optional().or(z.literal('')).transform(val => val || null),
  matched_service: leadServiceSchema.optional().or(z.literal('')).transform(val => val || null),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(val => val || null),
  phone: z.string().max(50).optional().transform(val => val || null),
  company: z.string().max(255).optional().transform(val => val || null),
  status: leadStatusSchema.optional(),
  value: z.number().min(0, 'Value cannot be negative').optional(),
  source: z.string().max(100).optional().transform(val => val || null),
  notes: z.string().optional().transform(val => val || null),
});

export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'callback', label: 'Callback' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'unavailable', label: 'Unavailable' },
] as const;

export const LEAD_SERVICES = [
  { value: 'website', label: 'Website' },
  { value: 'chatbots', label: 'Chatbots' },
  { value: 'automation', label: 'Automation' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'custom_ai', label: 'Custom AI' },
] as const;

// Hotlines = Georgian landlines (regional codes start with 3 or 4 after +995).
// Anything else (mobile +9955.../+9957..., etc.) is treated as a regular lead.
export const HOTLINE_PHONE_PREFIXES = ['+9953', '+9954'] as const;
export const HOTLINE_PHONE_PREFIX_PARAM = HOTLINE_PHONE_PREFIXES.join(',');

// Parse a comma-separated `phone_prefix` query param into a clean list.
export function parsePhonePrefixes(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(',').map(p => p.trim()).filter(Boolean);
}

export const INFOSHOP_DOMAIN = 'infoshop.ge';
export const INFOSHOP_PATTERN = /infoshop\.ge/i;

export const LEAD_SOURCES = [
  'Website',
  'Referral',
  'Cold Call',
  'LinkedIn',
  'Email Campaign',
  'Trade Show',
  'Other',
] as const;

export const LEAD_STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  callback: 'bg-teal-100 text-teal-700',
  qualified: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
  not_interested: 'bg-red-100 text-red-700',
  unavailable: 'bg-orange-100 text-orange-700',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  callback: 'Callback',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
  not_interested: 'Not Interested',
  unavailable: 'Unavailable',
};

export const LEAD_STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  contacted: '#eab308',
  callback: '#14b8a6',
  qualified: '#a855f7',
  won: '#22c55e',
  lost: '#9ca3af',
  not_interested: '#ef4444',
  unavailable: '#f97316',
};
