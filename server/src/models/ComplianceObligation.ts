import mongoose, { Document, Schema, Types } from 'mongoose';

export type ObligationStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'compliant'
  | 'non_compliant'
  | 'needs_attention';

export type ObligationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IComplianceObligation extends Document {
  organizationId: Types.ObjectId;
  title: string;
  description: string;
  framework: string;
  category: string;
  priority: ObligationPriority;
  status: ObligationStatus;
  assignedTo?: Types.ObjectId;
  dueDate: Date;
  reviewDate?: Date;
  recurrence: 'none' | 'monthly' | 'quarterly' | 'annual';
  evidenceIds: Types.ObjectId[];
  linkedTaskIds: Types.ObjectId[];
  linkedRiskIds: Types.ObjectId[];
  linkedPolicyIds: Types.ObjectId[];
  isArchived: boolean;
  history: Array<{
    changedBy: Types.ObjectId;
    previousStatus?: ObligationStatus;
    newStatus: ObligationStatus;
    note?: string;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceObligationSchema = new Schema<IComplianceObligation>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    framework: {
      type: String,
      required: true,
      default: 'General Compliance',
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Labor & Employment',
        'Data Protection & Cybersecurity',
        'Corporate & Tax',
        'Environmental & Safety',
        'Industry Specific',
        'Vendor Management',
      ],
      default: 'Labor & Employment',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'not_started',
        'in_progress',
        'pending_review',
        'compliant',
        'non_compliant',
        'needs_attention',
      ],
      default: 'not_started',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    reviewDate: {
      type: Date,
    },
    recurrence: {
      type: String,
      enum: ['none', 'monthly', 'quarterly', 'annual'],
      default: 'none',
    },
    evidenceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'EvidenceDocument',
      },
    ],
    linkedTaskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ComplianceTask',
      },
    ],
    linkedRiskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Risk',
      },
    ],
    linkedPolicyIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Policy',
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    history: [
      {
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        previousStatus: { type: String },
        newStatus: { type: String, required: true },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// High Performance Compound Indexes for ECM workflows
ComplianceObligationSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
ComplianceObligationSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
ComplianceObligationSchema.index({ organizationId: 1, category: 1, createdAt: -1 });
ComplianceObligationSchema.index({ organizationId: 1, isArchived: 1 });

export const ComplianceObligation = mongoose.model<IComplianceObligation>(
  'ComplianceObligation',
  ComplianceObligationSchema
);
