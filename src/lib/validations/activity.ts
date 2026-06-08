import { z } from 'zod';

// ============================================
// Calls
// ============================================

// Q1 — Connection: did we reach a person?
export const CALL_OUTCOMES = [
  { value: 'contacted', label: 'Contacted' },
  { value: 'no_answer', label: 'No answer' },
  { value: 'wrong_number', label: 'Wrong number' },
] as const;

export const CALL_OUTCOME_LABELS: Record<string, string> = Object.fromEntries(
  CALL_OUTCOMES.map((o) => [o.value, o.label]),
);

// Q2 — Disposition: the result, only meaningful when the call was "contacted".
export const CALL_DISPOSITIONS = [
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'callback_requested', label: 'Wants a callback' },
] as const;

export const CALL_DISPOSITION_LABELS: Record<string, string> = Object.fromEntries(
  CALL_DISPOSITIONS.map((d) => [d.value, d.label]),
);

export const callOutcomeSchema = z.enum(['contacted', 'no_answer', 'wrong_number']);
export const callDispositionSchema = z.enum([
  'interested',
  'not_interested',
  'callback_requested',
]);

export const callDirectionSchema = z.enum(['outbound', 'inbound']);

// NOTE: lead_id comes from the route param, NOT the body. `disposition` is only
// allowed when the call connected (outcome='contacted').
export const createCallSchema = z
  .object({
    outcome: callOutcomeSchema,
    disposition: callDispositionSchema.optional(),
    direction: callDirectionSchema.default('outbound'),
    duration_seconds: z.number().int().min(0, 'Duration cannot be negative').optional(),
    notes: z.string().optional().transform((val) => val || null),
    occurred_at: z.string().datetime({ offset: true }).optional(),
  })
  .refine((d) => d.disposition === undefined || d.outcome === 'contacted', {
    message: 'A disposition is only allowed when the call was contacted',
    path: ['disposition'],
  });

// ============================================
// Tasks
// ============================================

export const TASK_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const taskStatusSchema = z.enum(['open', 'done', 'cancelled']);

// Accept an ISO datetime string or `null` to clear. Empty string also clears.
const isoOrNull = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v === '' || v === undefined ? undefined : v));

export const createTaskSchema = z.object({
  lead_id: z.string().uuid('Invalid ID format'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').default('Follow up'),
  due_at: isoOrNull,
  notes: z.string().optional().transform((val) => val || null),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  due_at: isoOrNull,
  status: taskStatusSchema.optional(),
  notes: z.string().optional().transform((val) => (val === undefined ? undefined : val || null)),
});

// ============================================
// Meetings
// ============================================

export const MEETING_STATUSES = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'held', label: 'Held' },
  { value: 'no_show', label: 'No-show' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const meetingStatusSchema = z.enum([
  'scheduled',
  'held',
  'no_show',
  'cancelled',
]);

// NOTE: lead_id comes from the route param, NOT the body.
export const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').default('Meeting'),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).optional(),
  location: z.string().max(255, 'Location too long').optional().transform((val) => val || null),
  notes: z.string().optional().transform((val) => val || null),
});

export const updateMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
  ends_at: z.string().datetime({ offset: true }).optional(),
  location: z.string().max(255).optional().transform((val) => (val === undefined ? undefined : val || null)),
  status: meetingStatusSchema.optional(),
  notes: z.string().optional().transform((val) => (val === undefined ? undefined : val || null)),
});

// ============================================
// Type Exports
// ============================================

export type CallOutcomeValue = z.infer<typeof callOutcomeSchema>;
export type CreateCall = z.infer<typeof createCallSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type CreateMeeting = z.infer<typeof createMeetingSchema>;
export type UpdateMeeting = z.infer<typeof updateMeetingSchema>;
