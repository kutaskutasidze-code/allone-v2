import { z } from 'zod';

export const leadStatusSchema = z.enum(['new', 'contacted', 'qualified', 'won', 'lost']);

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email').optional().or(z.literal('')).transform(val => val || null),
  phone: z.string().max(50).optional().transform(val => val || null),
  company: z.string().max(255).optional().transform(val => val || null),
  status: leadStatusSchema.default('new'),
  value: z.number().min(0, 'Value cannot be negative').default(0),
  source: z.string().max(100).optional().transform(val => val || null),
  notes: z.string().optional().transform(val => val || null),
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
  { value: 'qualified', label: 'Qualified' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
] as const;

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
  qualified: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  won: 'Won',
  lost: 'Lost',
};
