import mongoose, { Document, Schema, Types } from 'mongoose';

export type CorrectiveActionStatus = 'proposed' | 'in_progress' | 'completed' | 'verified';

export interface ICorrectiveAction extends Document {
  organizationId: Types.ObjectId;
  findingId: Types.ObjectId;
  title: string;
  actionPlan: string;
  assignedTo?: Types.ObjectId;
  targetDate: Date;
  status: CorrectiveActionStatus;
  resolutionEvidenceDocId?: Types.ObjectId;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CorrectiveActionSchema = new Schema<ICorrectiveAction>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    findingId: {
      type: Schema.Types.ObjectId,
      ref: 'Finding',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    actionPlan: {
      type: String,
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['proposed', 'in_progress', 'completed', 'verified'],
      default: 'proposed',
      index: true,
    },
    resolutionEvidenceDocId: {
      type: Schema.Types.ObjectId,
      ref: 'EvidenceDocument',
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

CorrectiveActionSchema.index({ organizationId: 1, status: 1, targetDate: 1 });
CorrectiveActionSchema.index({ organizationId: 1, findingId: 1 });

export const CorrectiveAction = mongoose.model<ICorrectiveAction>(
  'CorrectiveAction',
  CorrectiveActionSchema
);
