import { z } from 'zod';

// A single installment. lead_id comes from the route param, NOT the body.
// `paid: true` records it as already collected (paid_at = now).
const installmentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date')
    .optional(),
  label: z.string().max(120).optional().transform((v) => v || null),
  note: z.string().max(500).optional().transform((v) => v || null),
  paid: z.boolean().optional(),
});

// POST accepts a batch so one call covers single-add (1), a 30/70 split (2),
// or a monthly plan (N).
export const createPaymentsSchema = z.object({
  installments: z.array(installmentSchema).min(1).max(50),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  due_date: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'), z.null()])
    .optional(),
  label: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  note: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null)),
  // true → mark collected (paid_at = now); false → mark owed again (paid_at = null)
  paid: z.boolean().optional(),
});

export type CreatePayments = z.infer<typeof createPaymentsSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
