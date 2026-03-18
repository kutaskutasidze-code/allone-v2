import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

const uuidSchema = z.string().uuid('Invalid ID format');

const displayOrderSchema = z.number().int().min(0).optional();

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  image_url: z.string().url('Invalid image URL').nullable().optional(),
  category: z.string().min(1, 'Category is required').max(100),
  technologies: z.array(z.string()).default([]),
  is_published: z.boolean().default(true),
  display_order: displayOrderSchema,
  revenue: z.number().min(0, 'Revenue cannot be negative').default(0),
  contract_url: z.string().url('Invalid contract URL').nullable().optional(),
  invoice_url: z.string().url('Invalid invoice URL').nullable().optional(),
  project_date: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  image_url: z.string().url().nullable().optional(),
  category: z.string().min(1).max(100).optional(),
  technologies: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  display_order: displayOrderSchema,
  revenue: z.number().min(0).optional(),
  contract_url: z.string().url().nullable().optional(),
  invoice_url: z.string().url().nullable().optional(),
  project_date: z.string().optional(),
});

// ============================================
// Service Schemas
// ============================================

const serviceStatSchema = z.object({
  value: z.string().min(1, 'Stat value is required'),
  label: z.string().min(1, 'Stat label is required'),
});

const cardTypeSchema = z.enum(['chatbot', 'custom_ai', 'workflow', 'website', 'consulting', '']).nullable().optional();

export const createServiceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  icon: z.string().min(1, 'Icon is required').max(100),
  features: z.array(z.string()).default([]),
  subtitle: z.string().max(255).nullable().optional(),
  secondary_description: z.string().nullable().optional(),
  stats: z.array(serviceStatSchema).default([]),
  footer_text: z.string().max(255).nullable().optional(),
  cta_text: z.string().max(100).nullable().optional(),
  cta_url: z.string().max(255).nullable().optional(),
  card_type: cardTypeSchema,
  is_published: z.boolean().default(true),
  display_order: displayOrderSchema,
});

export const updateServiceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  icon: z.string().min(1).max(100).optional(),
  features: z.array(z.string()).optional(),
  subtitle: z.string().max(255).nullable().optional(),
  secondary_description: z.string().nullable().optional(),
  stats: z.array(serviceStatSchema).optional(),
  footer_text: z.string().max(255).nullable().optional(),
  cta_text: z.string().max(100).nullable().optional(),
  cta_url: z.string().max(255).nullable().optional(),
  card_type: cardTypeSchema,
  is_published: z.boolean().optional(),
  display_order: displayOrderSchema,
});

// ============================================
// Client Schemas
// ============================================

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  logo_text: z.string().min(1, 'Logo text is required').max(255),
  logo_url: z.string().url('Invalid logo URL').nullable().optional(),
  is_published: z.boolean().default(true),
  display_order: displayOrderSchema,
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logo_text: z.string().min(1).max(255).optional(),
  logo_url: z.string().url().nullable().optional(),
  is_published: z.boolean().optional(),
  display_order: displayOrderSchema,
});

// ============================================
// Stats Schemas
// ============================================

export const createStatSchema = z.object({
  value: z.string().min(1, 'Value is required').max(50, 'Value too long'),
  label: z.string().min(1, 'Label is required').max(100, 'Label too long'),
  display_order: displayOrderSchema,
});

export const updateStatSchema = z.object({
  value: z.string().min(1).max(50).optional(),
  label: z.string().min(1).max(100).optional(),
  display_order: displayOrderSchema,
});

export const batchUpdateStatsSchema = z.object({
  stats: z.array(
    z.object({
      id: uuidSchema,
      value: z.string().min(1).max(50),
      label: z.string().min(1).max(100),
      display_order: z.number().int().min(0),
    })
  ).min(1, 'At least one stat is required'),
});

// ============================================
// Category Schemas
// ============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  display_order: displayOrderSchema,
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  display_order: displayOrderSchema,
});

// ============================================
// Company Values Schemas
// ============================================

export const createValueSchema = z.object({
  number: z.string().min(1, 'Number is required').max(10),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  display_order: displayOrderSchema,
});

export const updateValueSchema = z.object({
  number: z.string().min(1).max(10).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  display_order: displayOrderSchema,
});

// ============================================
// Contact Info Schemas
// ============================================

export const updateContactInfoSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  location: z.string().min(1, 'Location is required').max(255),
  phone: z.string().max(50).nullable().optional(),
});

// ============================================
// About Content Schemas
// ============================================

export const updateAboutContentSchema = z.object({
  hero_subtitle: z.string().max(255).optional(),
  hero_title: z.string().min(1, 'Hero title is required').optional(),
  story_subtitle: z.string().max(255).optional(),
  story_title: z.string().optional(),
  story_paragraphs: z.array(z.string()).optional(),
  values_subtitle: z.string().max(255).optional(),
  values_title: z.string().max(255).optional(),
});

// ============================================
// Contact Form Schemas
// ============================================

export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .transform(s => s.trim()),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email too long')
    .transform(s => s.trim().toLowerCase()),
  company: z.string()
    .max(200, 'Company name too long')
    .transform(s => s.trim())
    .optional(),
  service: z.string()
    .max(100)
    .default('other'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message too long')
    .transform(s => s.trim()),
});

// ============================================
// ID Parameter Schema
// ============================================

export const idParamSchema = z.object({
  id: uuidSchema,
});

// ============================================
// Type Exports
// ============================================

export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;
export type CreateService = z.infer<typeof createServiceSchema>;
export type UpdateService = z.infer<typeof updateServiceSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type CreateStat = z.infer<typeof createStatSchema>;
export type UpdateStat = z.infer<typeof updateStatSchema>;
export type BatchUpdateStats = z.infer<typeof batchUpdateStatsSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type CreateValue = z.infer<typeof createValueSchema>;
export type UpdateValue = z.infer<typeof updateValueSchema>;
export type UpdateContactInfo = z.infer<typeof updateContactInfoSchema>;
export type UpdateAboutContent = z.infer<typeof updateAboutContentSchema>;
export type ContactForm = z.infer<typeof contactFormSchema>;
