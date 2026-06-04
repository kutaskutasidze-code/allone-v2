import { z } from 'zod';

// ============================================
// Calls
// ============================================

export const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'busy', label: 'Busy' },
  { value: 'wrong_number', label: 'Wrong Number' },
  { value: 'callback_requested', label: 'Callback Requested' },
  { value: 'not_interested', label: 'Not Interested' },
] as const;

export const CALL_OUTCOME_LABELS: Record<string, string> = Object.fromEntries(
  CALL_OUTCOMES.map((o) => [o.value, o.label]),
);

export const callOutcomeSchema = z.enum([
  'connected',
  'no_answer',
  'voicemail',
  'busy',
  'wrong_number',
  'callback_requested',
  'not_interested',
]);

export const callDirectionSchema = z.enum(['outbound', 'inbound']);

// NOTE: lead_id comes from the route param, NOT the body.
export const createCallSchema = z.object({
  outcome: callOutcomeSchema,
  direction: callDirectionSchema.default('outbound'),
  duration_seconds: z.number().int().min(0, 'Duration cannot be negative').optional(),
  notes: z.string().optional().transform((val) => val || null),
  occurred_at: z.string().datetime({ offset: true }).optional(),
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
