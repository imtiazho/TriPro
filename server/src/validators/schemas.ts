import { z } from 'zod';

export const createObligationSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  framework: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['not_started', 'in_progress', 'pending_review', 'compliant', 'non_compliant', 'needs_attention']).optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().or(z.date()),
  reviewDate: z.string().or(z.date()).optional(),
  recurrence: z.enum(['none', 'monthly', 'quarterly', 'annual']).optional(),
});

export const updateObligationSchema = createObligationSchema.partial().extend({
  statusNote: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().optional(),
  obligationId: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  dueDate: z.string().or(z.date()),
  recurrence: z.enum(['none', 'weekly', 'monthly', 'quarterly', 'annual']).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['todo', 'in_progress', 'under_review', 'completed', 'cancelled']).optional(),
  dueDate: z.string().or(z.date()).optional(),
  comment: z.string().optional(),
});

export const createVendorSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().optional(),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  assignedOwnerId: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  riskScore: z.number().min(0).max(100).optional(),
  contractStartDate: z.string().or(z.date()).optional(),
  contractExpiryDate: z.string().or(z.date()).optional(),
});

export const createRiskSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  category: z.string().optional(),
  likelihood: z.number().min(1).max(5),
  impact: z.number().min(1).max(5),
  status: z.enum(['open', 'mitigating', 'accepted', 'resolved']).optional(),
  ownerId: z.string().optional(),
  mitigationPlan: z.string().optional(),
  relatedObligationId: z.string().optional(),
  relatedVendorId: z.string().optional(),
});

export const createFindingSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(5),
  source: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'action_plan_pending', 'in_remediation', 'verified_closed']).optional(),
  ownerId: z.string().optional(),
  rootCause: z.string().optional(),
  linkedObligationId: z.string().optional(),
});

export const createCorrectiveActionSchema = z.object({
  title: z.string().min(3),
  actionPlan: z.string().min(5),
  assignedTo: z.string().optional(),
  targetDate: z.string().or(z.date()),
});

export const createPolicySchema = z.object({
  title: z.string().min(3).max(255),
  code: z.string().min(2).max(50),
  category: z.string().optional(),
  version: z.string().optional(),
  status: z.enum(['draft', 'under_review', 'published', 'archived']).optional(),
  content: z.string().optional(),
  effectiveDate: z.string().or(z.date()).optional(),
  reviewDate: z.string().or(z.date()).optional(),
});
