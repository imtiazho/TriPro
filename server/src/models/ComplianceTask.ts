import mongoose, { Document, Schema, Types } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IComplianceTask extends Document {
  organizationId: Types.ObjectId;
  obligationId?: Types.ObjectId;
  title: string;
  description: string;
  assignedTo?: Types.ObjectId;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  completedAt?: Date;
  completedBy?: Types.ObjectId;
  recurrence: 'none' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  activityHistory: Array<{
    actorId: Types.ObjectId;
    action: string;
    comment?: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceTaskSchema = new Schema<IComplianceTask>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    obligationId: {
      type: Schema.Types.ObjectId,
      ref: 'ComplianceObligation',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'under_review', 'completed', 'cancelled'],
      default: 'todo',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    recurrence: {
      type: String,
      enum: ['none', 'weekly', 'monthly', 'quarterly', 'annual'],
      default: 'none',
    },
    activityHistory: [
      {
        actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, required: true },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

ComplianceTaskSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
ComplianceTaskSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
ComplianceTaskSchema.index({ organizationId: 1, priority: 1, dueDate: 1 });

export const ComplianceTask = mongoose.model<IComplianceTask>('ComplianceTask', ComplianceTaskSchema);
